import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import toast from "react-hot-toast";

import {
  assets,
  dummyDateTimeData,
  dummyShowsData,
} from "../assets/assets";

import BlurCircle from "../components/BlurCircle";

const SeatLayout = () => {
  const { id, date } = useParams();
  const navigate = useNavigate();

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);

  useEffect(() => {
    const selectedMovie = dummyShowsData.find(
      (movie) =>
        String(movie.id) === String(id) ||
        String(movie._id) === String(id)
    );

    if (selectedMovie) {
      setShow({
        movie: selectedMovie,
        dateTime: dummyDateTimeData,
      });
    }

    window.scrollTo(0, 0);
  }, [id]);

  const handleSeatClick = (seatId) => {
    if (
      !selectedSeats.includes(seatId) &&
      selectedSeats.length >= 5
    ) {
      toast.error("You can select a maximum of 5 seats.");
      return;
    }

    setSelectedSeats((previousSeats) =>
      previousSeats.includes(seatId)
        ? previousSeats.filter((seat) => seat !== seatId)
        : [...previousSeats, seatId]
    );
  };

  const renderSeat = (row, seatNumber) => {
    const seatId = `${row}${seatNumber}`;
    const isSelected = selectedSeats.includes(seatId);

    return (
      <button
        key={seatId}
        type="button"
        onClick={() => handleSeatClick(seatId)}
        className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded border text-[10px] sm:text-xs font-medium transition cursor-pointer ${
          isSelected
            ? "bg-red-500 border-red-500 text-white"
            : "border-red-500/50 text-gray-200 hover:bg-red-500/20"
        }`}
      >
        {seatId}
      </button>
    );
  };

  const renderRow = (row, count = 8) => {
    return (
      <div className="flex justify-center gap-1.5 sm:gap-2">
        {Array.from({ length: count }, (_, index) =>
          renderSeat(row, index + 1)
        )}
      </div>
    );
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleProceed = () => {
    if (!selectedTime) {
      toast.error("Please select a show time.");
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat.");
      return;
    }

    toast.success("Seats selected successfully!");

    setTimeout(() => {
      navigate("/my-bookings");
    }, 700);
  };

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading show...</p>
      </div>
    );
  }

  const availableTimes = show.dateTime?.[date] || [];

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
                availableTimes.map((item) => (
                  <button
                    key={item.showId}
                    type="button"
                    onClick={() => {
                      setSelectedTime(item);
                      setSelectedSeats([]);
                    }}
                    className={`flex items-center gap-2 w-full px-5 py-3 text-left transition cursor-pointer ${
                      selectedTime?.showId === item.showId
                        ? "bg-red-500 text-white"
                        : "hover:bg-red-500/20 text-gray-300"
                    }`}
                  >
                    <ClockIcon className="w-4 h-4 shrink-0" />

                    <span className="text-sm">
                      {formatTime(item.time)}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-5 text-sm text-gray-400">
                  No timings available for this date.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seat section */}
        <div className="relative flex-1 min-w-0 flex flex-col items-center">
          <BlurCircle top="-80px" left="-80px" />
          <BlurCircle bottom="-80px" right="-80px" />

          <h1 className="text-2xl md:text-3xl font-semibold mb-6">
            Select your seat
          </h1>

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
            {/* Rows A and B */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              {renderRow("A")}
              {renderRow("B")}
            </div>

            {/* Rows C to F */}
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

            {/* Rows G to J */}
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
              className="px-6 py-2.5 rounded-md border border-gray-600 hover:bg-white/10 transition cursor-pointer"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleProceed}
              className="flex items-center gap-2 px-7 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition cursor-pointer"
            >
              Proceed to Checkout
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;