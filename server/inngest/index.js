import { Inngest } from "inngest";

import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

export const inngest = new Inngest({
  id: "movie-ticket-booking",
});

// Save a newly created Clerk user
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: {
      event: "clerk/user.created",
    },
  },
  async ({ event }) => {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      image_url,
    } = event.data;

    const userData = {
      _id: id,
      email:
        email_addresses?.[0]?.email_address || "",
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      image: image_url || "",
    };

    await User.findByIdAndUpdate(id, userData, {
      new: true,
      upsert: true,
    });

    return {
      success: true,
      message: "User created successfully.",
    };
  }
);

// Delete a Clerk user
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-with-clerk",
    triggers: {
      event: "clerk/user.deleted",
    },
  },
  async ({ event }) => {
    const { id } = event.data;

    if (!id) {
      return {
        success: false,
        message: "User ID was not provided.",
      };
    }

    await User.findByIdAndDelete(id);

    return {
      success: true,
      message: "User deleted successfully.",
    };
  }
);

// Update a Clerk user
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: {
      event: "clerk/user.updated",
    },
  },
  async ({ event }) => {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      image_url,
    } = event.data;

    if (!id) {
      return {
        success: false,
        message: "User ID was not provided.",
      };
    }

    const userData = {
      email:
        email_addresses?.[0]?.email_address || "",
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      image: image_url || "",
    };

    await User.findByIdAndUpdate(id, userData, {
      new: true,
      upsert: true,
    });

    return {
      success: true,
      message: "User updated successfully.",
    };
  }
);

// Cancel an unpaid booking and release its seats after 10 minutes
const releaseSeatsAndDeleteBooking =
  inngest.createFunction(
    {
      id: "release-seats-delete-booking",
      triggers: {
        event: "app/checkpayment",
      },
    },
    async ({ event, step }) => {
      const bookingId = event.data?.bookingId;

      if (!bookingId) {
        return {
          success: false,
          message: "Booking ID was not provided.",
        };
      }

      const tenMinutesLater = new Date(
        Date.now() + 10 * 60 * 1000
      );

      await step.sleepUntil(
        "wait-for-10-minutes",
        tenMinutesLater
      );

      return await step.run(
        "check-payment-status",
        async () => {
          const booking = await Booking.findById(
            bookingId
          );

          // The booking may have already been deleted
          if (!booking) {
            return {
              success: true,
              message: "Booking does not exist.",
            };
          }

          // Keep the booking and seats if payment succeeded
          if (booking.isPaid) {
            return {
              success: true,
              message: "Booking is already paid.",
            };
          }

          const show = await Show.findById(
            booking.show
          );

          if (show) {
            if (!show.occupiedSeats) {
              show.occupiedSeats = {};
            }

            booking.bookedSeats.forEach((seat) => {
              delete show.occupiedSeats[seat];
            });

            show.markModified("occupiedSeats");
            await show.save();
          }

          await Booking.findByIdAndDelete(
            bookingId
          );

          return {
            success: true,
            message:
              "Unpaid booking deleted and seats released.",
          };
        }
      );
    }
  );

  // Send confirmation email after successful payment
const sendBookingConfirmationEmail =
  inngest.createFunction(
    {
      id: "send-booking-confirmation-email",
      triggers: {
        event: "app/show.booked",
      },
    },
    async ({ event, step }) => {
      const { bookingId } = event.data;

      if (!bookingId) {
        throw new Error(
          "Booking ID was not provided."
        );
      }

      // Get booking, show, movie, and user details
      const booking = await step.run(
        "get-booking-details",
        async () => {
          return await Booking.findById(bookingId)
            .populate({
              path: "show",
              populate: {
                path: "movie",
                model: "Movie",
              },
            })
            .populate("user");
        }
      );

      if (!booking) {
        throw new Error("Booking not found.");
      }

      if (!booking.user) {
        throw new Error(
          "Booking user was not found."
        );
      }

      if (!booking.user.email) {
        throw new Error(
          "User email was not found."
        );
      }

      if (!booking.show?.movie) {
        throw new Error(
          "Show or movie details were not found."
        );
      }

      // Send the confirmation email
      await step.run(
        "send-confirmation-email",
        async () => {
          return await sendEmail({
            to: booking.user.email,

            subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,

            body: `
              <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>Hi ${booking.user.name || "Customer"},</h2>

                <p>
                  Your booking for
                  <strong style="color: #F84565;">
                    "${booking.show.movie.title}"
                  </strong>
                  is confirmed.
                </p>

                <p>
                  <strong>Date:</strong>
                  ${new Date(
                    booking.show.showDateTime
                  ).toLocaleDateString("en-US")}
                  <br/>

                  <strong>Time:</strong>
                  ${new Date(
                    booking.show.showDateTime
                  ).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>

                <p>
                  <strong>Seats:</strong>
                  ${booking.bookedSeats.join(", ")}
                </p>

                <p>
                  <strong>Total:</strong>
                  $${booking.amount}
                </p>

                <p>Enjoy the show! 🍿</p>

                <p>
                  Thanks for booking with us!
                  <br/>
                  <strong>QuickShow Team</strong>
                </p>
              </div>
            `,
          });
        }
      );

      return {
        success: true,
        message:
          "Booking confirmation email sent successfully.",
        bookingId: booking._id.toString(),
      };
    }
  );

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail
];