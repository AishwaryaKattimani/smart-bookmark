"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import "./bookmarks.css";

const categories = [
  "All",
  "Work",
  "Learning",
  "Entertainment",
  "Personal",
  "General",
];

export default function BookmarksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  // 🔹 Auto Category Detection
  const detectCategory = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.includes("linkedin") ||
      lowerUrl.includes("github") ||
      lowerUrl.includes("drive.google")
    )
      return "Work";
    if (
      lowerUrl.includes("react") ||
      lowerUrl.includes("nextjs") ||
      lowerUrl.includes("developer.mozilla") ||
      lowerUrl.includes("supabase")
    )
      return "Learning";
    if (
      lowerUrl.includes("youtube") ||
      lowerUrl.includes("spotify") ||
      lowerUrl.includes("netflix")
    )
      return "Entertainment";
    if (lowerUrl.includes("amazon") || lowerUrl.includes("twitter"))
      return "Personal";
    return "General";
  };

  // 🔹 Step 1: Keep user logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        fetchBookmarks(session.user.id);
        subscribeToRealtime(session.user.id);
      }
      setLoadingUser(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/login");
        } else {
          setUser(session.user);
          fetchBookmarks(session.user.id);
          subscribeToRealtime(session.user.id);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, [router]);

  // 🔹 Step 2: Filter bookmarks by category and search
  useEffect(() => {
    let result = bookmarks;
    if (activeCategory !== "All") {
      result = result.filter((b) => b.category === activeCategory);
    }
    if (search.trim() !== "") {
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.url.toLowerCase().includes(search.toLowerCase()),
      );
    }
    setFiltered(result);
  }, [bookmarks, activeCategory, search]);

  // 🔹 Step 3: Fetch bookmarks (private per user)
  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setBookmarks(data || []);
  };

  // 🔹 Step 4: Subscribe to realtime changes (per user)
  const subscribeToRealtime = (userId: string) => {
    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => [payload.new, ...prev]);
          }
          if (payload.eventType === "UPDATE") {
            setBookmarks((prev) =>
              prev.map((b) => (b.id === payload.new.id ? payload.new : b)),
            );
          }
          if (payload.eventType === "DELETE") {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // 🔹 Step 5: Add bookmark with duplicate check
  const addBookmark = async () => {
    if (!title.trim() || !url.trim() || !user) {
      alert("Fill all fields");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    // 🔹 Check duplicates
    const { data: existing, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .or(`title.eq.${trimmedTitle},url.eq.${trimmedUrl}`)
      .limit(1);

    if (error) {
      console.error("Error checking duplicates:", error);
      return;
    }

    if (existing && existing.length > 0) {
      alert("Bookmark with this Title or URL already exists!");
      return;
    }

    const autoCategory = detectCategory(trimmedUrl);

    // 🔹 Optimistic UI update
    const { data: inserted, error: insertError } = await supabase
      .from("bookmarks")
      .insert([
        {
          title: trimmedTitle,
          url: trimmedUrl,
          category: autoCategory,
          user_id: user.id,
        },
      ])
      .select();

    if (insertError) {
      alert("Failed to add bookmark.");
      console.error(insertError);
      return;
    }

    if (inserted && inserted.length > 0) {
      setBookmarks((prev) => [inserted[0], ...prev]);
    }

    setTitle("");
    setUrl("");
  };

  // 🔹 Step 6: Delete bookmark (instant removal)
  const deleteBookmark = async (id: string) => {
    // Optimistically remove from UI
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) {
      alert("Failed to delete bookmark.");
      console.error(error);
      // Re-fetch bookmarks in case of failure
      fetchBookmarks(user.id);
    }
  };

  // 🔹 Step 7: Edit bookmark
  const editBookmark = async (id: string) => {
    const newTitle = prompt("New title:");
    const newUrl = prompt("New URL:");
    if (!newTitle || !newUrl) return;

    const newCategory = detectCategory(newUrl);

    // 🔹 Check duplicates
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .or(`title.eq.${newTitle},url.eq.${newUrl}`)
      .neq("id", id)
      .limit(1);

    if (existing && existing.length > 0) {
      alert("Bookmark with this Title or URL already exists!");
      return;
    }

    await supabase
      .from("bookmarks")
      .update({ title: newTitle, url: newUrl, category: newCategory })
      .eq("id", id);

    // Optimistic update
    setBookmarks((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, title: newTitle, url: newUrl, category: newCategory }
          : b,
      ),
    );
  };

  // 🔹 Step 8: Logout
  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // 🔹 Step 9: Handle loading & session
  if (loadingUser)
    return <p style={{ padding: "2rem" }}>Loading user session...</p>;
  if (!user) return <p style={{ padding: "2rem" }}>Redirecting to login...</p>;

  // 🔹 Step 10: Render bookmarks UI
  return (
    <div className="page">
      <div className="container">
        {/* Top Bar */}
        <div className="topBar">
          <h2>Smart Bookmark Manager</h2>
          <button className="logoutBtn" onClick={logout}>
            Logout
          </button>
        </div>

        {/* Add Bookmark */}
        <div className="addBox">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={addBookmark}>Add</button>
        </div>

        {/* Search Box */}
        <input
          type="text"
          className="searchBox"
          placeholder="Search bookmarks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Categories */}
        <div className="categories">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? "activeCat" : ""}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bookmark List */}
        <div className="bookmarkList">
          {filtered.length === 0 ? (
            <p>No bookmarks found.</p>
          ) : (
            filtered.map((bm) => (
              <div key={bm.id} className="bookmarkCard">
                <div>
                  <h3>{bm.title}</h3>
                  <a href={bm.url} target="_blank" rel="noreferrer">
                    {bm.url}
                  </a>
                  <div className="categoryTag">{bm.category}</div>
                </div>

                <div className="actions">
                  <button onClick={() => editBookmark(bm.id)}>Edit</button>
                  <button onClick={() => deleteBookmark(bm.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
