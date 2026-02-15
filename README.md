## 🐛 Problems Faced & How I Solved Them

1. **Google OAuth redirect failing on mobile:**  
   - **Problem:** Signing in on a phone initially showed “site can’t be reached”.  
   - **Solution:** Added the exact Vercel deployment URL in **Supabase Redirect URLs** and redeployed the app.

2. **Bookmarks not appearing after insertion:**  
   - **Problem:** API returned `{"data":[]}` even after inserting bookmarks.  
   - **Solution:** Fixed **Row-Level Security (RLS)** policies in Supabase to allow authenticated reads/writes.

3. **Instant bookmark updates without refresh:**  
   - **Problem:** Deleting a bookmark did not update the UI immediately.  
   - **Solution:** Used **React state updates** to remove bookmarks from UI instantly.

4. **Environment variables not loading on deployment:**  
   - **Problem:** Supabase keys were not working on Vercel.  
   - **Solution:** Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Environment Variables and redeployed.
