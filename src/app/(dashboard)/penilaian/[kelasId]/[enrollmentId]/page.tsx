// ============================================================
// FILE PATH: src/app/(dashboard)/penilaian/[kelasId]/[enrollmentId]/page.tsx
// ============================================================
// REPLACE. Perubahan dari versi sebelumnya:
//   - Tambah `agama?: string | null` di siswa type cast
//   - Extract siswaAgama dari peserta_didik
//   - Pass `siswaAgama` ke <NilaiForm>
//
// Sisa logic TIDAK BERUBAH — Header, Menubar, ProfileMenu, dialog
// confirm publish/unpublish, section switching via URL search param.
// ============================================================

"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEnrollmentById,
  useRaporHeader,
  useEnsureRaporHeader,
  usePublishRapor,
  useUnpublishRapor,
} from "@/hooks";
import { useAuthStore } from "@/stores";
import { NilaiForm } from "@/components/features/penilaian/nilai-form";
import { P5Form } from "@/components/features/penilaian/p5-form";
import { EkskulForm } from "@/components/features/penilaian/ekskul-form";
import { AbsensiCatatanForm } from "@/components/features/penilaian/absensi-catatan-form";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Medal,
  ClipboardList,
  Eye,
  Printer,
  CheckCircle2,
  Undo2,
  Loader2,
  User,
  Hash,
  GraduationCap,
  Calendar,
  Layers,
  Heart,
} from "lucide-react";
import { ROUTES } from "@/constants";
import type { Fase } from "@/types";
import { cn } from "@/lib/utils";

// ============================================================
// Section types
// ============================================================
type SectionKey = "nilai" | "p5" | "ekskul" | "absensi";

const SECTION_META: Record<
  SectionKey,
  { label: string; icon: typeof BookOpen }
> = {
  nilai: { label: "Nilai Mapel", icon: BookOpen },
  p5: { label: "Profil Pelajar", icon: Sparkles },
  ekskul: { label: "Ekstrakurikuler", icon: Medal },
  absensi: { label: "Absensi & Catatan", icon: ClipboardList },
};

const SECTION_ORDER: SectionKey[] = ["nilai", "p5", "ekskul", "absensi"];

function isValidSection(s: string | null): s is SectionKey {
  return s === "nilai" || s === "p5" || s === "ekskul" || s === "absensi";
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface Props {
  params: Promise<{ kelasId: string; enrollmentId: string }>;
}

export default function PenilaianSiswaPage({ params }: Props) {
  const { kelasId, enrollmentId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const { data: enrollment, isLoading } = useEnrollmentById(enrollmentId);
  const { data: header, isFetched: headerFetched } =
    useRaporHeader(enrollmentId);
  const ensureHeader = useEnsureRaporHeader();
  const publish = usePublishRapor();
  const unpublish = useUnpublishRapor();

  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  const sectionParam = searchParams.get("section");
  const section: SectionKey = isValidSection(sectionParam)
    ? sectionParam
    : "nilai";

  const setSection = (next: SectionKey) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (next === "nilai") {
      sp.delete("section");
    } else {
      sp.set("section", next);
    }
    const qs = sp.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  };

  // Auto-create draft rapor_header (one-shot)
  const ensuredRef = useRef(false);
  useEffect(() => {
    if (!headerFetched) return;
    if (header) return;
    if (ensuredRef.current) return;
    ensuredRef.current = true;
    ensureHeader.mutate(enrollmentId);
  }, [headerFetched, header, enrollmentId, ensureHeader]);

  // Type cast siswa — agama ditambah biar bisa di-pass ke NilaiForm + ProfileMenu
  const siswa = enrollment?.peserta_didik as {
    nama_lengkap: string;
    nisn?: string | null;
    nis?: string | null;
    jenis_kelamin: string;
    agama?: string | null;
  } | null;

  const kelas = enrollment?.rombongan_belajar as {
    nama_kelas: string;
    paket: string;
    fase: string;
    tahun_pelajaran: { nama: string; semester: number } | null;
  } | null;

  const gender: "L" | "P" = siswa?.jenis_kelamin === "P" ? "P" : "L";
  const siswaAgama: string | null = siswa?.agama ?? null;
  const isPublished = header?.status === "published";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-4">
      {/* ─── Header row: [Back] [Menubar] ─────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(ROUTES.PENILAIAN_KELAS(kelasId))}
          className="gap-1.5 px-2 h-9 flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        <Menubar className="rounded-lg border h-9">
          {/* FILE */}
          <FileMenu
            enrollmentId={enrollmentId}
            isAdmin={isAdmin}
            isPublished={isPublished}
            headerExists={!!header}
            publishPending={publish.isPending}
            unpublishPending={unpublish.isPending}
            onPublishClick={() => setConfirmPublish(true)}
            onUnpublishClick={() => setConfirmUnpublish(true)}
          />

          {/* EDIT */}
          <EditMenu activeSection={section} onSelectSection={setSection} />

          {/* PROFILE */}
          <ProfileMenu
            siswa={siswa}
            kelas={kelas}
            gender={gender}
            agama={siswaAgama}
          />
        </Menubar>
      </div>

      {/* ─── Section content (conditional render) ─────────── */}
      <div className="min-w-0">
        {section === "nilai" &&
          (kelas ? (
            <NilaiForm
              enrollmentId={enrollmentId}
              paket={kelas.paket}
              siswaAgama={siswaAgama}
            />
          ) : isLoading ? null : (
            <Fallback />
          ))}

        {section === "p5" &&
          (kelas && siswa ? (
            <P5Form
              enrollmentId={enrollmentId}
              fase={kelas.fase as Fase}
              namaSiswa={siswa.nama_lengkap}
            />
          ) : isLoading ? null : (
            <Fallback />
          ))}

        {section === "ekskul" && (
          <EkskulForm enrollmentId={enrollmentId} gender={gender} />
        )}

        {section === "absensi" &&
          (siswa ? (
            <AbsensiCatatanForm
              enrollmentId={enrollmentId}
              namaSiswa={siswa.nama_lengkap}
            />
          ) : isLoading ? null : (
            <Fallback />
          ))}
      </div>

      {/* ─── Confirm dialogs (publish/unpublish) ──────────── */}
      <ConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title="Publish Rapor?"
        description="Rapor akan ditandai final dan bisa dicetak resmi. Pastikan semua nilai dan Profil Pelajar sudah benar."
        confirmLabel="Ya, Publish"
        isLoading={publish.isPending}
        onConfirm={() =>
          publish.mutate(enrollmentId, {
            onSuccess: () => setConfirmPublish(false),
          })
        }
      />

      <ConfirmDialog
        open={confirmUnpublish}
        onOpenChange={setConfirmUnpublish}
        title="Kembalikan ke Draft?"
        description="Status rapor akan diubah jadi draft. Nilai masih bisa diedit lagi."
        confirmLabel="Ya, Kembalikan"
        variant="destructive"
        isLoading={unpublish.isPending}
        onConfirm={() =>
          unpublish.mutate(enrollmentId, {
            onSuccess: () => setConfirmUnpublish(false),
          })
        }
      />
    </div>
  );
}

function Fallback() {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      Data tidak ditemukan. Silakan kembali ke daftar siswa.
    </div>
  );
}

// ============================================================
// FILE MENU — Preview / Cetak / (admin) Publish
// ============================================================

function FileMenu({
  enrollmentId,
  isAdmin,
  isPublished,
  headerExists,
  publishPending,
  unpublishPending,
  onPublishClick,
  onUnpublishClick,
}: {
  enrollmentId: string;
  isAdmin: boolean;
  isPublished: boolean;
  headerExists: boolean;
  publishPending: boolean;
  unpublishPending: boolean;
  onPublishClick: () => void;
  onUnpublishClick: () => void;
}) {
  const router = useRouter();

  return (
    <MenubarMenu>
      <MenubarTrigger className="text-sm font-medium cursor-pointer">
        File
      </MenubarTrigger>
      <MenubarContent>
        <MenubarGroup>
          <MenubarItem
            onClick={() => router.push(ROUTES.RAPOR_DETAIL(enrollmentId))}
          >
            <Eye className="mr-2 h-3.5 w-3.5" />
            Preview Rapor
          </MenubarItem>
          <MenubarItem
            onClick={() => window.open(ROUTES.CETAK(enrollmentId), "_blank")}
          >
            <Printer className="mr-2 h-3.5 w-3.5" />
            Cetak (Tab Baru)
          </MenubarItem>
        </MenubarGroup>

        {isAdmin && (
          <>
            <MenubarSeparator />
            <MenubarGroup>
              {isPublished ? (
                <MenubarItem
                  onClick={onUnpublishClick}
                  disabled={unpublishPending}
                >
                  {unpublishPending ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Undo2 className="mr-2 h-3.5 w-3.5" />
                  )}
                  Kembalikan ke Draft
                </MenubarItem>
              ) : (
                <MenubarItem
                  onClick={onPublishClick}
                  disabled={publishPending || !headerExists}
                >
                  {publishPending ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  )}
                  Publish Rapor
                </MenubarItem>
              )}
            </MenubarGroup>
          </>
        )}
      </MenubarContent>
    </MenubarMenu>
  );
}

// ============================================================
// EDIT MENU — section switcher
// ============================================================

function EditMenu({
  activeSection,
  onSelectSection,
}: {
  activeSection: SectionKey;
  onSelectSection: (s: SectionKey) => void;
}) {
  return (
    <MenubarMenu>
      <MenubarTrigger className="text-sm font-medium cursor-pointer">
        Edit
      </MenubarTrigger>
      <MenubarContent>
        <MenubarGroup>
          {SECTION_ORDER.map((key) => {
            const meta = SECTION_META[key];
            const Icon = meta.icon;
            const isActive = activeSection === key;
            return (
              <MenubarItem
                key={key}
                onClick={() => onSelectSection(key)}
                className={cn(
                  isActive && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <Icon className="mr-2 h-3.5 w-3.5" />
                {meta.label}
                {isActive && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    aktif
                  </span>
                )}
              </MenubarItem>
            );
          })}
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}

// ============================================================
// PROFILE MENU — info display read-only
// ============================================================

function ProfileMenu({
  siswa,
  kelas,
  gender,
  agama,
}: {
  siswa: {
    nama_lengkap: string;
    nisn?: string | null;
    nis?: string | null;
  } | null;
  kelas: {
    nama_kelas: string;
    paket: string;
    fase: string;
    tahun_pelajaran: { nama: string; semester: number } | null;
  } | null;
  gender: "L" | "P";
  agama: string | null;
}) {
  return (
    <MenubarMenu>
      <MenubarTrigger className="text-sm font-medium cursor-pointer">
        Profile
      </MenubarTrigger>
      <MenubarContent className="min-w-[260px]">
        <MenubarGroup>
          <ProfileRow
            icon={User}
            label="Nama"
            value={siswa?.nama_lengkap ?? "—"}
          />
          <ProfileRow
            icon={Hash}
            label="NISN / NIS"
            value={`${siswa?.nisn ?? "—"} / ${siswa?.nis ?? "—"}`}
            mono
          />
          <ProfileRow
            icon={User}
            label="Jenis Kelamin"
            value={gender === "L" ? "Laki-laki" : "Perempuan"}
          />
          <ProfileRow
            icon={Heart}
            label="Agama"
            value={agama ?? "— (belum diisi)"}
            highlight={!agama}
          />
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <ProfileRow
            icon={GraduationCap}
            label="Kelas"
            value={kelas?.nama_kelas ?? "—"}
          />
          <ProfileRow icon={Layers} label="Paket" value={kelas?.paket ?? "—"} />
          <ProfileRow icon={Layers} label="Fase" value={kelas?.fase ?? "—"} />
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <ProfileRow
            icon={Calendar}
            label="Tahun Pelajaran"
            value={
              kelas?.tahun_pelajaran
                ? `${kelas.tahun_pelajaran.nama} · Sem ${kelas.tahun_pelajaran.semester}`
                : "—"
            }
          />
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
  mono,
  highlight,
}: {
  icon: typeof User;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 px-2 py-1.5">
      <Icon
        className={cn(
          "h-3.5 w-3.5 flex-shrink-0 mt-0.5",
          highlight ? "text-amber-700" : "text-muted-foreground"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "text-sm leading-tight truncate",
            mono && "font-mono",
            highlight && "text-amber-700 italic"
          )}
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}