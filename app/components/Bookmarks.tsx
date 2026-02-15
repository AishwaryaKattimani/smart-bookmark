"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import "./bookmarks.css";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  created_at?: string;
}

export default function Bookmarks({ user }: { user: any }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { theme, setTheme } = useTheme();

  const categories = [
    "All",
    "Work",
    "Learning",
    "Entertainment",
    "Personal",
    "General",
  ];

  /* ==========================
     AUTO CATEGORY DETECTION
  ========================== */
  const autoAssignCategory = (title: string, url: string) => {
    const combined = (title + " " + url).toLowerCase();

    if (
      combined.includes("youtube") ||
      combined.includes("spotify") ||
      combined.includes("netflix") ||
      combined.includes("reddit")
    )
      return "Entertainment";

    if (
      combined.includes("linkedin") ||
      combined.includes("github") ||
      combined.includes("supabase") ||
      combined.includes("work")
    )
      return "Work";

    if (
      combined.includes("mdn") ||
      combined.includes("docs") ||
      combined.includes("wikipedia") ||
      combined.includes("course")
    )
      return "Learning";

    if (
      combined.includes("diary") ||
      combined.includes("notes") ||
      combined.includes("personal")
    )
      return "Personal";

    return "General";
  };

  /* ==========================
     URL VALIDATION
  ========================== */
  const validateAndFormatUrl = (input: string) => {
    let formatted = input.trim();
    if (!formatted) return null;

    if (!/^https?:\/\//i.test(formatted)) formatted = "https://" + formatted;

    try {
      const parsed = new URL(formatted);
      if (!parsed.hostname.includes(".")) return null;
      return parsed.href;
    } catch {
      return null;
    }
  };

  /* ==========================
     FETCH BOOKMARKS
  ========================== */
  const fetchBookmarks = async () => {
    if (!user) return;

    setLoading(true);

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setBookmarks(data);

    setLoading(false);
  };

  /* ==========================
     ADD BOOKMARK
  ========================== */
  const addBookmark = async () => {
    if (!user) return alert("User not loaded");

    if (title.trim().length < 3)
      return alert("Title must be at least 3 characters.");

    const formattedUrl = validateAndFormatUrl(url);
    if (!formattedUrl) return alert("Enter a valid URL.");

    const autoCategory = autoAssignCategory(title, formattedUrl);

    const { error } = await supabase.from("bookmarks").insert([
      {
        title: title.trim(),
        url: formattedUrl,
        category: autoCategory,
        user_id: user.id,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setUrl("");
    setCategory("General");
  };

  /* ==========================
     DELETE BOOKMARK
  ========================== */
  const deleteBookmark = async (id: string) => {
    await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  };

  /* ==========================
     LOGOUT
  ========================== */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  /* ==========================
     REAL-TIME SUBSCRIPTION
  ========================== */
  useEffect(() => {
    if (!user) return;

    fetchBookmarks();

    const channel = supabase
      .channel("realtime-bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBookmarks();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  /* ==========================
     FILTERING
  ========================== */
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.url.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ? true : b.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [bookmarks, search, selectedCategory]);

  /* ==========================
     UI
  ========================== */
  return (
    <div className="wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <h3>Categories</h3>
        {categories.map((cat) => (
          <button
            key={cat}
            className={selectedCategory === cat ? "active" : ""}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </aside>

      {/* Main */}
      <div className="main">
        <div className="header">
          <h2>Your Bookmarks</h2>
          <div>
            <button
              className="btn btn-primary"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              Toggle Theme
            </button>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Add Form */}
        <div className="form-row">
          <input
            placeholder="Bookmark Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button className="btn btn-primary" onClick={addBookmark}>
            Add
          </button>
        </div>

        {/* Search */}
        <input
          placeholder="Search bookmarks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: "20px" }}
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid">
            {filteredBookmarks.map((b) => (
              <div key={b.id} className="card">
                <div>
                  <a href={b.url} target="_blank">
                    {b.title}
                  </a>
                  <div className={`category-tag ${b.category}`}>
                    {b.category}
                  </div>
                </div>
                <div style={{ marginTop: "10px" }}>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteBookmark(b.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
