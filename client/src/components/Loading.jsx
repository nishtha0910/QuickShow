import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Loading = ({ message = "Loading..." }) => {
  const { nextUrl } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!nextUrl) return;

    const timer = setTimeout(() => {
      navigate(`/${nextUrl}`, {
        replace: true,
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [nextUrl, navigate]);

  return (
    <div className="flex flex-col justify-center items-center gap-4 min-h-[80vh]">
      <div className="animate-spin rounded-full h-14 w-14 border-2 border-gray-700 border-t-red-500" />

      <p className="text-sm text-gray-400">
        {nextUrl
          ? "Payment completed. Redirecting..."
          : message}
      </p>
    </div>
  );
};

export default Loading;