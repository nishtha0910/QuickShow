import React from "react";
import { useNavigate } from "react-router-dom";
import { StarIcon } from "lucide-react";
import timeFormat from "../libs/timeFormat";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  const movieId = movie?._id || movie?.id;

  const imageBaseUrl =
    import.meta.env.VITE_TMDB_IMAGE_BASE_URL ||
    "https://image.tmdb.org/t/p/w500";

  const imageUrl = movie?.backdrop_path?.startsWith("http")
    ? movie.backdrop_path
    : `${imageBaseUrl}${movie?.backdrop_path || movie?.poster_path || ""}`;

  const openMovieDetails = () => {
    if (!movieId) {
      console.error("Movie ID is missing:", movie);
      return;
    }

    navigate(`/movies/${movieId}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66">
      <img
        onClick={openMovieDetails}
        src={imageUrl}
        alt={movie?.title || "Movie"}
        className="rounded-lg h-52 w-full object-cover object-right-bottom cursor-pointer"
      />

      <p className="font-semibold mt-2 truncate">
        {movie?.title}
      </p>

      <p className="text-sm text-gray-400 mt-2">
        {movie?.release_date
          ? new Date(movie.release_date).getFullYear()
          : ""}
        {" • "}
        {(movie?.genres || [])
          .slice(0, 2)
          .map((genre) => genre.name)
          .join(" | ")}
        {" • "}
        {timeFormat(movie?.runtime || 0)}
      </p>

      <div className="flex items-center justify-between gap-1 text-sm text-gray-400 mt-3 pr-1">
        <button
          type="button"
          onClick={openMovieDetails}
          className="px-4 py-2 text-xs bg-red-500 hover:bg-red-600 transition rounded-full font-medium cursor-pointer"
        >
          Buy Tickets
        </button>

        <p className="flex items-center gap-1">
          <StarIcon className="w-4 h-4 text-red-500 fill-red-500" />

          {Number(movie?.vote_average || 0).toFixed(1)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;