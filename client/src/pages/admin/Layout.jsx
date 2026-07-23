import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../../components/admin/AdminNavbar";
import AdminSidebar from "../../components/admin/AdminSidebar";

const Layout = () => {
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