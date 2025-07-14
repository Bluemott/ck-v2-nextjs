import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingSocialMedia from "./components/FloatingSocialMedia";
import StructuredData, {
  organizationStructuredData,
  websiteStructuredData,
} from "./components/StructuredData";
import { defaultMetadata } from "./lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...defaultMetadata,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/CK_Logo_Title-01.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Site Verification */}
        <meta
          name="google-site-verification"
          content={
            process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ||
            "your-google-verification-code"
          }
        />

        {/* Google Analytics - Direct Script Tags */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${
            process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-VYVT6J7XLS"
          }`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${
                process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-VYVT6J7XLS"
              }');
            `,
          }}
        />

        {/* Structured Data */}
        <StructuredData type="Organization" data={organizationStructuredData} />
        <StructuredData type="WebSite" data={websiteStructuredData} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#8B4513" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ marginTop: "67px" }} // Adjust margin to match the height of the Navbar
      >
        <Navbar />
        {children}
        <FloatingSocialMedia />
        <Footer />
      </body>
    </html>
  );
}
