import jsPDF from "jspdf";
import QRCode from "qrcode";

export async function generateCertificatePdf(opts: {
  fullName: string;
  courseTitle: string;
  completedAt: string;
  code: string;
  verifyUrl: string;
}) {
  const { fullName, courseTitle, completedAt, code, verifyUrl } = opts;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(252, 253, 248);
  doc.rect(0, 0, W, H, "F");

  // Outer green border
  doc.setDrawColor(34, 139, 60);
  doc.setLineWidth(6);
  doc.rect(24, 24, W - 48, H - 48);

  // Inner thin border
  doc.setDrawColor(34, 139, 60);
  doc.setLineWidth(1);
  doc.rect(36, 36, W - 72, H - 72);

  // AgriMate header
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 60);
  doc.setFontSize(18);
  doc.text("AgriMate", W / 2, 80, { align: "center" });

  // Title
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(40);
  doc.text("Certificate of Completion", W / 2, 150, { align: "center" });

  // "Presented to"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(90, 90, 90);
  doc.text("This certifies that", W / 2, 200, { align: "center" });

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(34, 139, 60);
  doc.text(fullName || "AgriMate Farmer", W / 2, 250, { align: "center" });

  // For course
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(90, 90, 90);
  doc.text("has successfully completed the course", W / 2, 290, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(courseTitle, W / 2, 330, { align: "center" });

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(120, 120, 120);
  doc.text(`Awarded ${new Date(completedAt).toLocaleDateString()}`, W / 2, 375, { align: "center" });

  // Gold seal (circle)
  const sealX = W / 2;
  const sealY = 450;
  doc.setFillColor(212, 175, 55);
  doc.circle(sealX, sealY, 36, "F");
  doc.setFillColor(184, 148, 31);
  doc.circle(sealX, sealY, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("VERIFIED", sealX, sealY + 4, { align: "center" });

  // QR
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 180, margin: 1 });
  doc.addImage(qrDataUrl, "PNG", W - 140, H - 140, 90, 90);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Scan to verify", W - 95, H - 42, { align: "center" });

  // Code
  doc.setFontSize(10);
  doc.text(`Certificate ID: ${code}`, 60, H - 60);
  doc.text(verifyUrl, 60, H - 45);

  doc.save(`AgriMate-Certificate-${code}.pdf`);
}

export function generateCertCode() {
  return `AM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
