import "./globals.css";

export const metadata = {
  title: "Custody",
  description: "Proving digital evidence has not been changed",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <div className="wrap">
            <h1><a href="/" style={{ color: "inherit", textDecoration: "none" }}>Custody</a></h1>
            <span className="tag">Proving digital evidence has not been changed</span>
            <nav><span className="tag">All data synthetic</span></nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
