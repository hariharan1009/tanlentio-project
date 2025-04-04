import './globals.css';
export const metadata = {
  title: 'DreamTrails - Explore the World',
  description: 'Best travel packages for unforgettable journeys.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
