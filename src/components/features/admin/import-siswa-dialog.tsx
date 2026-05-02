// ============================================================
// FILE PATH: src/components/features/admin/import-siswa-dialog.tsx
// ============================================================
// REPLACE. Perubahan dari versi sebelumnya:
//
//   1. DELIMITER AUTO-DETECT — sekarang support semicolon (;)
//      ATAU comma (,) sebagai pemisah kolom. Auto-detect dari
//      header row (atau first non-empty line kalau no header).
//      Rekomendasi pakai semicolon karena nama/alamat Indonesia
//      sering punya koma (ex: "Ahmad, S.Pd" atau "Jl. X, RT 09")
//      yang bikin parser comma kacau tanpa quote escape.
//
//   2. TEMPLATE DOWNLOAD via static file — sekarang tarik dari
//      `/import/peserta-didik.csv` (di-serve Next.js dari folder
//      `public/import/`). Admin bisa edit file template langsung
//      tanpa rebuild app, dan template jadi single source of truth.
//      Implementasi: simple anchor click, gak perlu construct Blob
//      di JS lagi.
//
//   3. Format guide block: contoh pakai semicolon (sync dengan
//      template), tambah bullet jelasin delimiter rule.
//
// Sisa logic (validasi agama, kelas matching, rollback on error,
// preview table) TIDAK BERUBAH dari versi sebelumnya.
// ============================================================

"use client";

import { useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useTahunPelajaranAktif,
  useAllKelas,
  useBulkImportSiswa,
} from "@/hooks";
import { AGAMA_VALUES } from "@/lib/validators";
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

// ============================================================
// TYPES
// ============================================================

type AgamaCanonical = (typeof AGAMA_VALUES)[number];
type Delimiter = ";" | ",";

interface ParsedRow {
  rowNumber: number;
  nama_lengkap: string;
  nama_kelas: string;
  jenis_kelamin: string;
  agama: string;
  isValid: boolean;
  errors: string[];
  rombongan_belajar_id?: number;
  jenis_kelamin_normalized?: "L" | "P";
  agama_normalized?: AgamaCanonical;
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
//
// Delimiter detection: count semicolon vs comma di line, pick
// yang lebih banyak. Default ke ";" kalau tie atau zero (artinya
// 1 kolom doang — file gak valid format-nya, tapi parser tetap
// jalan biar error-nya muncul di validasi field-by-field).
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
      lower.includes("agama"))
  );
}

// ============================================================
// MAIN DIALOG
// ============================================================

export function ImportSiswaDialog({ open, onOpenChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [detectedDelimiter, setDetectedDelimiter] =
    useState<Delimiter | null>(null);

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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

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

    try {
      const text = await file.text();
      parseCsv(text);
    } catch (err) {
      const e = err as Error;
      setParseError("Gagal baca file: " + e.message);
    }
  };

  const parseCsv = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setParseError("File kosong");
      return;
    }

    // ─── Detect delimiter dari first line ───────────────
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

    const rows: ParsedRow[] = dataLines.map((line, idx) => {
      const rowNumber = startIdx + idx + 1;
      const cells = parseCsvLine(line, delimiter);

      const nama_lengkap = (cells[0] ?? "").trim();
      const nama_kelas = (cells[1] ?? "").trim();
      const jenis_kelamin = (cells[2] ?? "").trim();
      const agama = (cells[3] ?? "").trim();

      const errors: string[] = [];

      // ─── Validasi nama ───────────────────────────────
      if (!nama_lengkap) {
        errors.push("Nama kosong");
      }

      // ─── Validasi jenis kelamin ──────────────────────
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

      // ─── Validasi agama ──────────────────────────────
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

      // ─── Validasi kelas ──────────────────────────────
      const matchedKelas = kelasMap.get(nama_kelas.toLowerCase());
      if (!nama_kelas) {
        errors.push("Kelas kosong");
      } else if (!matchedKelas) {
        errors.push(`Kelas "${nama_kelas}" tidak ditemukan di tahun aktif`);
      }

      return {
        rowNumber,
        nama_lengkap,
        nama_kelas,
        jenis_kelamin,
        agama,
        isValid: errors.length === 0,
        errors,
        rombongan_belajar_id: matchedKelas?.id,
        jenis_kelamin_normalized: jkNormalized,
        agama_normalized: agamaNormalized,
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Import Siswa dari CSV
          </DialogTitle>
          <DialogDescription>
            Bulk import siswa &amp; langsung enroll ke kelas di tahun pelajaran
            aktif.
          </DialogDescription>
        </DialogHeader>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
                Format CSV (4 kolom, delimiter <code>;</code>)
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
              {`nama_lengkap;nama_kelas;jenis_kelamin;agama
Ahmad Fauzi;Kelas 12A;L;Islam
Cindy Rahayu;Kelas 12A;P;Kristen
Maria Theresa;Kelas 11B;P;Katolik`}
            </pre>
            <ul className="text-[11px] text-blue-900 space-y-0.5 list-disc list-inside">
              <li>
                Delimiter: <strong>semicolon (;)</strong> direkomendasikan agar
                aman dari koma dalam nama/alamat. Comma (,) juga didukung
                (auto-detect).
              </li>
              <li>
                Header row optional (auto-skip kalau ada keyword
                &quot;nama&quot;)
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
                hasParsed ? "border-primary/30 bg-primary/5" : "border-muted"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={!tahunAktif || bulkImport.isPending}
                className="sr-only"
              />
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
            </label>

            {parseError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{parseError}</p>
              </div>
            )}
          </div>

          {/* Preview — TABLE 5 kolom dengan header + border */}
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
                      <TableHead className="w-[140px]">Kelas</TableHead>
                      <TableHead className="w-14 text-center">JK</TableHead>
                      <TableHead className="w-24 text-center">Agama</TableHead>
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

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={bulkImport.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canImport}
            className="gap-1.5"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Preview Row — table row dengan optional error sub-row
// ============================================================

function PreviewRow({ row }: { row: ParsedRow }) {
  const rowBg = row.isValid ? "" : "bg-red-50/60 hover:bg-red-50/80";

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
        <TableCell className="text-center text-sm">
          {row.agama_normalized ? (
            <span className="font-medium">{row.agama_normalized}</span>
          ) : (
            <span className="text-red-600 italic">
              {row.agama || "—"}
            </span>
          )}
        </TableCell>
      </TableRow>
      {/* Error detail row — render kalau ada error */}
      {!row.isValid && row.errors.length > 0 && (
        <TableRow className={cn(rowBg, "hover:bg-red-50/80")}>
          <TableCell />
          <TableCell colSpan={4} className="pt-0 pb-2">
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