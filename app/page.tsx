"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login"); // Always start at login page
  }, []);

  return <p style={{ padding: "2rem" }}>Redirecting to login...</p>;
}
