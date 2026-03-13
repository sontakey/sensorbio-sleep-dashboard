import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sensorbio-sleep-dashboard.vercel.app'),
  title: 'Sensor Bio — 30-Day Sleep Dashboard',
  description:
    'Generate personalized 30-day sleep reports with clinical-grade biometric data from Sensor Bio wearables.',
  openGraph: {
    title: 'Sensor Bio — 30-Day Sleep Dashboard',
    description:
      'Generate personalized 30-day sleep reports with clinical-grade biometric data from Sensor Bio wearables.',
    siteName: 'Sensor Bio',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sensor Bio — 30-Day Sleep Dashboard',
    description: 'Generate personalized 30-day sleep reports with clinical-grade biometric data.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/sensorbio-logo.png',
    apple: '/sensorbio-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
