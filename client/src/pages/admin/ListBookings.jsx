import React, { useEffect, useState } from "react";
import { dummyBookingData } from "../../assets/assets";
import Loading from "../../components/Loading";
import Title from "../../components/Title";
import dateFormat from "../../libs/dateFormat";
import { useAppContext } from "../../../context/AppContext";

const ListBookings = () => {

  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

 const getAllBookings = async () => {
  try {
    setIsLoading(true);

    const token = await getToken();

    const { data } = await axios.get(
      "/api/admin/all-bookings",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data.success) {
      setBookings(data.bookings || []);
    } else {
      toast.error(
        data.message || "Failed to fetch bookings."
      );
    }
  } catch (error) {
    console.error(
      "Error fetching bookings:",
      error.response?.data || error.message
    );

    toast.error(
      error.response?.data?.message ||
        "Failed to fetch bookings."
    );
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
  if (user) {
    getAllBookings();
  }
}, [user]);

  return !isLoading ? (
    <>
      <Title text1="List" text2="Bookings" />

      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-[#3a171b] text-left text-white">
              <th className="p-2 font-medium pl-5">User Name</th>
              <th className="p-2 font-medium">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Seats</th>
              <th className="p-2 font-medium">Amount</th>
            </tr>
          </thead>

          <tbody className="text-sm font-light">
            {bookings.map((item, index) => (
              <tr
                key={index}
                className="border-b border-[#3a171b] bg-[#1c1417] hover:bg-[#26181c] transition"
              >
                <td className="p-2 min-w-45 pl-5">
                  {item.user.name}
                </td>

                <td className="p-2">
                  {item.show.movie.title}
                </td>

                <td className="p-2">
                  {dateFormat(item.show.showDateTime)}
                </td>

                <td className="p-2">
                  {Object.keys(item.bookedSeats)
                    .map((seat) => item.bookedSeats[seat])
                    .join(", ")}
                </td>

                <td className="p-2">
                  {currency}
                  {item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default ListBookings;