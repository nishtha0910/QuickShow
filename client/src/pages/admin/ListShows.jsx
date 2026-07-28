import React, { useEffect, useState } from "react";
import { dummyShowsData } from "../../assets/assets";
import Loading from "../../components/Loading";
import Title from "../../components/Title";
import dateFormat from "../../libs/dateFormat";
import { useAppContext } from "../../../context/AppContext";

const ListShows = () => {

  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAllShows = async () => {
  try {
    setLoading(true);

    const token = await getToken();

    const { data } = await axios.get(
      "/api/admin/all-shows",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data.success) {
      setShows(data.shows || []);
    } else {
      toast.error(data.message || "Failed to fetch shows");
    }
  } catch (error) {
    console.error(
      "Error fetching shows:",
      error.response?.data || error.message
    );

    toast.error(
      error.response?.data?.message ||
        "Failed to fetch shows"
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  if (user) {
    getAllShows();
  }
}, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />

      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-[#3a171b] text-left text-white">
              <th className="p-2 font-medium pl-5">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Total Bookings</th>
              <th className="p-2 font-medium">Earnings</th>
            </tr>
          </thead>

          <tbody className="text-sm font-light">
            {shows.map((show, index) => (
              <tr
                key={index}
                className="bg-[#1c1417] border-b border-[#3a171b] hover:bg-[#26181c] transition"
              >
                <td className="p-2 min-w-45 pl-5">
                  {show.movie.title}
                </td>

                <td className="p-2">
                  {dateFormat(show.showDateTime)}
                </td>

                <td className="p-2">
                  {Object.keys(show.occupiedSeats).length}
                </td>

                <td className="p-2">
                  {currency}
                  {Object.keys(show.occupiedSeats).length * show.showPrice}
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

export default ListShows;