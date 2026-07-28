import Stripe from "stripe";

import Show from "../models/Show.js";
import Booking from "../models/Booking.js";

// Initialize Stripe
const stripeInstance = new Stripe(
  process.env.STRIPE_SECRET_KEY
);

// Check whether selected seats are available
const checkSeatsAvailability = async (
  showId,
  selectedSeats
) => {
  try {
    const showData = await Show.findById(showId);

    if (!showData) {
      return false;
    }

    const occupiedSeats =
      showData.occupiedSeats || {};

    const isAnySeatTaken = selectedSeats.some(
      (seat) => occupiedSeats[seat]
    );

    return !isAnySeatTaken;
  } catch (error) {
    console.error(
      "Seat availability error:",
      error.message
    );

    return false;
  }
};

// API to create a booking
export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { showId, selectedSeats } = req.body;

    const origin =
      req.headers.origin || "http://localhost:5173";

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authorized.",
      });
    }

    if (!showId) {
      return res.status(400).json({
        success: false,
        message: "Show ID is required.",
      });
    }

    if (
      !Array.isArray(selectedSeats) ||
      selectedSeats.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one seat.",
      });
    }

    // Check selected-seat availability
    const isAvailable =
      await checkSeatsAvailability(
        showId,
        selectedSeats
      );

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message:
          "One or more selected seats are no longer available.",
      });
    }

    // Get the show and movie details
    const showData = await Show.findById(
      showId
    ).populate("movie");

    if (!showData) {
      return res.status(404).json({
        success: false,
        message: "Show not found.",
      });
    }

    if (!showData.movie) {
      return res.status(404).json({
        success: false,
        message: "Movie details not found.",
      });
    }

    const totalAmount =
      Number(showData.showPrice) *
      selectedSeats.length;

    // Create an unpaid booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: totalAmount,
      bookedSeats: selectedSeats,
      isPaid: false,
    });

    // Mark the selected seats as occupied
    if (!showData.occupiedSeats) {
      showData.occupiedSeats = {};
    }

    selectedSeats.forEach((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");
    await showData.save();

    // Stripe line item
    const lineItems = [
      {
        price_data: {
          // Use "cad" here when your prices are Canadian dollars
          currency:
            process.env.STRIPE_CURRENCY || "cad",

          product_data: {
            name: showData.movie.title,
            description: `${selectedSeats.length} ticket(s) — Seats: ${selectedSeats.join(
              ", "
            )}`,
          },

          // Stripe expects the smallest currency unit
          unit_amount: Math.round(
            totalAmount * 100
          ),
        },

        quantity: 1,
      },
    ];

    // Create Stripe Checkout Session
    const session =
      await stripeInstance.checkout.sessions.create({
        success_url: `${origin}/loading/my-bookings`,
    cancel_url: `${origin}/my-bookings`,

        line_items: lineItems,
        mode: "payment",

        metadata: {
          bookingId: booking._id.toString(),
          userId,
          showId: showId.toString(),
        },

        expires_at:
          Math.floor(Date.now() / 1000) +
          30 * 60,
      });

    // Save the Stripe payment link
    booking.paymentLink = session.url;
    await booking.save();

    return res.status(201).json({
      success: true,
      message:
        "Booking created. Complete the payment.",
      url: session.url,
      bookingId: booking._id,
    });
  } catch (error) {
    console.error(
      "Create booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create booking.",
    });
  }
};

// API to get occupied seats
export const getOccupiedSeats = async (
  req,
  res
) => {
  try {
    const { showId } = req.params;

    const showData = await Show.findById(
      showId
    );

    if (!showData) {
      return res.status(404).json({
        success: false,
        message: "Show not found.",
      });
    }

    const occupiedSeats = Object.keys(
      showData.occupiedSeats || {}
    );

    return res.json({
      success: true,
      occupiedSeats,
    });
  } catch (error) {
    console.error(
      "Get occupied seats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get occupied seats.",
    });
  }
};