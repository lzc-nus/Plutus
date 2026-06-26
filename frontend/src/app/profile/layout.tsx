import type { ReactNode } from "react";
import Navbar from "@/components/public/Navbar";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
