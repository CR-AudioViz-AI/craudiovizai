// DEBUG — remove after identifying active file
console.log('DASHBOARD FILE: app/dashboard/layout.tsx');
import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://craudiovizai.com/dashboard",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

