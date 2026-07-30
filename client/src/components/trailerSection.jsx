import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { PlayCircleIcon } from "lucide-react";

import BlurCircle from "./BlurCircle";
import { useAppContext } from "../../context/AppContext";

const TrailerSection = () => {
  const { axios } = useAppContext();

  const [trailers, setTrailers] = useState([]);
  const [currentTrailer, setCurrentTrailer] =
    useState(null);
  const [isLoading, setIsLoading] =
    useState(true);

  const fetchTrailers = async () => {
    try {
      const { data } = await axios.get(
        "/api/show/trailers"
      );

      if (
        data.success &&
        Array.isArray(data.trailers) &&
        data.trailers.length > 0
      ) {
        setTrailers(data.trailers);
        setCurrentTrailer(data.trailers[0]);
      }
    } catch (error) {
      console.error(
        "Failed to fetch trailers:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrailers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-gray-600 border-t-[#F84565]" />
      </div>
    );
  }

  if (!currentTrailer) {
    return (
      <div className="px-6 py-20 text-center text-gray-400">
        No trailers are available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden px-6 py-20 md:px-16 lg:px-24 xl:px-44">
      <p className="mx-auto max-w-[960px] text-lg font-medium text-gray-300">
        Trailers
      </p>

      <div className="relative mt-6">
        <BlurCircle
          top="-100px"
          right="-100px"
        />

        <div className="mx-auto aspect-video w-full max-w-[960px] overflow-hidden rounded-xl bg-black">
          <ReactPlayer
            key={currentTrailer.videoKey}
            src={currentTrailer.videoUrl}
            controls
            width="100%"
            height="100%"
          />
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
          {trailers.map((trailer) => {
            const isSelected =
              currentTrailer.videoKey ===
              trailer.videoKey;

            return (
              <button
                type="button"
                key={`${trailer.movieId}-${trailer.videoKey}`}
                onClick={() =>
                  setCurrentTrailer(trailer)
                }
                className={`group relative h-24 cursor-pointer overflow-hidden rounded-lg border-2 transition duration-300 hover:-translate-y-1 md:h-40 ${
                  isSelected
                    ? "border-[#F84565]"
                    : "border-transparent"
                }`}
              >
                <img
                  src={trailer.thumbnail}
                  alt={`${trailer.title} trailer`}
                  className="h-full w-full object-cover brightness-75 transition duration-300 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.onerror =
                      null;

                    event.currentTarget.src =
                      trailer.fallbackThumbnail;
                  }}
                />

                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <PlayCircleIcon
                    strokeWidth={1.6}
                    className="h-8 w-8 text-white md:h-10 md:w-10"
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-8">
                  <p className="truncate text-left text-xs font-medium text-white md:text-sm">
                    {trailer.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrailerSection;