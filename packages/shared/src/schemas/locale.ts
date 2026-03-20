import { z } from "zod";

export const localeParamSchema = z.object({
  locale: z.enum(["en", "fr"]),
});

export type LocaleParam = z.infer<typeof localeParamSchema>;
