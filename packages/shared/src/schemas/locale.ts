import { z } from "zod";

export const localeParamSchema = z.object({
  locale: z.enum(["en", "fr", "es"]),
});

export type LocaleParam = z.infer<typeof localeParamSchema>;
