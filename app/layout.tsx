import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/Navbar";

export const metadata: Metadata = {
  title: "AI Discovery Engine — INDmoney SIP Retention Intelligence",
  description: "AI-driven discovery of behavioral drop-off triggers and retention opportunities for SIP investors on INDmoney.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans selection:bg-ind-blue selection:text-white">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-ind-border-subtle bg-[#0B0E14] py-8 text-xs text-slate-500">
          <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ind-emerald" />
              <span>INDmoney AI Discovery Engine · Graduation Project NextLeap</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="tabular-nums">8,179 Ingested</span>
              <span>·</span>
              <span className="tabular-nums">10 Opportunity Themes</span>
              <span>·</span>
              <span className="tabular-nums">7D Extraction</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
