/**
 * @module services/certificatePdfService
 * @description Generates downloadable PDF certificates using jsPDF.
 */

import { jsPDF } from "jspdf";
import type { Certificate } from "@transcendence/shared";

export async function generateCertificatePdf(
  certificate: Certificate,
  userName: string
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Background color
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, 210, 297, "F");

  // Set text color to white
  doc.setTextColor(255, 255, 255);

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Certificate of Completion", 105, 50, { align: "center" });

  // Curriculum
  doc.setFontSize(32);
  doc.text(certificate.curriculumTitle, 105, 90, { align: "center" });

  // User section
  doc.setFontSize(14);
  doc.text("Awarded to", 105, 130, { align: "center" });

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(userName, 105, 150, { align: "center" });

  // Stats
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${certificate.totalMissions} Missions | ${certificate.totalCategories} Categories`,
    105,
    180,
    { align: "center" }
  );

  // Date
  doc.setFontSize(10);
  doc.text(
    `Completed on ${new Date(certificate.completionDate).toLocaleDateString()}`,
    105,
    210,
    { align: "center" }
  );

  // Share token
  doc.setFontSize(8);
  doc.text(`Share Token: ${certificate.shareToken}`, 105, 240, {
    align: "center",
  });

  doc.setFontSize(8);
  if (certificate.nftTokenId) {
    doc.text(`Token ID: ${certificate.nftTokenId}`, 105, 250, { align: "center" });
  }
  if (certificate.nftTxHash) {
    doc.text(`Tx Hash: ${certificate.nftTxHash.substring(0, 20)}...`, 105, 260, { align: "center" });
  }
  
  return Buffer.from(doc.output("arraybuffer"));
}