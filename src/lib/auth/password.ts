import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Lösenordet måste vara minst 8 tecken")
  .max(128, "Lösenordet får vara högst 128 tecken");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Ange en giltig e-postadress")
  .max(254);

export const nameSchema = z.string().trim().min(1, "Ange ditt namn").max(100);
