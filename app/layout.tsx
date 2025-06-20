import { type Metadata } from 'next'
import { Inter } from "next/font/google";
import {
  ClerkProvider,
} from '@clerk/nextjs'
// import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from "@/components/Navbar";
import { neobrutalism } from "@clerk/themes";
import Footer from '@/components/Footer';
const inter = Inter({ subsets: ["latin"] });

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// })

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// })

export const metadata: Metadata = {
  title: 'Wellness Hub',
  description: 'Your Complete Wellness Starts From Here',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: [neobrutalism], }}>
      <html lang="en">
        <body className={inter.className}>
          <div className="mx-auto">
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}