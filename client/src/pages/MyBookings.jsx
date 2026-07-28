import React, { useEffect, useState } from "react";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../../context/AppContext";

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";

  const {
    axios,
    getToken,
    user,
  } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/user/bookings", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.log(error);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      getMyBookings();
    }

    window.scrollTo(0, 0);
  }, [user]);

  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-5 sm:px-8 md:px-16 lg:px-28 xl:px-36 pt-32 md:pt-40 pb-20 overflow-hidden">
      <BlurCircle top="100px" left="-100px" />
      <BlurCircle bottom="0" right="0" />

      <h1 className="text-xl font-semibold">
        My Bookings
      </h1>

      {bookings.length > 0 ? (
        <div className="flex flex-col gap-4 mt-7 w-full max-w-4xl">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="relative flex flex-col sm:flex-row justify-between gap-5 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <img
                  src={
                    booking.show.movie.backdrop_path?.startsWith("http")
                      ? booking.show.movie.backdrop_path
                      : `https://image.tmdb.org/t/p/original${booking.show.movie.backdrop_path}`
                  }
                  alt={booking.show.movie.title}
                  className="w-full sm:w-48 md:w-52 h-32 object-cover rounded-md"
                />

                <div className="flex flex-col justify-between py-2">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {booking.show.movie.title}
                    </h2>

                    <p className="text-sm text-gray-400 mt-1">
                      {formatRuntime(booking.show.movie.runtime)}
                    </p>
                  </div>

                  <p className="text-sm text-gray-300 mt-5 sm:mt-0">
                    {formatDate(booking.show.showDateTime)} at{" "}
                    {formatTime(booking.show.showDateTime)}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-5 px-2 py-2 sm:min-w-52">
                <div className="flex items-center gap-4">
                  <p className="text-2xl font-semibold">
                    {currency}
                    {booking.amount}
                  </p>

                  {!booking.isPaid && (
                    <button className="rounded-full bg-red-500 hover:bg-red-600 px-5 py-2 text-sm font-medium text-white transition cursor-pointer">
                      Pay Now
                    </button>
                  )}
                </div>

                <div className="text-right text-sm text-gray-300">
                  <p>
                    Total Tickets:
                    <span className="text-white ml-1">
                      {booking.bookedSeats.length}
                    </span>
                  </p>

                  <p className="mt-1">
                    Seat Number:
                    <span className="text-white ml-1">
                      {booking.bookedSeats.join(", ")}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-400">
            No bookings available.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyBookings;