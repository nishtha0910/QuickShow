import express from "express";
import {
  getNowPlayingMovies,
  getMovieTrailers,
  addShow,
  getShows,
  getShow,
} from "../controller/showController.js";

import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

// Admin routes
showRouter.get(
  "/now-playing",
  protectAdmin,
  getNowPlayingMovies
);

showRouter.post(
  "/add",
  protectAdmin,
  addShow
);

// Public routes
showRouter.get(
  "/trailers",
  getMovieTrailers
);

showRouter.get(
  "/all",
  getShows
);

showRouter.get(
  "/:movieId",
  getShow
);

export default showRouter;