import { z } from "zod";

export const provisionQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
}).strict();

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "asOf doit respecter le format YYYY-MM-DD").refine(
  (value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  },
  "asOf doit être une date valide"
);

export const provisionV2QuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  asOf: isoDateSchema.optional(),
}).strict().refine(({ year, asOf }) => !(year && asOf), {
  message: "year et asOf ne peuvent pas être utilisés simultanément",
});

export type ProvisionV2Query = z.infer<typeof provisionV2QuerySchema>;
