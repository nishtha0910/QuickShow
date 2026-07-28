import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRightIcon,
  ClockIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { assets } from "../assets/assets";
import BlurCircle from "../components/BlurCircle";
import Loading from "../components/Loading";
import { useAppContext } from "../../context/AppContext";

const SeatLayout = () => {
  const { id, date } = useParams();
  const navigate = useNavigate();

  const { axios, getToken, user } = useAppContext();

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);

  const [loading, setLoading] = useState(true);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] =
    useState(false);

  // Get movie and available show timings
  const getShow = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `/api/show/${id}`
      );

      if (data.success) {
        setShow(data);
      } else {
        setShow(null);
        toast.error(data.message || "Show not found.");
      }
    } catch (error) {
      console.error(
        "Get show error:",
        error.response?.data || error.message
      );

      setShow(null);

      toast.error(
        error.response?.data?.message ||
          "Failed to load the show."
      );
    } finally {
      setLoading(false);
    }
  };

  // Get already-booked seats
  const getOccupiedSeats = async () => {
    const showId =
      selectedTime?.showId || selectedTime?._id;

    if (!showId) {
      setOccupiedSeats([]);
      return;
    }

    try {
      setSeatsLoading(true);

      const { data } = await axios.get(
        `/api/booking/seats/${showId}`
      );

      if (data.success) {
        setOccupiedSeats(data.occupiedSeats || []);
      } else {
        setOccupiedSeats([]);

        toast.error(
          data.message ||
            "Could not load occupied seats."
        );
      }
    } catch (error) {
      console.error(
        "Occupied seats error:",
        error.response?.data || error.message
      );

      setOccupiedSeats([]);

      toast.error(
        error.response?.data?.message ||
          "Could not load occupied seats."
      );
    } finally {
      setSeatsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      getShow();
    }

    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (selectedTime) {
      setSelectedSeats([]);
      getOccupiedSeats();
    } else {
      setOccupiedSeats([]);
    }
  }, [selectedTime]);

  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId)) {
      toast.error("This seat is already booked.");
      return;
    }

    if (
      !selectedSeats.includes(seatId) &&
      selectedSeats.length >= 5
    ) {
      toast.error(
        "You can select a maximum of 5 seats."
      );
      return;
    }

    setSelectedSeats((previousSeats) =>
      previousSeats.includes(seatId)
        ? previousSeats.filter(
            (seat) => seat !== seatId
          )
        : [...previousSeats, seatId]
    );
  };

  const renderSeat = (row, seatNumber) => {
    const seatId = `${row}${seatNumber}`;

    const isSelected =
      selectedSeats.includes(seatId);

    const isOccupied =
      occupiedSeats.includes(seatId);

    return (
      <button
        key={seatId}
        type="button"
        disabled={
          isOccupied ||
          !selectedTime ||
          seatsLoading ||
          bookingLoading
        }
        onClick={() => handleSeatClick(seatId)}
        className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded border text-[10px] sm:text-xs font-medium transition ${
          isOccupied
            ? "bg-gray-700 border-gray-700 text-gray-400 cursor-not-allowed"
            : !selectedTime
              ? "border-gray-700 text-gray-600 cursor-not-allowed"
              : isSelected
                ? "bg-red-500 border-red-500 text-white cursor-pointer"
                : "border-red-500/50 text-gray-200 hover:bg-red-500/20 cursor-pointer"
        }`}
      >
        {seatId}
      </button>
    );
  };

  const renderRow = (row, count = 8) => {
    return (
      <div className="flex justify-center gap-1.5 sm:gap-2">
        {Array.from(
          { length: count },
          (_, index) =>
            renderSeat(row, index + 1)
        )}
      </div>
    );
  };

  const formatTime = (time) => {
    const timeValue =
      typeof time === "string" &&
      time.includes("T")
        ? time
        : `${date}T${time}`;

    return new Date(
      timeValue
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Create booking in the database
  const bookTickets = async () => {
    if (!user) {
      toast.error("Please log in to proceed.");
      return;
    }

    if (!selectedTime || selectedSeats.length === 0) {
      toast.error(
        "Please select a time and seats."
      );
      return;
    }

    const showId =
      selectedTime.showId || selectedTime._id;

    if (!showId) {
      toast.error("Show ID was not found.");
      return;
    }

    try {
      setBookingLoading(true);

      const token = await getToken();

      if (!token) {
        toast.error(
          "Authentication token was not found."
        );
        return;
      }

      const { data } = await axios.post(
        "/api/booking/create",
        {
          showId,
          selectedSeats,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
if (data.success) {
  if (!data.url) {
    toast.error("Stripe payment URL was not received.");
    return;
  }

  window.location.href = data.url;
} else {
  toast.error(
    data.message || "Failed to create booking."
  );
}
    } catch (error) {
      console.error(
        "Booking error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create booking."
      );

      // Refresh occupied seats in case someone booked
      // one of the selected seats.
      await getOccupiedSeats();
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!show?.movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold">
          Show not found.
        </p>

        <button
          type="button"
          onClick={() => navigate("/movies")}
          className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-md cursor-pointer"
        >
          Back to Movies
        </button>
      </div>
    );
  }

  const availableTimes =
    show.dateTime?.[date] || [];

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-10 lg:px-16 pt-28 pb-16">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Available timings */}
        <div className="w-full lg:w-60 shrink-0">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg py-6 lg:sticky lg:top-28">
            <h2 className="text-lg font-semibold px-5">
              Available Timings
            </h2>

            <div className="mt-4">
              {availableTimes.length > 0 ? (
                availableTimes.map(
                  (item, index) => {
                    const itemId =
                      item.showId ||
                      item._id ||
                      index;

                    const selectedTimeId =
                      selectedTime?.showId ||
                      selectedTime?._id;

                    const currentTimeId =
                      item.showId || item._id;

                    const isSelected =
                      String(selectedTimeId) ===
                      String(currentTimeId);

                    return (
                      <button
                        key={itemId}
                        type="button"
                        disabled={bookingLoading}
                        onClick={() =>
                          setSelectedTime(item)
                        }
                        className={`flex items-center gap-2 w-full px-5 py-3 text-left transition ${
                          bookingLoading
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        } ${
                          isSelected
                            ? "bg-red-500 text-white"
                            : "hover:bg-red-500/20 text-gray-300"
                        }`}
                      >
                        <ClockIcon className="w-4 h-4 shrink-0" />

                        <span className="text-sm">
                          {formatTime(item.time)}
                        </span>
                      </button>
                    );
                  }
                )
              ) : (
                <p className="px-5 text-sm text-gray-400">
                  No timings available for this
                  date.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seat section */}
        <div className="relative flex-1 min-w-0 flex flex-col items-center">
          <BlurCircle
            top="-80px"
            left="-80px"
          />

          <BlurCircle
            bottom="-80px"
            right="-80px"
          />

          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            Select your seat
          </h1>

          <p className="text-gray-400 mb-6">
            {show.movie.title}
          </p>

          {!selectedTime && (
            <p className="text-sm text-yellow-400 mb-5">
              Select a show time before choosing
              seats.
            </p>
          )}

          {seatsLoading && (
            <p className="text-sm text-gray-400 mb-5">
              Loading occupied seats...
            </p>
          )}

          <div className="w-full max-w-2xl">
            <img
              src={assets.screenImage}
              alt="Cinema screen"
              className="w-full"
            />

            <p className="text-center text-gray-400 text-xs sm:text-sm mt-1">
              SCREEN SIDE
            </p>
          </div>

          <div className="w-full max-w-4xl mt-12 sm:mt-16">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              {renderRow("A")}
              {renderRow("B")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mt-8 sm:mt-10">
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                {renderRow("C")}
                {renderRow("D")}
              </div>

              <div className="flex flex-col items-center gap-2 sm:gap-3">
                {renderRow("E")}
                {renderRow("F")}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mt-8 sm:mt-10">
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                {renderRow("G")}
                {renderRow("H")}
              </div>

              <div className="flex flex-col items-center gap-2 sm:gap-3">
                {renderRow("I")}
                {renderRow("J")}
              </div>
            </div>
          </div>

          {/* Seat legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded border border-red-500/50" />
              <span>Available</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-red-500" />
              <span>Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-gray-700 border border-gray-700" />
              <span>Occupied</span>
            </div>
          </div>

          <p className="mt-5 text-center text-gray-300">
            Selected seats:{" "}
            <span className="text-red-500 font-medium">
              {selectedSeats.length > 0
                ? selectedSeats.join(", ")
                : "None"}
            </span>
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 mt-7">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={bookingLoading}
              className="px-6 py-2.5 rounded-md border border-gray-600 hover:bg-white/10 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            <button
              type="button"
              onClick={bookTickets}
              disabled={
                !selectedTime ||
                selectedSeats.length === 0 ||
                seatsLoading ||
                bookingLoading
              }
              className="flex items-center gap-2 px-7 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingLoading
                ? "Creating Booking..."
                : "Proceed to Checkout"}

              {!bookingLoading && (
                <ArrowRightIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;