import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { connection } from "next/server"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { NavProgress } from "@/components/nav-progress"
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "CogniFlip — AI voice assistant",
  description:
    "A premium AI voice assistant that listens, thinks, and replies — in real time.",
  generator: "v0.app",
  // The orb mark doubles as favicon, Apple touch icon, and OG image so the
  // brand reads consistently in browser tabs, home-screen shortcuts, and
  // shared links.
  icons: {
    icon: "/cogniflip-logo.jpg",
    shortcut: "/cogniflip-logo.jpg",
    apple: "/cogniflip-logo.jpg",
  },
  openGraph: {
    title: "CogniFlip — AI voice assistant",
    description:
      "A premium AI voice assistant that listens, thinks, and replies — in real time.",
    images: [{ url: "/cogniflip-logo.jpg", width: 1024, height: 1024, alt: "CogniFlip" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CogniFlip — AI voice assistant",
    description:
      "A premium AI voice assistant that listens, thinks, and replies — in real time.",
    images: ["/cogniflip-logo.jpg"],
  },
}

export const viewport: Viewport = {
  themeColor: "#f7eee8",
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await connection()

  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        {children}
        <Suspense fallback={null}>
          <OnboardingProvider />
        </Suspense>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
