import React, { useEffect, useState } from "react";
import {
  CheckIcon,
  DeleteIcon,
  StarIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import Loading from "../../components/Loading";
import Title from "../../components/Title";
import { kConverter } from "../../libs/kConverter";
import { useAppContext } from "../../../context/AppContext";

const AddShow = () => {
  const { axios, getToken, user } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY || "$";
  const imageBaseUrl =
    import.meta.env.VITE_TMDB_IMAGE_BASE_URL ||
    "https://image.tmdb.org/t/p/w500";

  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [addingShow, setAddingShow] = useState(false);

  // Get the currently playing movies from the backend
  const fetchNowPlayingMovies = async () => {
    try {
      setLoadingMovies(true);

      const token = await getToken();

      if (!token) {
        toast.error("Authentication token was not found.");
        return;
      }

      const { data } = await axios.get(
        "/api/show/now-playing",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setNowPlayingMovies(data.movies || []);
      } else {
        toast.error(
          data.message || "Failed to fetch movies."
        );
      }
    } catch (error) {
      console.error(
        "Error fetching movies:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to fetch movies."
      );
    } finally {
      setLoadingMovies(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies();
    }
  }, [user]);

  // Add selected date and time to the object
  const handleDateTimeAdd = () => {
    if (!dateTimeInput) {
      toast.error("Please select a date and time.");
      return;
    }

    const [date, time] = dateTimeInput.split("T");

    if (!date || !time) {
      toast.error("Invalid date or time.");
      return;
    }

    setDateTimeSelection((previousSelection) => {
      const existingTimes =
        previousSelection[date] || [];

      if (existingTimes.includes(time)) {
        toast.error(
          "This date and time is already selected."
        );

        return previousSelection;
      }

      return {
        ...previousSelection,
        [date]: [...existingTimes, time],
      };
    });

    setDateTimeInput("");
  };

  // Remove one selected time
  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((previousSelection) => {
      const filteredTimes =
        previousSelection[date].filter(
          (selectedTime) => selectedTime !== time
        );

      const updatedSelection = {
        ...previousSelection,
      };

      if (filteredTimes.length === 0) {
        delete updatedSelection[date];
      } else {
        updatedSelection[date] = filteredTimes;
      }

      return updatedSelection;
    });
  };

  // Submit the new show to the backend
  const handleAddShow = async () => {
    if (!selectedMovie) {
      toast.error("Please select a movie.");
      return;
    }

    if (!showPrice || Number(showPrice) <= 0) {
      toast.error("Please enter a valid show price.");
      return;
    }

    if (Object.keys(dateTimeSelection).length === 0) {
      toast.error(
        "Please add at least one date and time."
      );
      return;
    }

    try {
      setAddingShow(true);

      const token = await getToken();

      if (!token) {
        toast.error(
          "Authentication token was not found."
        );
        return;
      }

      // Keep all times grouped under their date
      const showsInput = Object.entries(
        dateTimeSelection
      ).map(([date, times]) => ({
        date,
        time: times,
      }));

      const payload = {
        movieId: selectedMovie,
        showsInput,
        showPrice: Number(showPrice),
      };

      console.log("Show payload:", payload);

      const { data } = await axios.post(
        "/api/show/add",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        toast.success(
          data.message || "Show added successfully!"
        );

        setSelectedMovie(null);
        setShowPrice("");
        setDateTimeInput("");
        setDateTimeSelection({});
      } else {
        toast.error(
          data.message || "Failed to add show."
        );
      }
    } catch (error) {
      console.error(
        "Add show error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to add show."
      );
    } finally {
      setAddingShow(false);
    }
  };

  if (loadingMovies) {
    return <Loading />;
  }

  return (
    <>
      <Title text1="Add" text2="Shows" />

      <p className="mt-10 text-lg font-medium">
        Now Playing Movies
      </p>

      {nowPlayingMovies.length === 0 ? (
        <p className="mt-4 text-gray-400">
          No now-playing movies were found.
        </p>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="group flex w-max gap-4 mt-4">
            {nowPlayingMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() =>
                  setSelectedMovie(movie.id)
                }
                className="relative w-40 shrink-0 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300"
              >
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={
                      movie.poster_path?.startsWith(
                        "http"
                      )
                        ? movie.poster_path
                        : `${imageBaseUrl}${movie.poster_path}`
                    }
                    alt={movie.title}
                    className="w-full h-64 object-cover brightness-90"
                  />

                  <div className="absolute bottom-0 left-0 flex w-full items-center justify-between bg-black/70 p-2 text-sm">
                    <p className="flex items-center gap-1 text-gray-300">
                      <StarIcon className="w-4 h-4 text-red-500 fill-red-500" />

                      {Number(
                        movie.vote_average || 0
                      ).toFixed(1)}
                    </p>

                    <p className="text-gray-300">
                      {kConverter(
                        movie.vote_count || 0
                      )}{" "}
                      Votes
                    </p>
                  </div>
                </div>

                {selectedMovie === movie.id && (
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-red-500 h-6 w-6 rounded">
                    <CheckIcon
                      className="w-4 h-4 text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                )}

                <p className="font-medium truncate mt-2">
                  {movie.title}
                </p>

                <p className="text-gray-400 text-sm">
                  {movie.release_date}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show price */}
      <div className="mt-8">
        <label className="block text-sm font-medium mb-2">
          Show Price
        </label>

        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm">
            {currency}
          </p>

          <input
            min="0"
            type="number"
            value={showPrice}
            onChange={(event) =>
              setShowPrice(event.target.value)
            }
            placeholder="Enter show price"
            className="outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Date and time */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Select Date and Time
        </label>

        <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
          <input
            type="datetime-local"
            value={dateTimeInput}
            onChange={(event) =>
              setDateTimeInput(event.target.value)
            }
            className="outline-none rounded-md bg-transparent"
          />

          <button
            type="button"
            onClick={handleDateTimeAdd}
            className="bg-red-500/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-red-500 cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div>

      {/* Selected dates and times */}
      {Object.keys(dateTimeSelection).length >
        0 && (
        <div className="mt-6">
          <h2 className="mb-2">
            Selected Date-Time
          </h2>

          <ul className="space-y-3">
            {Object.entries(
              dateTimeSelection
            ).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">
                  {date}
                </div>

                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time) => (
                    <div
                      key={time}
                      className="border border-red-500 px-2 py-1 flex items-center rounded bg-red-500/10"
                    >
                      <span>{time}</span>

                      <DeleteIcon
                        onClick={() =>
                          handleRemoveTime(
                            date,
                            time
                          )
                        }
                        width={15}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleAddShow}
        disabled={addingShow}
        className="bg-red-500 text-white px-8 py-2 mt-6 rounded hover:bg-red-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {addingShow
          ? "Adding Show..."
          : "Add Show"}
      </button>
    </>
  );
};

export default AddShow;