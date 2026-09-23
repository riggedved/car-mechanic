import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Mechanic AI - Virtual Automotive Diagnostics & Repair Booking",
  description: "Chat with an ASE Master Certified virtual car mechanic. Troubleshoot vehicle faults, upload engine audio and inspection photos, generate diagnostic reports, and book certified repair appointments.",
  keywords: "car mechanic, automotive diagnosis, engine knock, brake squeal, check engine light, auto repair, book mechanic",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
