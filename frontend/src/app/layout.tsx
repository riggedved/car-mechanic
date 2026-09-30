import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TORQUE AI — Virtual Automotive Telemetry & Diagnostics",
  description: "Senior Master Certified virtual automotive diagnostic station. Troubleshoot mechanical faults, inspect acoustic waveforms and photos, generate DVI reports, and book certified repair bays.",
  keywords: "car mechanic, automotive diagnostics, OBD-II, brake squeal, check engine light, auto repair, book mechanic",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0f131c" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased">{children}</body>
    </html>
  );
}

