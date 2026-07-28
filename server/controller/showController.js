import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

const tmdbHeaders = {
  Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
  accept: "application/json",
};

// API to get now-playing movies from TMDB
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: tmdbHeaders,
      }
    );

    return res.status(200).json({
      success: true,
      movies: data.results,
    });
  } catch (error) {
    console.error("TMDB error:", error.response?.data || error.message);
    console.error("Failed URL:", error.config?.url);

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.status_message ||
        error.message,
      failedUrl: error.config?.url,
    });
  }
};

// API to add a new show to the database
export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice } = req.body;

    if (!movieId || !Array.isArray(showsInput) || showPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "movieId, showsInput and showPrice are required.",
      });
    }

    let movie = await Movie.findById(String(movieId));

    // Add the movie if it is not already stored
    if (!movie) {
      console.log("Fetching TMDB movie:", movieId);

      const [movieDetailsResponse, movieCreditsResponse] =
        await Promise.all([
          axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}`,
            {
              headers: tmdbHeaders,
            }
          ),

          axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}/credits`,
            {
              headers: tmdbHeaders,
            }
          ),
        ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: String(movieId),
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      movie = await Movie.create(movieDetails);
    }

    const showsToCreate = [];

    showsInput.forEach((show) => {
      const showDate = show.date;

      if (!showDate || !Array.isArray(show.time)) {
        return;
      }

      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        const showDateTime = new Date(dateTimeString);

        if (!Number.isNaN(showDateTime.getTime())) {
          showsToCreate.push({
            movie: String(movieId),
            showDateTime,
            showPrice: Number(showPrice),
            occupiedSeats: {},
          });
        }
      });
    });

    if (showsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid show dates or times were provided.",
      });
    }

    await Show.insertMany(showsToCreate);

    return res.status(201).json({
      success: true,
      message: "Show added successfully.",
    });
  } catch (error) {
    console.error("Add show error:", error.response?.data || error.message);
    console.error("Failed URL:", error.config?.url);
    console.log("Request body:", req.body);

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.status_message ||
        error.message,
      failedUrl: error.config?.url,
    });
  }
};
// API to get all upcoming shows from the database
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({
      showDateTime: { $gte: new Date() },
    })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // Keep only unique movies
    const uniqueShows = new Map();

    shows.forEach((show) => {
      if (show.movie) {
        uniqueShows.set(String(show.movie._id), show.movie);
      }
    });

    return res.json({
      success: true,
      shows: Array.from(uniqueShows.values()),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API to get one movie and all its upcoming showtimes
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;

    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    }).sort({ showDateTime: 1 });

    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];

      if (!dateTime[date]) {
        dateTime[date] = [];
      }

      dateTime[date].push({
        time: show.showDateTime,
        showId: show._id,
      });
    });

    return res.json({
      success: true,
      movie,
      dateTime,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};