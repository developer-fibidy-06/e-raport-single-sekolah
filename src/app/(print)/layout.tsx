/**
 * Print Layout — clean, tanpa sidebar, header, atau mobile nav.
 * QueryProvider sudah tersedia dari root layout.
 * Halaman di sini diakses via /cetak/[enrollmentId].
 */
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
