import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .limit(1);
    if (error) throw error;

    return NextResponse.json({ success: true, sample: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
