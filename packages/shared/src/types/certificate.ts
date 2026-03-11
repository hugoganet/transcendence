import type { z } from "zod";
import type {
  certificateSchema,
  publicCertificateSchema,
  certificateShareResponseSchema,
} from "../schemas/certificate.js";

export type Certificate = z.infer<typeof certificateSchema>;
export type PublicCertificate = z.infer<typeof publicCertificateSchema>;
export type CertificateShareResponse = z.infer<typeof certificateShareResponseSchema>;
