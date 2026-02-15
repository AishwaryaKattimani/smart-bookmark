import "./globals.css";
import ThemeProviderWrapper from "./components/ThemeProviderWrapper";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          antialiased
          bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
          min-h-screen
        `}
      >
        <ThemeProviderWrapper>
          <main className="min-h-screen p-6">{children}</main>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
