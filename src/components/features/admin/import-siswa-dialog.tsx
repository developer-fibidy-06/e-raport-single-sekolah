// ============================================================
// FILE PATH: src/components/features/admin/import-siswa-dialog.tsx
// ============================================================
// REPLACE. Perubahan tunggal: preview list → TABLE 3 kolom dengan
// header + border. Layout sekarang:
//
//   ┌────┬─────────────────┬──────────────┬────────┐
//   │ #  │ Nama Lengkap    │ Kelas        │  JK    │
//   ├────┼─────────────────┼──────────────┼────────┤
//   │ 1  │ Ahmad Fauzi  ✓  │ Kelas 12A    │   L    │
//   │ 2  │ Budi (kosong)✗  │ Kelas 99     │   X    │
//   │    │ ! Kelas tidak ditemukan                  │ ← error row
//   └────┴─────────────────┴──────────────┴────────┘
//
//   Status icon (✓/✗) di-attach ke nama (kolom 2) biar table tetap
//   rapi 3 kolom data utama. Error message render di row ke-2 bawah
//   row utama (colSpan=4) buat kasih konteks lengkap.
//
// Pakai shadcn <Table /> komponen (tabel dengan border bawaan).
// Semua logic parsing & validation TIDAK BERUBAH dari versi sebelumnya.
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
import { useTahunPelajaranAktif, useAllKelas, useBulkImportSiswa } from "@/hooks";
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
// TYPES
// ============================================================

interface ParsedRow {
  rowNumber: number; // 1-indexed dari file
  nama_lengkap: string;
  nama_kelas: string;
  jenis_kelamin: string;
  isValid: boolean;
  errors: string[];
  rombongan_belajar_id?: number;
  jenis_kelamin_normalized?: "L" | "P";
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// ============================================================
// CSV PARSER — manual, no deps
// ============================================================

function parseCsvLine(line: string): string[] {
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
    } else if (char === "," && !inQuotes) {
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
  const lower = cells.join(",").toLowerCase();
  return (
    lower.includes("nama") &&
    (lower.includes("kelas") || lower.includes("jenis"))
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

  const { data: tahunAktif } = useTahunPelajaranAktif();
  const { data: kelasList = [] } = useAllKelas();
  const bulkImport = useBulkImportSiswa();

  const kelasMap = useMemo(() => {
    if (!tahunAktif) return new Map<string, { id: number; nama_kelas: string }>();
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

    let startIdx = 0;
    const firstCells = parseCsvLine(lines[0]);
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
      const cells = parseCsvLine(line);

      const nama_lengkap = (cells[0] ?? "").trim();
      const nama_kelas = (cells[1] ?? "").trim();
      const jenis_kelamin = (cells[2] ?? "").trim();

      const errors: string[] = [];

      if (!nama_lengkap) {
        errors.push("Nama kosong");
      }

      const jkUpper = jenis_kelamin.toUpperCase();
      let jkNormalized: "L" | "P" | undefined;
      if (jkUpper === "L" || jkUpper === "LAKI-LAKI" || jkUpper === "LAKI") {
        jkNormalized = "L";
      } else if (jkUpper === "P" || jkUpper === "PEREMPUAN") {
        jkNormalized = "P";
      } else {
        errors.push(`Jenis kelamin "${jenis_kelamin}" tidak valid (harus L atau P)`);
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
        nama_kelas,
        jenis_kelamin,
        isValid: errors.length === 0,
        errors,
        rombongan_belajar_id: matchedKelas?.id,
        jenis_kelamin_normalized: jkNormalized,
      };
    });

    setParsedRows(rows);
  };

  const handleSubmit = () => {
    if (validRows.length === 0 || !tahunAktif) return;

    const payload = validRows.map((r) => ({
      nama_lengkap: r.nama_lengkap,
      jenis_kelamin: r.jenis_kelamin_normalized!,
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

  const downloadTemplate = () => {
    const csv =
      "nama_lengkap,nama_kelas,jenis_kelamin\n" +
      "Ahmad Fauzi,Kelas 12A,L\n" +
      "Cindy Rahayu,Kelas 12A,P\n" +
      "Budi Santoso,Kelas 11B,L\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-import-siswa.csv";
    a.click();
    URL.revokeObjectURL(url);
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
            Bulk import siswa & langsung enroll ke kelas di tahun pelajaran aktif.
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
                  <strong>Master Data → Tahun & Kelas</strong>.
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
                Format CSV (3 kolom)
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadTemplate}
                className="h-7 gap-1.5 text-xs bg-white"
              >
                <Download className="h-3 w-3" />
                Download Template
              </Button>
            </div>
            <pre className="text-[11px] font-mono bg-white border rounded p-2 overflow-x-auto">
              {`nama_lengkap,nama_kelas,jenis_kelamin
Ahmad Fauzi,Kelas 12A,L
Cindy Rahayu,Kelas 12A,P`}
            </pre>
            <ul className="text-[11px] text-blue-900 space-y-0.5 list-disc list-inside">
              <li>Header row optional (auto-skip kalau ada keyword &quot;nama&quot;)</li>
              <li>Jenis kelamin: L atau P</li>
              <li>Nama kelas harus persis match dengan kelas di tahun aktif</li>
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
                    Klik untuk ganti file
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Pilih file CSV</p>
                  <p className="text-xs text-muted-foreground">
                    atau drag & drop di sini
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

          {/* Preview — TABLE 3 kolom dengan header + border */}
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
                      <TableHead className="w-[180px]">Kelas</TableHead>
                      <TableHead className="w-20 text-center">JK</TableHead>
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
  const rowBg = row.isValid
    ? ""
    : "bg-red-50/60 hover:bg-red-50/80";

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
              {row.nama_lengkap || (
                <em className="italic">(nama kosong)</em>
              )}
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
      </TableRow>
      {/* Error detail row — render kalau ada error */}
      {!row.isValid && row.errors.length > 0 && (
        <TableRow className={cn(rowBg, "hover:bg-red-50/80")}>
          <TableCell />
          <TableCell colSpan={3} className="pt-0 pb-2">
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