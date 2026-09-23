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
      </head>
      <body>{children}</body>
    </html>
  );
}
