import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  ListCollapseIcon,
  ListIcon,
  PlusSquareIcon,
} from "lucide-react";
import { assets } from "../../assets/assets";

const AdminSidebar = () => {
  const user = {
    firstName: "Admin",
    lastName: "User",
    imageUrl: assets.profile,
  };

  const adminNavLinks = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboardIcon,
    },
    {
      name: "Add Shows",
      path: "/admin/add-shows",
      icon: PlusSquareIcon,
    },
    {
      name: "List Shows",
      path: "/admin/list-shows",
      icon: ListIcon,
    },
    {
      name: "List Bookings",
      path: "/admin/list-bookings",
      icon: ListCollapseIcon,
    },
  ];

  return (
    <aside className="h-[calc(100vh-64px)] w-64 shrink-0 border-r border-gray-300/20 text-sm overflow-hidden">
      <div className="flex flex-col items-center pt-8">
        <img
          src={user.imageUrl}
          alt="Admin profile"
          className="h-14 w-14 rounded-full"
        />

        <p className="mt-2 text-base">
          {user.firstName} {user.lastName}
        </p>
      </div>

      <nav className="mt-6 w-full">
        {adminNavLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/admin"}
            className={({ isActive }) =>
              `relative flex w-full items-center gap-3 py-3 pl-10 text-gray-400 transition ${
                isActive
                  ? "bg-red-500/15 text-red-500"
                  : "hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className="h-5 w-5" />

                <span>{link.name}</span>

                {isActive && (
                  <span className="absolute right-0 h-10 w-1.5 rounded-l bg-red-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;