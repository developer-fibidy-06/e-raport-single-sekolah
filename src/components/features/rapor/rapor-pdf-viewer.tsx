// ============================================================
// FILE PATH: src/components/features/rapor/rapor-pdf-viewer.tsx
// ============================================================
// REPLACE. v2.4 — handle error tanggal cetak per paket.
//
// Perubahan dari versi sebelumnya:
//
//   1. Detect error dari useRaporFullData yang start dengan
//      "Belum bisa cetak" → render UI ramah, BUKAN crash.
//
//   2. Pass `tanggalCetak` dari `data.tanggalCetak` ke
//      <RaporPDFDocument>. Tanpa field ini, PDF doc akan
//      throw (defense in depth — udah aman dari useRaporFullData).
//
//   3. Error UI shows: pesan jelas + link cepat ke admin panel
//      tab Tahun & Semester biar admin bisa langsung set tanggal.
//
//   4. Loading state tetap ada (PDF butuh waktu render).
//      Empty/null state untuk enrollment tidak ada (di-guard
//      sebelum komponen ini di-mount).
//
// Komponen ini di-import dengan ssr:false di parent (PDF butuh
// browser API). Caller pattern:
//
//   const PDFViewer = dynamic(
//     () => import('./rapor-pdf-viewer').then(m => m.RaporPDFViewer),
//     { ssr: false }
//   );
// ============================================================

"use client";

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import Link from "next/link";
import { AlertCircle, Loader2, Download, ExternalLink } from "lucide-react";

import { useRaporFullData } from "@/hooks";
import { RaporPDFDocument } from "./rapor-pdf-document";
import { buildP5Tree, buildPenilaianP5Map } from "@/lib/p5-tree";
import { Button } from "@/components/ui/button";

interface RaporPDFViewerProps {
  enrollmentId: string;
  /**
   * Mode tampilan:
   *   - "embed" : iframe PDF inline di halaman (default)
   *   - "download": cuma button download, no preview
   */
  mode?: "embed" | "download";
  /** Tinggi iframe untuk mode embed. Default 800px. */
  height?: number;
}

export function RaporPDFViewer({
  enrollmentId,
  mode = "embed",
  height = 800,
}: RaporPDFViewerProps) {
  const { data, isLoading, error } = useRaporFullData(enrollmentId);

  // ── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 p-8"
        style={{ minHeight: mode === "embed" ? height : 120 }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Memuat data rapor...
        </p>
      </div>
    );
  }

  // ── Error: tanggal cetak belum di-set ─────────────────────
  if (error instanceof Error && error.message.startsWith("Belum bisa cetak")) {
    return <TanggalKosongCard message={error.message} />;
  }

  // ── Error: lain (network, RLS, dll) ───────────────────────
  if (error) {
    return <GenericErrorCard message={(error as Error).message} />;
  }

  // ── Empty data (jarang, tapi guard) ───────────────────────
  if (!data) {
    return (
      <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Data rapor tidak ditemukan.
      </div>
    );
  }

  // ── Build PDF props ───────────────────────────────────────
  const p5Tree = buildP5Tree(
    data.p5Dimensi,
    data.p5Elemen,
    data.p5SubElemen
  );
  const penilaianP5Map = buildPenilaianP5Map(data.penilaianP5);

  const pdfProps = {
    enrollment: data.enrollment as never,
    sekolah: data.sekolah,
    nilaiList: data.nilaiList as never,
    p5Tree,
    penilaianP5Map,
    catatanP5: data.catatanP5,
    ekskulList: data.ekskulList,
    absensi: data.absensi,
    catatan: data.catatan,
    tanggalCetak: data.tanggalCetak, // v2.4: dijamin non-null
  };

  // Filename pattern: Rapor_NamaSiswa_Kelas_Semester_TP.pdf
  const pd = data.enrollment.peserta_didik;
  const rb = data.enrollment.rombongan_belajar as {
    tingkat: number;
    kelas_paralel: string;
    tahun_pelajaran?: { nama: string; semester: number } | null;
  } | null;
  const tp = rb?.tahun_pelajaran;
  const safeName = (pd?.nama_lengkap ?? "Siswa")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 40);
  const kelasLabel = rb
    ? `Kelas${rb.tingkat}${rb.kelas_paralel === "Tidak ada" ? "" : rb.kelas_paralel}`
    : "Kelas";
  const tpLabel = tp ? `${tp.nama.replace("/", "-")}_Smt${tp.semester}` : "";
  const fileName = `Rapor_${safeName}_${kelasLabel}_${tpLabel}.pdf`;

  // ── Mode: download only ───────────────────────────────────
  if (mode === "download") {
    return (
      <PDFDownloadLink
        document={<RaporPDFDocument {...pdfProps} />}
        fileName={fileName}
      >
        {({ loading }) => (
          <Button disabled={loading} size="sm">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {loading ? "Menyiapkan..." : "Download Rapor"}
          </Button>
        )}
      </PDFDownloadLink>
    );
  }

  // ── Mode: embed (default) ─────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <PDFDownloadLink
          document={<RaporPDFDocument {...pdfProps} />}
          fileName={fileName}
        >
          {({ loading }) => (
            <Button disabled={loading} size="sm" variant="outline">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
          )}
        </PDFDownloadLink>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <PDFViewer
          width="100%"
          height={height}
          showToolbar
          style={{ border: 0 }}
        >
          <RaporPDFDocument {...pdfProps} />
        </PDFViewer>
      </div>
    </div>
  );
}

// ============================================================
// ERROR CARDS
// ============================================================

function TanggalKosongCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-destructive">
              Belum bisa cetak rapor
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin?tab=tahun-kelas">
              Set tanggal sekarang
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function GenericErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <div>
          <h3 className="font-medium text-destructive">
            Gagal memuat rapor
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}