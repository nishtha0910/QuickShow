import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import { clerkClient } from "@clerk/express";

// API controller function to get user bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth().userId;

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: {
          path: "movie",
        },
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API controller function to add or remove favorite movie
export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.auth().userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authorized",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    const favorites = Array.isArray(user.privateMetadata?.favorites)
      ? [...user.privateMetadata.favorites]
      : [];

    const movieIdString = String(movieId);

    let updatedFavorites;

    if (!favorites.includes(movieIdString)) {
      updatedFavorites = [...favorites, movieIdString];
    } else {
      updatedFavorites = favorites.filter(
        (item) => String(item) !== movieIdString
      );
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        favorites: updatedFavorites,
      },
    });

    return res.json({
      success: true,
      message: "Favorite movies updated",
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API controller function to get favorite movies
export const getFavorites = async (req, res) => {
  try {
    const userId = req.auth().userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authorized",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    const favorites = Array.isArray(user.privateMetadata?.favorites)
      ? user.privateMetadata.favorites
      : [];

    const movies = await Movie.find({
      _id: {
        $in: favorites,
      },
    });

    return res.json({
      success: true,
      movies,
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};