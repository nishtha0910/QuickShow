import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HeartIcon,
  PlayCircleIcon,
  StarIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import BlurCircle from "../components/BlurCircle";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import timeFormat from "../libs/timeFormat";
import { useAppContext } from "../../context/AppContext";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
  } = useAppContext();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] =
    useState(false);

  const imageBaseUrl =
    import.meta.env.VITE_TMDB_IMAGE_BASE_URL ||
    "https://image.tmdb.org/t/p/original";

  // Create the complete TMDB image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "";
    }

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    return `${imageBaseUrl}${imagePath}`;
  };

  // Get movie details and available show dates
  const getShow = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `/api/show/${id}`
      );

      if (data.success) {
        // Backend response:
        // { success, movie, dateTime }
        setShow(data);
      } else {
        toast.error(
          data.message || "Movie details could not be loaded."
        );
      }
    } catch (error) {
      console.error(
        "Get show error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Movie details could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  // Add or remove movie from favorites
  const handleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to continue.");
      return;
    }

    try {
      setFavoriteLoading(true);

      const token = await getToken();

      if (!token) {
        toast.error("Authentication token was not found.");
        return;
      }

      const { data } = await axios.post(
        "/api/user/update-favorite",
        {
          movieId: String(
            show?.movie?._id || show?.movie?.id || id
          ),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        await fetchFavoriteMovies();

        toast.success(
          data.message || "Favorites updated."
        );
      } else {
        toast.error(
          data.message || "Could not update favorites."
        );
      }
    } catch (error) {
      console.error(
        "Favorite update error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Could not update favorites."
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    getShow();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!show?.movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl font-semibold">
          Movie not found.
        </p>
      </div>
    );
  }

  const movie = show.movie;

  // Support either "casts" or "cast" from the backend
  const movieCast = movie.casts || movie.cast || [];

  // Check whether the movie is already a favorite
  const isFavorite = favoriteMovies.some(
    (favoriteMovie) =>
      String(favoriteMovie._id || favoriteMovie.id) ===
      String(movie._id || movie.id || id)
  );

  // Support both arrays of movies and arrays containing { movie }
  const recommendedMovies = shows
    .map((item) => item.movie || item)
    .filter(
      (item) =>
        item &&
        String(item._id || item.id) !==
          String(movie._id || movie.id)
    )
    .slice(0, 4);

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        {/* Movie poster */}
        <img
          src={getImageUrl(movie.poster_path)}
          alt={movie.title}
          className="max-md:mx-auto rounded-xl h-104 w-full max-w-70 object-cover"
        />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />

          <p className="text-red-500 uppercase font-medium">
            {movie.spoken_languages?.[0]?.english_name ||
              movie.spoken_languages?.[0]?.name ||
              "English"}
          </p>

          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {movie.title}
          </h1>

          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-red-500 fill-red-500" />

            {Number(movie.vote_average || 0).toFixed(1)}{" "}
            User Rating
          </div>

          <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
            {movie.overview}
          </p>

          <p className="text-gray-300">
            {timeFormat(movie.runtime || 0)} •{" "}
            {(movie.genres || [])
              .map((genre) => genre.name)
              .join(", ")}{" "}
            •{" "}
            {movie.release_date
              ? movie.release_date.split("-")[0]
              : ""}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button
              type="button"
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>

            <a
              href="#dateSelect"
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
            >
              Buy Tickets
            </a>

            <button
              type="button"
              onClick={handleFavorite}
              disabled={favoriteLoading}
              className="bg-gray-800 p-2.5 rounded-full transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <HeartIcon
                className={`w-5 h-5 ${
                  isFavorite
                    ? "fill-red-500 text-red-500"
                    : "text-white"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Cast */}
      <p className="text-lg font-medium mt-20">
        Your Favorite Cast
      </p>

      {movieCast.length > 0 ? (
        <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
          <div className="flex items-center gap-4 w-max px-4">
            {movieCast.slice(0, 12).map((cast, index) => (
              <div
                key={cast.id || index}
                className="flex flex-col items-center text-center w-24"
              >
                <img
                  src={getImageUrl(cast.profile_path)}
                  alt={cast.name || "Cast member"}
                  className="rounded-full h-20 w-20 aspect-square object-cover"
                />

                <p className="font-medium text-xs mt-3">
                  {cast.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-400 mt-4">
          Cast information is not available.
        </p>
      )}

      {/* Available dates */}
      <div id="dateSelect">
        <DateSelect
          dateTime={show.dateTime || {}}
          id={id}
        />
      </div>

      {/* Recommended movies */}
      <p className="text-lg font-medium mt-20 mb-8">
        You May Also Like
      </p>

      {recommendedMovies.length > 0 ? (
        <div className="flex flex-wrap max-sm:justify-center gap-8">
          {recommendedMovies.map((recommendedMovie) => (
            <MovieCard
              key={
                recommendedMovie._id ||
                recommendedMovie.id
              }
              movie={recommendedMovie}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-400">
          No other movies are currently available.
        </p>
      )}

      <div className="flex justify-center mt-20 pb-20">
        <button
          type="button"
          onClick={() => {
            navigate("/movies");
            window.scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-red-500 hover:bg-red-600 text-white transition rounded-md font-medium cursor-pointer"
        >
          Show More
        </button>
      </div>
    </div>
  );
};

export default MovieDetails;