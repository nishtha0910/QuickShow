import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AdminNavbar from "../../components/admin/AdminNavbar";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useAppContext } from "../../../context/AppContext";

const Layout = () => {
  const { isAdmin } = useAppContext();

  // null means the admin check is still running
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        Checking admin access...
      </div>
    );
  }

  // Signed in, but not an admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <AdminNavbar />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 h-[calc(100vh-64px)] overflow-y-auto px-4 py-10 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;