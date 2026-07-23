import express from "express";
import multer from "multer";
import path from "path";

import {
  createDoctor,
  deleteDoctor,
  doctorLogin,
  getDoctorById,
  getDoctors,
  toggleAvailability,
  updateDoctor
} from "../controllers/doctorController.js";

import { authDoctor } from "../middleware/doctorAuth.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const doctorRouter = express.Router();

doctorRouter.get("/", getDoctors);
doctorRouter.post("/login", doctorLogin);
doctorRouter.post("/", upload.single("image"), createDoctor);
doctorRouter.get("/:id", getDoctorById);

doctorRouter.put("/:id", authDoctor, upload.single("image"), updateDoctor);

doctorRouter.patch("/:id/availability", authDoctor, toggleAvailability);

doctorRouter.delete("/:id", deleteDoctor);

export default doctorRouter;