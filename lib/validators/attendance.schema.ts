import { z } from "zod";

export const checkInSchema = z.object({
  notes: z.string().optional(),
  outOfOffice: z.boolean().optional().default(false),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracyMeters: z.number().nonnegative().max(10_000).optional().default(15),
  isRemote: z.boolean().optional().default(false),
  location: z
    .object({
      lat: z.number({ message: "La latitude doit être un nombre" }),
      lng: z.number({ message: "La longitude doit être un nombre" }),
    })
    .nullable()
    .optional(),
}).strict();

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
