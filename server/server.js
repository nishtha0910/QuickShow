import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";

import connectDB from "./configs/db.js";
import { inngest, functions } from "./inngest/index.js";

import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";

import { stripeWebhooks } from "./controller/stripeWebhooks.js";

const app = express();
const port = process.env.PORT || 3000;

// Connect MongoDB
await connectDB();

// Stripe webhook must come before express.json()
app.use(
  "/api/stripe",
  express.raw({
    type: "application/json",
  }),
  stripeWebhooks
);

// Normal middleware
app.use(cors());
app.use(express.json());

// Inngest route must stay public
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  })
);

// Public home route
app.get("/", (req, res) => {
  res.send("Server is Live!");
});

// Clerk middleware
app.use(clerkMiddleware());

// Application routes
app.use("/api/show", showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

// Export app for Vercel
export default app;

// Start local server only
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(
      `Server listening at http://localhost:${port}`
    );
  });
}