// ============================================================
// FILE PATH: src/components/features/admin/import-siswa-dialog.tsx
// ============================================================
// REPLACE. Perubahan dari versi sebelumnya:
//
//   1. CSV FORMAT — sekarang 6 kolom (sebelumnya 4):
//      nama_lengkap;nis;nisn;nama_kelas;jenis_kelamin;agama
//
//      Urutan ini dipilih karena match sama format rapor
//      "Nomor Induk/NISN : 155/0000347149" — admin yang isi CSV
//      bakal lebih natural ngetiknya.
//
//   2. NIS — optional, no format validation, no unique check
//      (sekolah bebas format, bisa duplikat)
//
//   3. NISN — optional, tapi kalau diisi:
//      a) Trim whitespace, kalau kosong jadi null
//      b) Cek duplikat ANTAR BARIS di CSV yang sama (tolak)
//      c) Cek duplikat vs DB existing (tolak — pre-fetch sekali
//         saat parsing untuk UX yang ramah)
//      d) Format permissive: terima angka/string apa adanya selama
//         bukan whitespace doang. Sekolah-sekolah punya format NISN
//         beda-beda di lapangan, jangan strict.
//
//   4. PRE-FETCH EXISTING NISN — saat file di-upload, fetch sekali
//      semua NISN existing di DB. Validation jalan offline setelah
//      itu, error muncul di preview SEBELUM admin klik Import.
//      Race condition kecil (concurrent admin) di-handle di hook
//      useBulkImportSiswa via UNIQUE constraint DB.
//
//   5. PREVIEW TABLE — gabung NIS/NISN jadi 1 kolom dengan format
//      "155 / 0000347149" (kayak di rapor). Lebih hemat space,
//      lebih natural buat admin yang udah familiar sama format
//      rapor PKBM.
//
//   6. ERROR MESSAGES — informatif, sebut baris mana yang konflik:
//      "NISN sudah dipakai siswa lain di CSV ini (baris 5)"
//      "NISN sudah terdaftar untuk siswa Ahmad Fauzi"
//
//   7. BACKWARD COMPAT — TIDAK support format lama 4 kolom.
//      Kalau admin upload format lama, error message jelas:
//      "Format CSV tidak valid. Butuh 6 kolom..."
//      Force admin download template baru biar konsisten.
//
//   8. HEADER DETECTION — tambah keyword "nis"/"nisn" di check.
//
// Validation order (per row):
//   1. nama_lengkap (required)
//   2. nis (optional, trim only)
//   3. nisn (optional, trim + dupe check antar baris + dupe check DB)
//   4. nama_kelas (required, match dengan kelas di tahun aktif)
//   5. jenis_kelamin (required, L/P)
//   6. agama (required, harus salah satu dari 6 agama)
// ============================================================

"use client";

import { useState, useRef, useMemo, useCallback } from "react";
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

// Normalize NIS/NISN: trim, kalau kosong/whitespace doang → null
function normalizeNisNisn(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
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

  // ──────────────────────────────────────────────────────────
  // Pre-fetch existing NISN dari DB sekali, untuk validation
  // offline yang fast & ramah ke UX. Race condition kecil
  // (concurrent admin) di-handle di hook via UNIQUE constraint.
  // ──────────────────────────────────────────────────────────
  const fetchExistingNisns = useCallback(async (): Promise<Map<string, string>> => {
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
      // Pre-fetch existing NISN sebelum parse, biar bisa validate
      // duplicate check vs DB
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

    // ─── PASS 1: Parse semua baris dulu ─────────────────────
    const tempRows: Array<{
      rowNumber: number;
      cells: string[];
    }> = dataLines.map((line, idx) => ({
      rowNumber: startIdx + idx + 1,
      cells: parseCsvLine(line, delimiter),
    }));

    // ─── Build NISN tracker untuk dupe check antar baris ───
    // key: nisn, value: { firstRowNumber, count }
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

    // ─── PASS 2: Validate setiap baris ──────────────────────
    const rows: ParsedRow[] = tempRows.map(({ rowNumber, cells }) => {
      // 6 kolom: nama_lengkap, nis, nisn, nama_kelas, jenis_kelamin, agama
      const nama_lengkap = (cells[0] ?? "").trim();
      const nis = (cells[1] ?? "").trim();
      const nisn = (cells[2] ?? "").trim();
      const nama_kelas = (cells[3] ?? "").trim();
      const jenis_kelamin = (cells[4] ?? "").trim();
      const agama = (cells[5] ?? "").trim();

      const errors: string[] = [];

      // ─── Validasi jumlah kolom ───────────────────────
      if (cells.length < EXPECTED_COLUMNS) {
        errors.push(
          `Baris hanya punya ${cells.length} kolom, butuh ${EXPECTED_COLUMNS} kolom (nama, nis, nisn, kelas, jk, agama)`
        );
      }

      // ─── Validasi nama ───────────────────────────────
      if (!nama_lengkap) {
        errors.push("Nama kosong");
      }

      // ─── Validasi NIS ────────────────────────────────
      // NIS optional, no format check, no unique check
      const nisNormalized = normalizeNisNisn(nis);

      // ─── Validasi NISN ───────────────────────────────
      // NISN optional, tapi kalau diisi: cek dupe antar baris + cek dupe DB
      const nisnNormalized = normalizeNisNisn(nisn);
      if (nisnNormalized) {
        // Dupe check antar baris di CSV ini
        const tracker = nisnTracker.get(nisnNormalized);
        if (tracker && tracker.count > 1) {
          errors.push(
            `NISN "${nisnNormalized}" duplikat di CSV ini (pertama muncul di baris ${tracker.firstRowNumber})`
          );
        }

        // Dupe check vs DB existing
        const existingName = existingNisns.get(nisnNormalized);
        if (existingName) {
          errors.push(
            `NISN "${nisnNormalized}" sudah terdaftar untuk siswa "${existingName}"`
          );
        }
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

          {/* Preview — TABLE 6 kolom (NIS/NISN gabung jadi 1 kolom) */}
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
// NIS/NISN ditampilkan format "155 / 0000347149" (kayak rapor)
// ============================================================

function PreviewRow({ row }: { row: ParsedRow }) {
  const rowBg = row.isValid ? "" : "bg-red-50/60 hover:bg-red-50/80";

  // Format NIS/NISN: "155 / 0000347149"
  // Kalau NIS kosong: "— / 0000347149"
  // Kalau NISN kosong: "155 / —"
  // Kalau kedua kosong: "—"
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