"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ThemeApplier() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const t = localStorage.getItem("site-theme");
      if (t) document.documentElement.setAttribute("data-theme", t);
      else document.documentElement.removeAttribute("data-theme");
    } catch {}
  }, [pathname]);
  return null;
}
