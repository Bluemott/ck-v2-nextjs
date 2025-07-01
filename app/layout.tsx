import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingSocialMedia from "./components/FloatingSocialMedia";
import Analytics from "./components/Analytics";
import StructuredData, { organizationStructuredData, websiteStructuredData } from "./components/StructuredData";
import { defaultMetadata } from "./lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Site Verification */}
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "your-google-verification-code"} />
        
        {/* Structured Data */}
        <StructuredData type="Organization" data={organizationStructuredData} />
        <StructuredData type="WebSite" data={websiteStructuredData} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ marginTop: "67px" }} // Adjust margin to match the height of the Navbar
      >
        {/* Google Analytics */}
        <Analytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XXXXXXXXXX"} />
        
        <Navbar />
        {children}
        <FloatingSocialMedia />
        <Footer />
      </body>
    </html>
  );
}
