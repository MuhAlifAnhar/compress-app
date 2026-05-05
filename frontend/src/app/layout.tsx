import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "FileCompress & Convert | Premium File Optimization",
  description: "High-performance file compression and conversion tool. Reduce size by 80% with visual excellence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} font-sans`}>
      <body className="antialiased min-h-screen flex flex-col">
        <div className="flex-grow">
          {children}
        </div>
        <footer className="py-10 border-t border-white/5 text-center text-white/40 text-sm">
          <p>
            Dibuat oleh{" "}
            <a 
              href="http://www.zeetech.my.id" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              PT Zeetech Digital Indonesia
            </a>{" "}
            &{" "}
            <a 
              href="https://www.instagram.com/itsalifanhar/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Muh. Alif Anhar
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
