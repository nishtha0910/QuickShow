import { Inngest } from "inngest";

import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

export const inngest = new Inngest({
  id: "movie-ticket-booking",
});

// --------------------------------------------------
// Save a newly created Clerk user
// --------------------------------------------------
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

    if (!id) {
      return {
        success: false,
        message: "User ID was not provided.",
      };
    }

    const userData = {
      _id: id,

      email:
        email_addresses?.[0]?.email_address || "",

      name: `${first_name || ""} ${
        last_name || ""
      }`.trim(),

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

// --------------------------------------------------
// Delete a Clerk user
// --------------------------------------------------
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

// --------------------------------------------------
// Update a Clerk user
// --------------------------------------------------
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

      name: `${first_name || ""} ${
        last_name || ""
      }`.trim(),

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

// --------------------------------------------------
// Cancel unpaid booking and release seats
// after 10 minutes
// --------------------------------------------------
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
          const booking =
            await Booking.findById(bookingId);

          // Booking may already have been removed
          if (!booking) {
            return {
              success: true,
              message: "Booking does not exist.",
            };
          }

          // Keep paid bookings and their seats
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

// --------------------------------------------------
// Send confirmation email after payment
// --------------------------------------------------
const sendBookingConfirmationEmail =
  inngest.createFunction(
    {
      id: "send-booking-confirmation-email",
      triggers: {
        event: "app/show.booked",
      },
    },
    async ({ event, step }) => {
      const bookingId = event.data?.bookingId;

      if (!bookingId) {
        throw new Error(
          "Booking ID was not provided."
        );
      }

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
            .populate("user")
            .lean();
        }
      );

      if (!booking) {
        throw new Error("Booking not found.");
      }

      if (!booking.user?.email) {
        throw new Error(
          "Booking user email was not found."
        );
      }

      if (!booking.show?.movie) {
        throw new Error(
          "Show or movie details were not found."
        );
      }

      await step.run(
        "send-confirmation-email",
        async () => {
          return await sendEmail({
            to: booking.user.email,

            subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,

            body: `
              <div
                style="
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  padding: 20px;
                "
              >
                <h2>
                  Hi ${booking.user.name || "Customer"},
                </h2>

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
                  ).toLocaleDateString("en-CA", {
                    timeZone: "America/Toronto",
                  })}
                  <br/>

                  <strong>Time:</strong>
                  ${new Date(
                    booking.show.showDateTime
                  ).toLocaleTimeString("en-CA", {
                    timeZone: "America/Toronto",
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
                  CAD $${booking.amount}
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

// --------------------------------------------------
// Send reminder emails approximately
// 8 hours before the show
// --------------------------------------------------
const sendShowReminders =
  inngest.createFunction(
    {
      id: "send-show-reminders",

      // Run every 8 hours
      triggers: {
        cron: "0 */8 * * *",
      },
    },
    async ({ step }) => {
      const now = new Date();

      const eightHoursLater = new Date(
        now.getTime() + 8 * 60 * 60 * 1000
      );

      const windowStart = new Date(
        eightHoursLater.getTime() -
          10 * 60 * 1000
      );

      const windowEnd = new Date(
        eightHoursLater.getTime() +
          10 * 60 * 1000
      );

      const reminderTasks = await step.run(
        "prepare-reminder-tasks",
        async () => {
          const bookings = await Booking.find({
            isPaid: true,
          })
            .populate({
              path: "show",

              match: {
                showDateTime: {
                  $gte: windowStart,
                  $lte: windowEnd,
                },
              },

              populate: {
                path: "movie",
                model: "Movie",
              },
            })
            .populate("user")
            .lean();

          const tasks = [];

          for (const booking of bookings) {
            if (!booking.show) {
              continue;
            }

            if (!booking.show.movie) {
              continue;
            }

            if (!booking.user?.email) {
              continue;
            }

            tasks.push({
              bookingId:
                booking._id.toString(),

              userEmail:
                booking.user.email,

              userName:
                booking.user.name || "Customer",

              movieTitle:
                booking.show.movie.title,

              showTime:
                booking.show.showDateTime,

              bookedSeats:
                booking.bookedSeats || [],
            });
          }

          return tasks;
        }
      );

      if (reminderTasks.length === 0) {
        return {
          sent: 0,
          failed: 0,
          message: "No reminders to send.",
        };
      }

      const results = await step.run(
        "send-all-reminders",
        async () => {
          return await Promise.allSettled(
            reminderTasks.map((task) =>
              sendEmail({
                to: task.userEmail,

                subject: `Reminder: Your movie "${task.movieTitle}" starts soon!`,

                body: `
                  <div
                    style="
                      font-family: Arial, sans-serif;
                      line-height: 1.6;
                      padding: 20px;
                    "
                  >
                    <h2>
                      Hello ${task.userName},
                    </h2>

                    <p>
                      This is a quick reminder that your movie:
                    </p>

                    <h3 style="color: #F84565;">
                      "${task.movieTitle}"
                    </h3>

                    <p>
                      is scheduled for
                      <strong>
                        ${new Date(
                          task.showTime
                        ).toLocaleDateString(
                          "en-CA",
                          {
                            timeZone:
                              "America/Toronto",
                          }
                        )}
                      </strong>
                      at
                      <strong>
                        ${new Date(
                          task.showTime
                        ).toLocaleTimeString(
                          "en-CA",
                          {
                            timeZone:
                              "America/Toronto",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )}
                      </strong>.
                    </p>

                    <p>
                      <strong>Seats:</strong>
                      ${task.bookedSeats.join(", ")}
                    </p>

                    <p>
                      It starts in approximately
                      <strong>8 hours</strong>.
                      Make sure you're ready!
                    </p>

                    <p>
                      Enjoy the show!
                      <br/>
                      <strong>QuickShow Team</strong>
                    </p>
                  </div>
                `,
              })
            )
          );
        }
      );

      const sent = results.filter(
        (result) =>
          result.status === "fulfilled"
      ).length;

      const failed =
        results.length - sent;

      return {
        sent,
        failed,
        message: `Sent ${sent} reminder(s), ${failed} failed.`,
      };
    }
  );

// --------------------------------------------------
// Send email notifications when a new show is added
// --------------------------------------------------
const sendNewShowNotifications =
  inngest.createFunction(
    {
      id: "send-new-show-notifications",

      triggers: {
        event: "app/show.added",
      },
    },
    async ({ event, step }) => {
      const movieTitle =
        event.data?.movieTitle;

      const movieId =
        event.data?.movieId;

      if (!movieTitle) {
        throw new Error(
          "Movie title was not provided."
        );
      }

      const clientUrl =
        process.env.CLIENT_URL ||
        "http://localhost:5173";

      // Get all users who have an email address
      const users = await step.run(
        "get-users-for-notification",
        async () => {
          return await User.find({
            email: {
              $exists: true,
              $ne: "",
            },
          })
            .select("name email")
            .lean();
        }
      );

      if (users.length === 0) {
        return {
          sent: 0,
          failed: 0,
          message:
            "No users were available for notification.",
        };
      }

      const results = await step.run(
        "send-new-show-emails",
        async () => {
          return await Promise.allSettled(
            users.map((user) => {
              const userName =
                user.name || "Movie Lover";

              const movieUrl = movieId
                ? `${clientUrl}/movies/${movieId}`
                : `${clientUrl}/movies`;

              return sendEmail({
                to: user.email,

                subject: `🎬 New Show Added: ${movieTitle}`,

                body: `
                  <div
                    style="
                      font-family: Arial, sans-serif;
                      line-height: 1.6;
                      padding: 20px;
                    "
                  >
                    <h2>
                      Hi ${userName},
                    </h2>

                    <p>
                      We've just added a new show to QuickShow:
                    </p>

                    <h3 style="color: #F84565;">
                      "${movieTitle}"
                    </h3>

                    <p>
                      Visit our website to view available dates,
                      show times, and seats.
                    </p>

                    <p>
                      <a
                        href="${movieUrl}"
                        style="
                          display: inline-block;
                          background-color: #F84565;
                          color: white;
                          text-decoration: none;
                          padding: 10px 18px;
                          border-radius: 6px;
                          font-weight: bold;
                        "
                      >
                        View Show
                      </a>
                    </p>

                    <br/>

                    <p>
                      Thanks,
                      <br/>
                      <strong>QuickShow Team</strong>
                    </p>
                  </div>
                `,
              });
            })
          );
        }
      );

      const sent = results.filter(
        (result) =>
          result.status === "fulfilled"
      ).length;

      const failed =
        results.length - sent;

      return {
        sent,
        failed,
        movieTitle,
        message: `Sent ${sent} notification(s), ${failed} failed.`,
      };
    }
  );

// --------------------------------------------------
// Export all Inngest functions
// --------------------------------------------------
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowReminders,
  sendNewShowNotifications,
];