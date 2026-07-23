import React, { useEffect, useState } from "react";
import {
  ChartLineIcon,
  CircleDollarSignIcon,
  PlayCircleIcon,
  UsersIcon,
  StarIcon,
} from "lucide-react";

import { dummyDashboardData } from "../../assets/assets";
import Loading from "../../components/Loading";
import Title from "../../components/Title";
import BlurCircle from "../../components/BlurCircle";
import  dateFormat  from "../../libs/dateFormat";

const Dashboard = () => {
  const currency = import.meta.env.VITE_CURRENCY;

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUser: 0,
  });

  const [loading, setLoading] = useState(true);

  const dashboardCards = [
    {
      title: "Total Bookings",
      value: dashboardData.totalBookings || "0",
      icon: ChartLineIcon,
    },
    {
      title: "Total Revenue",
      value: `${currency}${dashboardData.totalRevenue || "0"}`,
      icon: CircleDollarSignIcon,
    },
    {
      title: "Active Shows",
      value: dashboardData.activeShows.length || "0",
      icon: PlayCircleIcon,
    },
    {
      title: "Total Users",
      value: dashboardData.totalUser || "0",
      icon: UsersIcon,
    },
  ];

  const fetchDashboardData = async () => {
    setDashboardData(dummyDashboardData);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return !loading ? (
    <>
      <Title text1="Admin" text2="Dashboard" />

      <div className="relative mt-6">
        <BlurCircle top="-100px" left="0" />

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-5 py-5 rounded-lg border border-red-500/20 bg-red-500/10"
            >
              <div>
                <h1 className="text-sm text-gray-300">
                  {card.title}
                </h1>

                <p className="text-3xl font-semibold mt-2">
                  {card.value}
                </p>
              </div>

              <card.icon className="w-7 h-7 text-gray-300" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-lg font-medium">
        Active Shows
      </p>

      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10%" />

        {dashboardData.activeShows.map((show) => (
          <div
            key={show._id}
            className="w-55 rounded-lg overflow-hidden h-full pb-3 bg-red-500/10 border border-red-500/20 hover:-translate-y-1 transition duration-300"
          >
            <img
              src={show.movie.poster_path}
              alt={show.movie.title}
              className="h-60 w-full object-cover"
            />

            <p className="font-medium p-2 truncate">
              {show.movie.title}
            </p>

            <div className="flex items-center justify-between px-2">
              <p className="text-lg font-medium">
                {currency} {show.showPrice}
              </p>

              <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                <StarIcon className="w-4 h-4 text-red-500 fill-red-500" />

                {show.movie.vote_average.toFixed(1)}
              </p>
            </div>

            <p className="px-2 pt-2 text-sm text-gray-500">
              {dateFormat(show.showDateTime)}
            </p>
          </div>
        ))}
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default Dashboard;