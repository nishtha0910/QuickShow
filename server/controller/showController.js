import axios from "axios";

import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

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
    console.error(
      "TMDB now-playing error:",
      error.response?.data || error.message
    );

    console.error(
      "Failed URL:",
      error.config?.url
    );

    return res
      .status(error.response?.status || 500)
      .json({
        success: false,
        message:
          error.response?.data?.status_message ||
          error.message,
        failedUrl: error.config?.url,
      });
  }
};

// API to get trailers for movies stored in the database
export const getMovieTrailers = async (
  req,
  res
) => {
  try {
    // Get movies already available in QuickShow
    const movies = await Movie.find({})
      .select("_id title backdrop_path poster_path")
      .limit(8)
      .lean();

    if (movies.length === 0) {
      return res.status(200).json({
        success: true,
        trailers: [],
        message: "No movies are available.",
      });
    }

    const trailerRequests = movies.map(
      async (movie) => {
        try {
          const { data } = await axios.get(
            `https://api.themoviedb.org/3/movie/${movie._id}/videos`,
            {
              headers: tmdbHeaders,
              params: {
                language: "en-US",
              },
            }
          );

          const videos = Array.isArray(data.results)
            ? data.results
            : [];

          // First preference: official YouTube trailer
          let trailer = videos.find(
            (video) =>
              video.site === "YouTube" &&
              video.type === "Trailer" &&
              video.official === true
          );

          // Second preference: any YouTube trailer
          if (!trailer) {
            trailer = videos.find(
              (video) =>
                video.site === "YouTube" &&
                video.type === "Trailer"
            );
          }

          // Third preference: official YouTube teaser
          if (!trailer) {
            trailer = videos.find(
              (video) =>
                video.site === "YouTube" &&
                video.type === "Teaser" &&
                video.official === true
            );
          }

          // Final preference: any YouTube video
          if (!trailer) {
            trailer = videos.find(
              (video) =>
                video.site === "YouTube"
            );
          }

          if (!trailer) {
            return null;
          }

          return {
            movieId: movie._id.toString(),
            title: movie.title,
            trailerName: trailer.name,
            videoKey: trailer.key,
            videoUrl:
              `https://www.youtube.com/watch?v=${trailer.key}`,
            embedUrl:
              `https://www.youtube.com/embed/${trailer.key}`,
            thumbnail:
              `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`,
            fallbackThumbnail:
              `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`,
            backdrop_path:
              movie.backdrop_path,
            poster_path:
              movie.poster_path,
            official:
              trailer.official || false,
            publishedAt:
              trailer.published_at || null,
          };
        } catch (error) {
          console.error(
            `Trailer error for ${movie.title}:`,
            error.response?.data ||
              error.message
          );

          return null;
        }
      }
    );

    const results = await Promise.all(
      trailerRequests
    );

    const trailers = results.filter(Boolean);

    return res.status(200).json({
      success: true,
      trailers,
    });
  } catch (error) {
    console.error(
      "Get movie trailers error:",
      error.response?.data ||
        error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get movie trailers.",
    });
  }
};

// API to add a new show to the database
export const addShow = async (req, res) => {
  try {
    const {
      movieId,
      showsInput,
      showPrice,
    } = req.body;

    if (
      !movieId ||
      !Array.isArray(showsInput) ||
      showPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "movieId, showsInput and showPrice are required.",
      });
    }

    const price = Number(showPrice);

    if (
      Number.isNaN(price) ||
      price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Show price must be a valid positive number.",
      });
    }

    let movie = await Movie.findById(
      String(movieId)
    );

    // Add the movie if it is not already stored
    if (!movie) {
      console.log(
        "Fetching TMDB movie:",
        movieId
      );

      const [
        movieDetailsResponse,
        movieCreditsResponse,
      ] = await Promise.all([
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

      const movieApiData =
        movieDetailsResponse.data;

      const movieCreditsData =
        movieCreditsResponse.data;

      const movieDetails = {
        _id: String(movieId),
        title: movieApiData.title,
        overview:
          movieApiData.overview,
        poster_path:
          movieApiData.poster_path,
        backdrop_path:
          movieApiData.backdrop_path,
        release_date:
          movieApiData.release_date,
        original_language:
          movieApiData.original_language,
        tagline:
          movieApiData.tagline || "",
        genres:
          movieApiData.genres || [],
        casts:
          movieCreditsData.cast || [],
        vote_average:
          movieApiData.vote_average,
        runtime:
          movieApiData.runtime,
      };

      movie = await Movie.create(
        movieDetails
      );
    }

    const showsToCreate = [];

    showsInput.forEach((show) => {
      const showDate = show.date;

      if (
        !showDate ||
        !Array.isArray(show.time)
      ) {
        return;
      }

      show.time.forEach((time) => {
        const dateTimeString =
          `${showDate}T${time}`;

        const showDateTime =
          new Date(dateTimeString);

        if (
          !Number.isNaN(
            showDateTime.getTime()
          )
        ) {
          showsToCreate.push({
            movie: String(movieId),
            showDateTime,
            showPrice: price,
            occupiedSeats: {},
          });
        }
      });
    });

    if (showsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No valid show dates or times were provided.",
      });
    }

    const createdShows =
      await Show.insertMany(
        showsToCreate
      );

    // Notify users that a new show was added
    try {
      await inngest.send({
        name: "app/show.added",
        data: {
          movieTitle: movie.title,
          movieId:
            movie._id.toString(),
          createdShowCount:
            createdShows.length,
        },
      });
    } catch (inngestError) {
      // The shows should remain saved even if
      // the notification event cannot be sent
      console.error(
        "New-show notification event error:",
        inngestError.message
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Show added successfully.",
      createdShowCount:
        createdShows.length,
    });
  } catch (error) {
    console.error(
      "Add show error:",
      error.response?.data ||
        error.message
    );

    console.error(
      "Failed URL:",
      error.config?.url
    );

    console.log(
      "Request body:",
      req.body
    );

    return res
      .status(error.response?.status || 500)
      .json({
        success: false,
        message:
          error.response?.data
            ?.status_message ||
          error.message,
        failedUrl:
          error.config?.url,
      });
  }
};

// API to get all upcoming shows
export const getShows = async (
  req,
  res
) => {
  try {
    const shows = await Show.find({
      showDateTime: {
        $gte: new Date(),
      },
    })
      .populate("movie")
      .sort({
        showDateTime: 1,
      });

    // Keep only unique movies
    const uniqueShows = new Map();

    shows.forEach((show) => {
      if (show.movie) {
        uniqueShows.set(
          String(show.movie._id),
          show.movie
        );
      }
    });

    return res.status(200).json({
      success: true,
      shows: Array.from(
        uniqueShows.values()
      ),
    });
  } catch (error) {
    console.error(
      "Get shows error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get shows.",
    });
  }
};

// API to get one movie and all upcoming showtimes
export const getShow = async (
  req,
  res
) => {
  try {
    const { movieId } = req.params;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message:
          "Movie ID is required.",
      });
    }

    const shows = await Show.find({
      movie: movieId,
      showDateTime: {
        $gte: new Date(),
      },
    }).sort({
      showDateTime: 1,
    });

    const movie =
      await Movie.findById(
        movieId
      );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message:
          "Movie not found.",
      });
    }

    const dateTime = {};

    shows.forEach((show) => {
      const date =
        show.showDateTime
          .toISOString()
          .split("T")[0];

      if (!dateTime[date]) {
        dateTime[date] = [];
      }

      dateTime[date].push({
        time:
          show.showDateTime,
        showId:
          show._id,
      });
    });

    return res.status(200).json({
      success: true,
      movie,
      dateTime,
    });
  } catch (error) {
    console.error(
      "Get show error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get show details.",
    });
  }
};