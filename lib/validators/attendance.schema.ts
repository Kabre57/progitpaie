import { z } from "zod";

export const checkInSchema = z.object({
  notes: z.string().optional(),
  outOfOffice: z.boolean().optional().default(false),
  location: z
    .object({
      lat: z.number({ message: "La latitude doit être un nombre" }),
      lng: z.number({ message: "La longitude doit être un nombre" }),
    })
    .nullable()
    .optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  notes: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .nullable()
    .optional(),
});

export type CheckOutInput = z.infer<typeof checkOutSchema>;
