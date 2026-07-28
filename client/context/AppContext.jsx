import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);

  const { user, isLoaded: isUserLoaded } = useUser();
  const {
    getToken,
    isLoaded: isAuthLoaded,
    isSignedIn,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  // Check whether the logged-in user is an admin
const fetchIsAdmin = async () => {
  setAdminLoading(true);

  try {
    const token = await getToken();

    if (!token) {
      setIsAdmin(false);
      return false;
    }

    const { data } = await axios.get("/api/admin/is-admin", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const adminStatus =
      data.success === true && data.isAdmin === true;

    setIsAdmin(adminStatus);

    return adminStatus;
  } catch (error) {
    console.error(
      "Admin check error:",
      error.response?.data || error.message
    );

    setIsAdmin(false);
    return false;
  } finally {
    setAdminLoading(false);
  }
};

// Get all movies that have upcoming shows
const fetchShows = async () => {
  try {
    const { data } = await axios.get("/api/show/all");

    if (data.success) {
      setShows(data.shows || []);
    } else {
      toast.error(data.message || "Could not load shows");
    }
  } catch (error) {
    console.error(
      "Fetch shows error:",
      error.response?.data || error.message
    );
  }
};
  // Get the logged-in user's favorite movies
  const fetchFavoriteMovies = async () => {
  try {
    setFavoriteMovies([]);

    const token = await getToken();

    if (!token) {
      return;
    }

    const { data } = await axios.get("/api/user/favorites", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Favorites response:", data);

    if (data.success) {
      setFavoriteMovies(data.movies || []);
    } else {
      setFavoriteMovies([]);
      toast.error(data.message || "Could not load favorites");
    }
  } catch (error) {
    console.error(
      "Fetch favorites error:",
      error.response?.data || error.message
    );

    setFavoriteMovies([]);
  }
};

  // Fetch public shows when the application loads
  useEffect(() => {
    fetchShows();
  }, []);

  // Check protected user information after Clerk finishes loading
  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded) {
      return;
    }

    if (isSignedIn && user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    } else {
      setIsAdmin(false);
      setAdminLoading(false);
      setFavoriteMovies([]);
    }
  }, [isUserLoaded, isAuthLoaded, isSignedIn, user]);

  const value = {
    axios,

    user,
    getToken,
    isSignedIn,
    isUserLoaded,
    isAuthLoaded,

    navigate,

    isAdmin,
    setIsAdmin,
    adminLoading,
    fetchIsAdmin,

    shows,
    setShows,
    fetchShows,

    favoriteMovies,
    setFavoriteMovies,
    fetchFavoriteMovies,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};