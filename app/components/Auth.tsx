"use client";

import { supabase } from "@/lib/supabase";

export default function Auth() {
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Login error:", error.message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-20">
      <h2 className="text-2xl font-bold">Login</h2>
      <button
        onClick={signInWithGoogle}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
}
