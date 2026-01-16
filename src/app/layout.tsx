// 1. KEEP ALL YOUR EXISTING IMPORTS AT THE TOP
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Poppins, Space_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/AuthContext";
import { TypingProvider } from "@/contexts/TypingContext";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import { Toaster } from "@/components/ui/sonner";
import AnalyticsListener from "@/components/AnalyticsListener";

// 2. KEEP ALL YOUR FONT CONSTANTS
const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: "400",
  subsets: ["latin"],
});

// 3. KEEP YOUR METADATA & VIEWPORT
export const metadata: Metadata = {
  title: "Yudi",
  description: "Yudi - Your Indian college companion for mental health support",
  icons: {
    icon: "/yudi.svg",
    apple: "/yudi.svg",
    shortcut: "/yudi.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#a855f7",
};

// 4. UPDATE THE MAIN FUNCTION HERE
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // --- ADD THIS OBJECT HERE ---
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Yudi",
    "operatingSystem": "Web",
    "applicationCategory": "MultimediaApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "Create your mama who speaks your vibe. Yudi is an AI persona creator that gets you."
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* --- ADD THIS SCRIPT TAG HERE --- */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${poppins.variable} ${plusJakartaSans.variable} ${spaceMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AnalyticsListener />
          <AuthProvider>
            <TypingProvider>
              <AccessControlWrapper>
                {children}
              </AccessControlWrapper>
              <Toaster />
            </TypingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
