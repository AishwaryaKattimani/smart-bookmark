import "./globals.css"; // Import Tailwind + your CSS
import "@fontsource/roboto"; // Import Roboto font

export const metadata = {
  title: "Smart Bookmark",
  description: "Your bookmark app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
