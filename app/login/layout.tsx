import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://craudiovizai.com/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

