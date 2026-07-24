import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./config/db.js";

import doctorRouter from "./routes/doctorRoute.js";
import serviceRouter from "./routes/serviceRouter.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRoute.js";
import appointmentRouter from "./routes/appointmentRoute.js";

dotenv.config();


console.log("CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY);
console.log("CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "Loaded" : "Missing");

const app = express();
 

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://doctor-managment-system-o8ev.vercel.app",
];

// ======================
// CREATE UPLOADS FOLDER
// ======================

// const uploadsPath = path.join(process.cwd(), "uploads");

// if (!fs.existsSync(uploadsPath)) {
//   fs.mkdirSync(uploadsPath, { recursive: true });
// }

// ======================
// MIDDLEWARE
// ======================

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(clerkMiddleware());

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// ======================
// STATIC FOLDER
// ======================

app.use("/uploads", express.static("uploads"));

// ======================
// DATABASE
// ======================

connectDB();

// ======================
// ROUTES
// ======================

app.use("/api/doctors", doctorRouter);
app.use("/api/services", serviceRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/service-appointments", serviceAppointmentRouter);

// ======================
// TEST ROUTE
// ======================

app.get("/", (req, res) => {
  res.send("API is Working Port 4000!");
});

// ======================
// SERVER
// ======================

const port = process.env.PORT || 4000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server Started on port ${port}`);
});

export default app;