import { z } from "zod";
import validator from "validator";

export const propertySchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10).max(5000),
  price: z.number().positive().max(99999999),
  location: z.string().min(2).max(100),
  images: z.array(z.string().url()).min(1).max(10),
  details: z.record(z.string(), z.unknown()).optional(),
  owner_id: z.string().min(1).max(255),
});

export const bookingSchema = z.object({
  property_id: z.number().int().positive(),
  user_name: z.string().min(2).max(255),
  user_phone: z.string().min(5).max(50),
  start_date: z.string().refine((val) => validator.isISO8601(val), {
    message: "Invalid date format",
  }).refine((val) => new Date(val) > new Date(), {
    message: "Start date must be in the future",
  }),
  end_date: z.string().refine((val) => validator.isISO8601(val), {
    message: "Invalid date format",
  }),
  total_price: z.number().positive(),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

export const bookingStatusSchema = z.enum(["pending", "confirmed", "cancelled"]);

export const paymentSchema = z.object({
  property_id: z.number().int().positive(),
  title: z.string().min(1),
  total_price: z.number().positive(),
  user_name: z.string().min(1),
  booking_id: z.number().int().positive().optional(),
});
