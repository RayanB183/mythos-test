import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paydar — Know which brands owe you, and who's late",
  description:
    "Track your brand deals from pitch to paid. Paydar counts down every invoice's payment terms and flags the moment a brand goes late. Free to start.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
