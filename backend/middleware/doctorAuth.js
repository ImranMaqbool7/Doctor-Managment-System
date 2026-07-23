import { requireAuth } from "@clerk/express";

export const authDoctor = requireAuth();