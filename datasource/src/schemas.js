import { z } from "zod";

export const LoanAccountPeriodicValueSchema = z.record(
  z.number().transform((v) => v / 1000),
);
