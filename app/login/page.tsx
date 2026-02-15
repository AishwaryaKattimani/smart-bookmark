"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/bookmarks");
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/bookmarks",
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) alert(error.message);
  };

  if (loading) {
    return <p className="loading-text">Checking session...</p>;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Smart Bookmark Manager</h1>
        <p className="login-info">
          Login with Google to access your bookmarks securely.
        </p>
        <button className="login-button" onClick={handleGoogleLogin}>
          Login with Google
        </button>
      </div>
      <div className="background-shapes">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
