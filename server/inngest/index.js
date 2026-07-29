import { Inngest } from "inngest";

import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

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

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
];