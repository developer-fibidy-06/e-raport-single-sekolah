// ============================================================
// FILE PATH: src/components/features/admin/import-siswa-sheet.tsx
// ============================================================
// REPLACE import-siswa-dialog.tsx. Migrasi Modal/Dialog → Sheet.
//
// CHANGELOG vs import-siswa-dialog.tsx:
//
//   1. Shell: Dialog modal centered max-w-3xl → Sheet WIDE TIER
//      (sm:max-w-2xl = 672px) di kanan desktop / bottom sheet
//      mobile. Konsisten dengan EnrollmentSheet pattern.
//
//   2. WIDE TIER (sm:max-w-2xl) — bukan default xl. Karena table
//      preview 6 kolom (#, Nama, NIS/NISN, Kelas, JK, Agama) butuh
//      lebih dari 576px biar gak ke-truncate banyak.
//
//   3. Header pattern konsisten: icon kotak primary/10 + label
//      uppercase + heading + subtitle. pr-12 untuk space tombol X
//      auto Sheet.
//
//   4. Footer sticky: tombol Batal + Import {N} Siswa. Body
//      scrollable berisi tahun aktif info, format guide, file
//      input zone, dan preview table.
//
//   5. RENAME export: ImportSiswaDialog → ImportSiswaSheet.
//      Signature props sama: { open, onOpenChange }.
//
//   6. PRESERVED:
//      - Semua hooks (useTahunPelajaranAktif, useAllKelas,
//        useBulkImportSiswa) + createClient untuk pre-fetch NISN
//      - CSV format 6 kolom (nama;nis;nisn;kelas;jk;agama)
//      - Manual CSV parser (no deps), delimiter auto-detect
//      - Pre-fetch existing NISN dari DB → validation offline
//      - Dupe check antar baris CSV + dupe check vs DB
//      - Agama normalization (case-insensitive, 6 agama)
//      - Preview table dengan error sub-row per baris invalid
//      - NIS/NISN gabung 1 kolom format "155 / 0000347149"
//      - Template download link
//
//   7. NOTE: tab-siswa.tsx perlu update import:
//      OLD: import { ImportSiswaDialog } from "./import-siswa-dialog";
//      NEW: import { ImportSiswaSheet } from "./import-siswa-sheet";
//      File `import-siswa-dialog.tsx` lama bisa dihapus setelah
//      tab-siswa.tsx selesai di-replace.
// ============================================================

"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  useTahunPelajaranAktif,
  useAllKelas,
  useBulkImportSiswa,
} from "@/hooks";
import { AGAMA_VALUES } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// CONSTANTS
// ============================================================

const TEMPLATE_URL = "/import/peserta-didik.csv";
const EXPECTED_COLUMNS = 6;

// ============================================================
// TYPES
// ============================================================

type AgamaCanonical = (typeof AGAMA_VALUES)[number];
type Delimiter = ";" | ",";

interface ParsedRow {
  rowNumber: number;
  nama_lengkap: string;
  nis: string;
  nisn: string;
  nama_kelas: string;
  jenis_kelamin: string;
  agama: string;
  isValid: boolean;
  errors: string[];
  rombongan_belajar_id?: number;
  jenis_kelamin_normalized?: "L" | "P";
  agama_normalized?: AgamaCanonical;
  nis_normalized?: string | null;
  nisn_normalized?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// ============================================================
// AGAMA NORMALIZATION
// ============================================================

const AGAMA_LOOKUP = new Map<string, AgamaCanonical>(
  AGAMA_VALUES.map((a) => [a.toLowerCase(), a])
);

function normalizeAgama(raw: string): AgamaCanonical | undefined {
  return AGAMA_LOOKUP.get(raw.trim().toLowerCase());
}

// ============================================================
// CSV PARSER — manual, no deps
// ============================================================

function detectDelimiter(line: string): Delimiter {
  const semi = (line.match(/;/g) || []).length;
  const comma = (line.match(/,/g) || []).length;
  if (semi === 0 && comma === 0) return ";";
  return semi >= comma ? ";" : ",";
}

function parseCsvLine(line: string, delimiter: Delimiter): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function isHeaderRow(cells: string[]): boolean {
  if (cells.length === 0) return false;
  const lower = cells.join("|").toLowerCase();
  return (
    lower.includes("nama") &&
    (lower.includes("kelas") ||
      lower.includes("jenis") ||
      lower.includes("agama") ||
      lower.includes("nis") ||
      lower.includes("nisn"))
  );
}

function normalizeNisNisn(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

// ============================================================
// MAIN SHEET — ImportSiswaSheet (replaces ImportSiswaDialog)
// ============================================================

export function ImportSiswaSheet({ open, onOpenChange }: Props) {
  const isDesktop = useIsDesktop();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [detectedDelimiter, setDetectedDelimiter] =
    useState<Delimiter | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);

  const { data: tahunAktif } = useTahunPelajaranAktif();
  const { data: kelasList = [] } = useAllKelas();
  const bulkImport = useBulkImportSiswa();

  const kelasMap = useMemo(() => {
    if (!tahunAktif)
      return new Map<string, { id: number; nama_kelas: string }>();
    const m = new Map<string, { id: number; nama_kelas: string }>();
    kelasList
      .filter((k) => k.tahun_pelajaran_id === tahunAktif.id)
      .forEach((k) => {
        const key = k.nama_kelas.toLowerCase().trim();
        if (!m.has(key)) m.set(key, { id: k.id, nama_kelas: k.nama_kelas });
      });
    return m;
  }, [kelasList, tahunAktif]);

  const validRows = useMemo(
    () => parsedRows.filter((r) => r.isValid),
    [parsedRows]
  );
  const invalidRows = useMemo(
    () => parsedRows.filter((r) => !r.isValid),
    [parsedRows]
  );

  const reset = () => {
    setParsedRows([]);
    setFileName("");
    setParseError(null);
    setDetectedDelimiter(null);
    setIsPrefetching(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const fetchExistingNisns = useCallback(async (): Promise<
    Map<string, string>
  > => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("peserta_didik")
      .select("nisn, nama_lengkap")
      .not("nisn", "is", null);
    if (error) throw error;

    const map = new Map<string, string>();
    (data ?? []).forEach((row) => {
      if (row.nisn) {
        map.set(row.nisn, row.nama_lengkap);
      }
    });
    return map;
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !file.name.toLowerCase().endsWith(".csv") &&
      file.type !== "text/csv" &&
      file.type !== "application/vnd.ms-excel"
    ) {
      setParseError("File harus berformat .csv");
      return;
    }

    setFileName(file.name);
    setParseError(null);
    setIsPrefetching(true);

    try {
      const text = await file.text();
      const existingNisns = await fetchExistingNisns();
      parseCsv(text, existingNisns);
    } catch (err) {
      const e = err as Error;
      setParseError("Gagal baca file: " + e.message);
    } finally {
      setIsPrefetching(false);
    }
  };

  const parseCsv = (text: string, existingNisns: Map<string, string>) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setParseError("File kosong");
      return;
    }

    const delimiter = detectDelimiter(lines[0]);
    setDetectedDelimiter(delimiter);

    let startIdx = 0;
    const firstCells = parseCsvLine(lines[0], delimiter);
    if (isHeaderRow(firstCells)) {
      startIdx = 1;
    }

    const dataLines = lines.slice(startIdx);

    if (dataLines.length === 0) {
      setParseError("Tidak ada baris data setelah header");
      return;
    }

    const tempRows: Array<{
      rowNumber: number;
      cells: string[];
    }> = dataLines.map((line, idx) => ({
      rowNumber: startIdx + idx + 1,
      cells: parseCsvLine(line, delimiter),
    }));

    const nisnTracker = new Map<
      string,
      { firstRowNumber: number; count: number }
    >();
    tempRows.forEach((r) => {
      const nisnRaw = (r.cells[2] ?? "").trim();
      if (nisnRaw.length > 0) {
        const existing = nisnTracker.get(nisnRaw);
        if (existing) {
          existing.count++;
        } else {
          nisnTracker.set(nisnRaw, { firstRowNumber: r.rowNumber, count: 1 });
        }
      }
    });

    const rows: ParsedRow[] = tempRows.map(({ rowNumber, cells }) => {
      const nama_lengkap = (cells[0] ?? "").trim();
      const nis = (cells[1] ?? "").trim();
      const nisn = (cells[2] ?? "").trim();
      const nama_kelas = (cells[3] ?? "").trim();
      const jenis_kelamin = (cells[4] ?? "").trim();
      const agama = (cells[5] ?? "").trim();

      const errors: string[] = [];

      if (cells.length < EXPECTED_COLUMNS) {
        errors.push(
          `Baris hanya punya ${cells.length} kolom, butuh ${EXPECTED_COLUMNS} kolom (nama, nis, nisn, kelas, jk, agama)`
        );
      }

      if (!nama_lengkap) {
        errors.push("Nama kosong");
      }

      const nisNormalized = normalizeNisNisn(nis);
      const nisnNormalized = normalizeNisNisn(nisn);

      if (nisnNormalized) {
        const tracker = nisnTracker.get(nisnNormalized);
        if (tracker && tracker.count > 1) {
          errors.push(
            `NISN "${nisnNormalized}" duplikat di CSV ini (pertama muncul di baris ${tracker.firstRowNumber})`
          );
        }

        const existingName = existingNisns.get(nisnNormalized);
        if (existingName) {
          errors.push(
            `NISN "${nisnNormalized}" sudah terdaftar untuk siswa "${existingName}"`
          );
        }
      }

      const jkUpper = jenis_kelamin.toUpperCase();
      let jkNormalized: "L" | "P" | undefined;
      if (jkUpper === "L" || jkUpper === "LAKI-LAKI" || jkUpper === "LAKI") {
        jkNormalized = "L";
      } else if (jkUpper === "P" || jkUpper === "PEREMPUAN") {
        jkNormalized = "P";
      } else if (jenis_kelamin) {
        errors.push(
          `Jenis kelamin "${jenis_kelamin}" tidak valid (harus L atau P)`
        );
      } else {
        errors.push("Jenis kelamin kosong");
      }

      let agamaNormalized: AgamaCanonical | undefined;
      if (!agama) {
        errors.push("Agama kosong");
      } else {
        agamaNormalized = normalizeAgama(agama);
        if (!agamaNormalized) {
          errors.push(
            `Agama "${agama}" tidak valid (harus salah satu dari: ${AGAMA_VALUES.join(", ")})`
          );
        }
      }

      const matchedKelas = kelasMap.get(nama_kelas.toLowerCase());
      if (!nama_kelas) {
        errors.push("Kelas kosong");
      } else if (!matchedKelas) {
        errors.push(`Kelas "${nama_kelas}" tidak ditemukan di tahun aktif`);
      }

      return {
        rowNumber,
        nama_lengkap,
        nis,
        nisn,
        nama_kelas,
        jenis_kelamin,
        agama,
        isValid: errors.length === 0,
        errors,
        rombongan_belajar_id: matchedKelas?.id,
        jenis_kelamin_normalized: jkNormalized,
        agama_normalized: agamaNormalized,
        nis_normalized: nisNormalized,
        nisn_normalized: nisnNormalized,
      };
    });

    setParsedRows(rows);
  };

  const handleSubmit = () => {
    if (validRows.length === 0 || !tahunAktif) return;

    const payload = validRows.map((r) => ({
      nama_lengkap: r.nama_lengkap,
      jenis_kelamin: r.jenis_kelamin_normalized!,
      agama: r.agama_normalized!,
      nis: r.nis_normalized ?? null,
      nisn: r.nisn_normalized ?? null,
      rombongan_belajar_id: r.rombongan_belajar_id!,
    }));

    bulkImport.mutate(
      {
        rows: payload,
        tahun_pelajaran_id: tahunAktif.id,
      },
      {
        onSuccess: () => {
          handleClose(false);
        },
      }
    );
  };

  const hasParsed = parsedRows.length > 0;
  const canImport = validRows.length > 0 && !bulkImport.isPending;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col gap-0",
          // WIDE TIER (2xl) — table preview butuh ekstra width
          isDesktop && "w-full sm:max-w-2xl",
          !isDesktop && "h-auto max-h-[92vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">Import Siswa dari CSV</SheetTitle>
        <SheetDescription className="sr-only">
          Bulk import siswa dan langsung enroll ke kelas di tahun pelajaran
          aktif via file CSV
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        {/* Header */}
        <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <Upload className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Bulk Import
            </p>
            <h3 className="text-base font-semibold leading-tight mt-0.5">
              Import Siswa dari CSV
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bulk import &amp; auto-enroll ke kelas di tahun aktif
            </p>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-4">
          {/* Tahun aktif info */}
          {!tahunAktif ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-medium">Belum ada tahun pelajaran aktif</p>
                <p className="mt-0.5">
                  Set tahun aktif dulu di menu{" "}
                  <strong>Master Data → Tahun &amp; Kelas</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-0.5">
              <p className="font-medium">Akan di-enroll ke tahun pelajaran:</p>
              <p className="text-muted-foreground">
                {tahunAktif.nama} · Semester {tahunAktif.semester} ·{" "}
                {kelasMap.size} kelas tersedia
              </p>
            </div>
          )}

          {/* Format guide + template */}
          <div className="rounded-lg border bg-blue-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-medium text-blue-900">
                Format CSV (6 kolom, delimiter <code>;</code>)
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs bg-white"
              >
                <a href={TEMPLATE_URL} download="peserta-didik.csv">
                  <Download className="h-3 w-3" />
                  Download Template
                </a>
              </Button>
            </div>
            <pre className="text-[11px] font-mono bg-white border rounded p-2 overflow-x-auto">
              {`nama_lengkap;nis;nisn;nama_kelas;jenis_kelamin;agama
Ahmad Fauzi;155;0000347149;Kelas 12A;L;Islam
Cindy Rahayu;156;0000347150;Kelas 12A;P;Kristen
Maria Theresa;202;0000347152;Kelas 11B;P;Katolik`}
            </pre>
            <ul className="text-[11px] text-blue-900 space-y-0.5 list-disc list-inside">
              <li>
                Delimiter: <strong>semicolon (;)</strong> direkomendasikan agar
                aman dari koma dalam nama/alamat. Comma (,) juga didukung
                (auto-detect).
              </li>
              <li>
                Header row optional (auto-skip kalau ada keyword
                &quot;nama&quot;/&quot;nis&quot;/&quot;nisn&quot;)
              </li>
              <li>
                <strong>NIS</strong>: opsional, format bebas (sekolah bisa
                pakai format sendiri)
              </li>
              <li>
                <strong>NISN</strong>: opsional, harus unik per siswa. Sistem
                auto-cek duplikat di CSV ini dan terhadap data existing.
              </li>
              <li>
                Jenis kelamin: <strong>L</strong> atau <strong>P</strong>{" "}
                (case-insensitive, juga terima &quot;Laki-laki&quot; /
                &quot;Perempuan&quot;)
              </li>
              <li>
                Agama: salah satu dari{" "}
                <strong>{AGAMA_VALUES.join(" / ")}</strong>{" "}
                (case-insensitive). Wajib diisi karena dipake filter mapel
                Pendidikan Agama.
              </li>
              <li>
                Nama kelas harus persis match dengan kelas di tahun aktif
                (case-insensitive)
              </li>
            </ul>
          </div>

          {/* File input */}
          <div className="space-y-2">
            <label
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
                "hover:bg-muted/40",
                hasParsed ? "border-primary/30 bg-primary/5" : "border-muted",
                isPrefetching && "pointer-events-none opacity-60"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={!tahunAktif || bulkImport.isPending || isPrefetching}
                className="sr-only"
              />
              {isPrefetching ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Memeriksa data NISN...</p>
                  <p className="text-xs text-muted-foreground">
                    Validasi duplikat dengan database
                  </p>
                </>
              ) : (
                <>
                  <FileText
                    className={cn(
                      "h-8 w-8",
                      hasParsed ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {fileName ? (
                    <>
                      <p className="text-sm font-medium">{fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {detectedDelimiter
                          ? `Delimiter terdeteksi: "${detectedDelimiter}" · `
                          : ""}
                        Klik untuk ganti file
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Pilih file CSV</p>
                      <p className="text-xs text-muted-foreground">
                        atau drag &amp; drop di sini
                      </p>
                    </>
                  )}
                </>
              )}
            </label>

            {parseError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{parseError}</p>
              </div>
            )}
          </div>

          {/* Preview — TABLE 6 kolom */}
          {hasParsed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Preview ({parsedRows.length} baris)
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {validRows.length} valid
                  </Badge>
                  {invalidRows.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-50 text-red-700 border-red-200 gap-1"
                    >
                      <X className="h-3 w-3" />
                      {invalidRows.length} error
                    </Badge>
                  )}
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/60 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead className="w-[150px]">NIS / NISN</TableHead>
                      <TableHead className="w-[140px]">Kelas</TableHead>
                      <TableHead className="w-14 text-center">JK</TableHead>
                      <TableHead className="hidden sm:table-cell w-24 text-center">
                        Agama
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row) => (
                      <PreviewRow key={row.rowNumber} row={row} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Footer — sticky */}
        <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleClose(false)}
            disabled={bulkImport.isPending}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!canImport}
            className="flex-1 gap-1.5"
          >
            {bulkImport.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {bulkImport.isPending
              ? "Mengimport…"
              : validRows.length > 0
                ? `Import ${validRows.length} Siswa`
                : "Import"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// Preview Row — table row dengan optional error sub-row
// NIS/NISN ditampilkan format "155 / 0000347149" (kayak rapor)
// Kolom Agama hidden di mobile (bottom sheet space tight)
// ============================================================

function PreviewRow({ row }: { row: ParsedRow }) {
  const rowBg = row.isValid ? "" : "bg-red-50/60 hover:bg-red-50/80";

  const nisDisplay = row.nis_normalized ?? "—";
  const nisnDisplay = row.nisn_normalized ?? "—";
  const showNisNisn = row.nis_normalized || row.nisn_normalized;
  const hasNisnError = row.errors.some((e) => e.toLowerCase().includes("nisn"));

  return (
    <>
      <TableRow className={cn(rowBg, "border-b-0")}>
        <TableCell className="text-center text-xs text-muted-foreground tabular-nums font-mono">
          {row.rowNumber}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 min-w-0">
            {row.isValid ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
            )}
            <span
              className={cn(
                "truncate",
                row.isValid ? "font-medium" : "text-muted-foreground"
              )}
            >
              {row.nama_lengkap || <em className="italic">(nama kosong)</em>}
            </span>
          </div>
          {/* Mobile: agama inline di bawah nama */}
          <div className="sm:hidden text-[10px] text-muted-foreground mt-0.5">
            {row.agama_normalized ? (
              <span>{row.agama_normalized}</span>
            ) : (
              <span className="text-red-600 italic">
                {row.agama || "(agama kosong)"}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm">
          {showNisNisn ? (
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                hasNisnError && "text-red-600"
              )}
              title={`NIS: ${nisDisplay} | NISN: ${nisnDisplay}`}
            >
              {nisDisplay} / {nisnDisplay}
            </span>
          ) : (
            <em className="italic text-muted-foreground text-xs">—</em>
          )}
        </TableCell>
        <TableCell className="text-sm">
          {row.nama_kelas || (
            <em className="italic text-muted-foreground">(kosong)</em>
          )}
        </TableCell>
        <TableCell className="text-center font-mono text-sm font-semibold">
          {row.jenis_kelamin_normalized ?? (
            <span className="text-red-600">{row.jenis_kelamin || "—"}</span>
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell text-center text-sm">
          {row.agama_normalized ? (
            <span className="font-medium">{row.agama_normalized}</span>
          ) : (
            <span className="text-red-600 italic">{row.agama || "—"}</span>
          )}
        </TableCell>
      </TableRow>
      {/* Error detail row */}
      {!row.isValid && row.errors.length > 0 && (
        <TableRow className={cn(rowBg, "hover:bg-red-50/80")}>
          <TableCell />
          <TableCell colSpan={5} className="pt-0 pb-2">
            <div className="space-y-0.5">
              {row.errors.map((err, i) => (
                <p
                  key={i}
                  className="text-[11px] text-red-700 flex items-start gap-1"
                >
                  <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  {err}
                </p>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
