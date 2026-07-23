import React from "react";

const BlurCircle = ({
  top = "auto",
  left = "auto",
  right = "auto",
  bottom = "auto",
}) => {
  return (
    <div
      className="absolute -z-10 h-72 w-72 rounded-full bg-red-500/20 blur-3xl"
      style={{
        top,
        left,
        right,
        bottom,
      }}
    ></div>
  );
};

export default BlurCircle;