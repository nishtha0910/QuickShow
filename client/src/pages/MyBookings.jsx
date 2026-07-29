import React, { useEffect, useState } from "react";
import BlurCircle from "../components/BlurCircle";
import Loading from "../components/Loading";
import { useAppContext } from "../../context/AppContext";

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";

  const { axios, getToken, user } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMyBookings = async () => {
    try {
      setIsLoading(true);

      const token = await getToken();

      if (!token) {
        setBookings([]);
        return;
      }

      const { data } = await axios.get(
        "/api/user/bookings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error(
        "Get bookings error:",
        error.response?.data || error.message
      );

      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getMyBookings();
    } else {
      setBookings([]);
      setIsLoading(false);
    }

    window.scrollTo(0, 0);
  }, [user]);

  const formatRuntime = (minutes = 0) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "long",
        day: "numeric",
      }
    );
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const getImageUrl = (path) => {
    if (!path) {
      return "";
    }

    if (path.startsWith("http")) {
      return path;
    }

    return `https://image.tmdb.org/t/p/original${path}`;
  };

  if (isLoading) {
    return <Loading message="Loading your bookings..." />;
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
          {bookings.map((booking) => {
            const movie = booking.show?.movie;
            const showDateTime =
              booking.show?.showDateTime;

            return (
              <div
                key={booking._id}
                className="relative flex flex-col sm:flex-row justify-between gap-5 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <img
                    src={getImageUrl(
                      movie?.backdrop_path
                    )}
                    alt={movie?.title || "Movie"}
                    className="w-full sm:w-48 md:w-52 h-32 object-cover rounded-md"
                  />

                  <div className="flex flex-col justify-between py-2">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {movie?.title}
                      </h2>

                      <p className="text-sm text-gray-400 mt-1">
                        {formatRuntime(
                          movie?.runtime
                        )}
                      </p>
                    </div>

                    {showDateTime && (
                      <p className="text-sm text-gray-300 mt-5 sm:mt-0">
                        {formatDate(showDateTime)} at{" "}
                        {formatTime(showDateTime)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-5 px-2 py-2 sm:min-w-52">
                  <div className="flex items-center gap-4">
                    <p className="text-2xl font-semibold">
                      {currency}
                      {booking.amount}
                    </p>

                    {!booking.isPaid &&
                      booking.paymentLink && (
                        <a
                          href={booking.paymentLink}
                          className="rounded-full bg-red-500 hover:bg-red-600 px-5 py-2 text-sm font-medium text-white transition cursor-pointer"
                        >
                          Pay Now
                        </a>
                      )}

                    {booking.isPaid && (
                      <span className="rounded-full bg-green-500/20 border border-green-500/40 px-4 py-1.5 text-sm font-medium text-green-400">
                        Paid
                      </span>
                    )}
                  </div>

                  <div className="text-right text-sm text-gray-300">
                    <p>
                      Total Tickets:
                      <span className="text-white ml-1">
                        {booking.bookedSeats
                          ?.length || 0}
                      </span>
                    </p>

                    <p className="mt-1">
                      Seat Number:
                      <span className="text-white ml-1">
                        {booking.bookedSeats?.join(
                          ", "
                        ) || ""}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
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