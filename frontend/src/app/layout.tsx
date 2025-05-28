import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Pixelify_Sans } from "next/font/google";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { ChatProvider, ChatLoadingProvider } from "./services/ChatContext";
import AutoRefreshClient from './components/AutoRefreshClient';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


const pressStart2P = Press_Start_2P({
  variable: "--font-press-start-2p",
  weight: "400",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "NicorAI - Intelligent AI Solutions",
  description: "NicorAI provides advanced AI solutions tailored to your business needs. Chat with our assistant to get started.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          async
          defer
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pixelifySans.variable} ${pressStart2P.variable} antialiased bg-gray-50`}
      >
        <AutoRefreshClient />
        <ChatProvider>
          <ChatLoadingProvider>
            {children}
          </ChatLoadingProvider>
        </ChatProvider>
      </body>
    </html>
  );
}



