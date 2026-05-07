// ============================================================
// FILE PATH: src/components/features/admin/tab-users.tsx
// ============================================================
// REPLACE. v3.0 — migrasi vaul Drawer + Dialog → shadcn Sheet.
//
// CHANGELOG vs versi sebelumnya:
//
//   1. UserDetailDrawer (vaul Drawer) → UserDetailSheet
//      Migrate primitive vaul ke shadcn Sheet. Visual sama (side
//      panel desktop / bottom sheet mobile), tapi pakai 1 primitive
//      yang konsisten dengan sisa codebase. Pattern viewer di-
//      pertahankan karena info detail (last login, role, audit)
//      genuinely useful sebelum admin klik Edit.
//
//   2. AddUserDialog → AddUserSheet (no parent, dari toolbar)
//   3. EditUserDialog → EditUserSheet (bisa standalone dari kebab,
//      atau child dari UserDetailSheet)
//   4. ResetPasswordDialog → ResetPasswordSheet (sama pattern)
//
//   5. STACKING:
//      Row tap → UserDetailSheet (parent viewer)
//        ├── Edit dari footer/kebab → EditUserSheet
//        └── Reset PW dari footer/kebab → ResetPasswordSheet
//      Toolbar [Tambah User] → AddUserSheet (no parent)
//      Width: semua sm:max-w-xl (default tier — form simple).
//
//   6. PRESERVED:
//      - Semua hooks, stats counter compact, search filter
//      - Table 5 kolom dengan inline Switch toggle (state, bukan
//        action — gak dipindah ke kebab)
//      - Kebab menu: Edit / Reset Password / sep / Hapus
//      - Self-prevention guards (can't demote/disable/delete diri
//        sendiri)
//      - Confirm delete (AlertDialog) — modal untuk delete OK
//      - Access denied screen untuk non-super_admin
//      - Show/hide password toggle
//
//   7. REMOVED: import { Drawer } from "vaul" — gak dipake lagi.
// ============================================================

"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/stores";
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useToggleUserActive,
  useResetUserPassword,
  useDeleteUser,
  type AdminUser,
} from "@/hooks";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  userCreateSchema,
  userUpdateSchema,
  userResetPasswordSchema,
  typedResolver,
  type UserCreateFormData,
  type UserUpdateFormData,
  type UserResetPasswordFormData,
} from "@/lib/validators";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Key,
  ShieldCheck,
  User as UserIcon,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  CalendarPlus,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// MAIN
// ============================================================

export function TabUsers() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [resetPwUser, setResetPwUser] = useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [drawerUser, setDrawerUser] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading, error } = useAdminUsers();
  const toggleActive = useToggleUserActive();
  const deleteUser = useDeleteUser();

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const total = users.length;
    const aktif = users.filter((u) => u.is_active).length;
    const superAdmins = users.filter(
      (u) => u.role === "super_admin" && u.is_active
    ).length;
    return { total, aktif, superAdmins };
  }, [users]);

  if (!isAdmin) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Akses ditolak</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hanya Super Admin yang dapat mengelola pengguna.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <StatLine label="Total User" value={stats.total} />
          <StatLine
            label="Aktif"
            value={stats.aktif}
            colorClass="text-green-700"
          />
          <StatLine
            label="Super Admin"
            value={stats.superAdmins}
            colorClass="text-purple-700"
          />
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Gagal memuat daftar user</p>
              <p className="text-xs text-muted-foreground mt-0.5 break-all">
                {(error as Error).message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pastikan{" "}
                <code className="text-foreground">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>{" "}
                sudah di-set di{" "}
                <code className="text-foreground">.env.local</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {search
            ? "Tidak ditemukan."
            : "Belum ada user. Tambahkan dengan tombol di atas."}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-3 text-xs">User</TableHead>
                <TableHead className="px-2 text-xs">Nama</TableHead>
                <TableHead className="hidden md:table-cell w-44 px-2 text-xs">
                  Login Terakhir
                </TableHead>
                <TableHead className="w-16 px-2 text-xs text-center">
                  Aktif
                </TableHead>
                <TableHead className="w-12 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <UserTableRow
                  key={u.id}
                  user={u}
                  isSelf={currentUser?.id === u.id}
                  toggling={toggleActive.isPending}
                  onToggleActive={() => toggleActive.mutate(u)}
                  onOpenDrawer={() => setDrawerUser(u)}
                  onEdit={() => setEditUser(u)}
                  onResetPw={() => setResetPwUser(u)}
                  onDelete={() => setConfirmDelete(u)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheets */}
      <AddUserSheet open={showAdd} onOpenChange={setShowAdd} />
      <EditUserSheet user={editUser} onClose={() => setEditUser(null)} />
      <ResetPasswordSheet
        user={resetPwUser}
        onClose={() => setResetPwUser(null)}
      />
      <UserDetailSheet
        user={drawerUser}
        onClose={() => setDrawerUser(null)}
        onEdit={(u) => setEditUser(u)}
        onResetPw={(u) => setResetPwUser(u)}
      />

      {confirmDelete && (
        <AlertDialog
          open
          onOpenChange={(v) => !v && setConfirmDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Hapus user {confirmDelete.full_name}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Aksi ini permanen dan tidak bisa di-undo. Kalau user ini masih
                punya data (input nilai, rapor publish), delete akan gagal —
                gunakan tombol Nonaktifkan saja.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteUser.mutate(confirmDelete.id, {
                    onSuccess: () => setConfirmDelete(null),
                  });
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// ============================================================
// StatLine
// ============================================================

function StatLine({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-24">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          colorClass ?? "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// UserTableRow
// ============================================================

function UserTableRow({
  user,
  isSelf,
  toggling,
  onToggleActive,
  onOpenDrawer,
  onEdit,
  onResetPw,
  onDelete,
}: {
  user: AdminUser;
  isSelf: boolean;
  toggling: boolean;
  onToggleActive: () => void;
  onOpenDrawer: () => void;
  onEdit: () => void;
  onResetPw: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow
      onClick={onOpenDrawer}
      className={cn("cursor-pointer", !user.is_active && "opacity-60")}
    >
      <TableCell className="w-12 px-3 py-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            user.role === "super_admin" ? "bg-purple-100" : "bg-primary/10"
          )}
        >
          {user.role === "super_admin" ? (
            <ShieldCheck className="h-4 w-4 text-purple-700" />
          ) : (
            <UserIcon className="h-4 w-4 text-primary" />
          )}
        </div>
      </TableCell>
      <TableCell className="px-2 py-2.5 max-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-sm font-medium truncate"
              title={user.full_name}
            >
              {user.full_name}
            </span>
            {isSelf && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0"
              >
                Anda
              </Badge>
            )}
            {user.role === "super_admin" && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1 bg-purple-50 text-purple-700 border-purple-200 flex-shrink-0"
              >
                Super Admin
              </Badge>
            )}
            {!user.has_profile && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1 bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0"
              >
                Tanpa profil
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {user.email ?? "(no email)"}
          </p>
          {user.last_sign_in_at && (
            <p className="md:hidden text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5 flex-shrink-0" />
              {formatDateTime(user.last_sign_in_at)}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell w-44 px-2 py-2.5">
        {user.last_sign_in_at ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5 flex-shrink-0" />
            {formatDateTime(user.last_sign_in_at)}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Belum login
          </span>
        )}
      </TableCell>
      <TableCell className="w-16 px-2 py-2.5 text-center">
        <div
          className="inline-flex"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={user.is_active}
            onCheckedChange={onToggleActive}
            disabled={isSelf || toggling}
            title={
              isSelf
                ? "Tidak dapat menonaktifkan akun sendiri"
                : user.is_active
                  ? "Nonaktifkan"
                  : "Aktifkan"
            }
          />
        </div>
      </TableCell>
      <TableCell className="w-12 px-2 py-2.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Aksi untuk ${user.full_name}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onResetPw();
              }}
            >
              <Key className="mr-2 h-3.5 w-3.5" />
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isSelf}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Hapus User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// UserDetailSheet — PARENT VIEWER
// ============================================================

function UserDetailSheet({
  user,
  onClose,
  onEdit,
  onResetPw,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onEdit: (u: AdminUser) => void;
  onResetPw: (u: AdminUser) => void;
}) {
  const isDesktop = useIsDesktop();
  const open = user !== null;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col gap-0",
          isDesktop && "w-full sm:max-w-xl",
          !isDesktop && "h-auto max-h-[88vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">
          Detail User — {user?.full_name ?? ""}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Detail informasi pengguna sistem E-Raport beserta tombol aksi
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        {user && (
          <UserDetailBody
            user={user}
            onClose={onClose}
            onEdit={() => onEdit(user)}
            onResetPw={() => onResetPw(user)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function UserDetailBody({
  user,
  onClose,
  onEdit,
  onResetPw,
}: {
  user: AdminUser;
  onClose: () => void;
  onEdit: () => void;
  onResetPw: () => void;
}) {
  return (
    <>
      <div className="flex items-start gap-3 border-b px-4 py-4 sm:px-5 pr-12">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
            user.role === "super_admin" ? "bg-purple-100" : "bg-primary/10"
          )}
        >
          {user.role === "super_admin" ? (
            <ShieldCheck className="h-6 w-6 text-purple-700" />
          ) : (
            <UserIcon className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-tight truncate">
            {user.full_name}
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {user.email ?? "(no email)"}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            {user.role === "super_admin" && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 bg-purple-50 text-purple-700 border-purple-200"
              >
                Super Admin
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-4 px-1.5",
                user.is_active
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {user.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
            {!user.has_profile && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 bg-amber-50 text-amber-700 border-amber-200"
              >
                Tanpa profil
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-3">
        <InfoRow icon={Mail} label="Email" value={user.email ?? "—"} />
        <InfoRow icon={Phone} label="Telepon" value={user.phone ?? "—"} />
        <InfoRow
          icon={Clock}
          label="Login Terakhir"
          value={
            user.last_sign_in_at
              ? formatDateTime(user.last_sign_in_at)
              : "Belum pernah login"
          }
        />
        <InfoRow
          icon={CalendarPlus}
          label="Akun Dibuat"
          value={formatDateTime(user.created_at)}
        />
      </div>

      <div className="border-t bg-background px-4 py-3 sm:px-5 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="flex-1 min-w-[80px]"
        >
          Tutup
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetPw}
          className="flex-1 min-w-[120px] gap-1.5"
        >
          <Key className="h-3.5 w-3.5" />
          Reset Password
        </Button>
        <Button
          size="sm"
          onClick={onEdit}
          className="flex-1 min-w-[80px] gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </p>
        <p className="text-sm break-words">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// AddUserSheet
// ============================================================

function AddUserSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const create = useCreateUser();
  const [showPw, setShowPw] = useState(false);

  const form = useForm<UserCreateFormData>({
    resolver: typedResolver(userCreateSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: "user",
      phone: "",
    },
  });

  const onSubmit = (values: UserCreateFormData) => {
    create.mutate(values, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col gap-0",
          isDesktop && "w-full sm:max-w-xl",
          !isDesktop && "h-auto max-h-[92vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">Tambah Pengguna</SheetTitle>
        <SheetDescription className="sr-only">
          Form untuk membuat akun pengguna baru di sistem E-Raport
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col min-h-0"
          >
            <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Tambah Pengguna
                </p>
                <h3 className="text-base font-semibold leading-tight mt-0.5">
                  Akun Baru
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Akun langsung aktif. Share password ke user manual.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-3">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nama Lengkap <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@pkbm.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password Awal{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="Min. 6 karakter"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPw ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="super_admin">
                            Super Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telepon</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Opsional"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={create.isPending}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={create.isPending}
                className="flex-1 gap-1.5"
              >
                {create.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Tambah
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// EditUserSheet
// ============================================================

function EditUserSheet({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const isDesktop = useIsDesktop();
  const update = useUpdateUser();
  const currentUser = useAuthStore((s) => s.user);
  const isSelf = currentUser?.id === user?.id;
  const open = user !== null;

  const form = useForm<UserUpdateFormData>({
    resolver: typedResolver(userUpdateSchema),
    values: user
      ? {
          full_name: user.full_name,
          role: user.role as "super_admin" | "user",
          phone: user.phone ?? "",
          is_active: user.is_active,
        }
      : undefined,
  });

  const onSubmit = (values: UserUpdateFormData) => {
    if (!user) return;
    update.mutate(
      { id: user.id, values },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col gap-0",
          isDesktop && "w-full sm:max-w-xl",
          !isDesktop && "h-auto max-h-[92vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">
          Edit User — {user?.full_name ?? ""}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Form untuk mengedit profil user (nama, role, phone, status aktif)
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        {user && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-1 flex-col min-h-0"
            >
              <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Pencil className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Edit User
                  </p>
                  <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                    {user.full_name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Email <span className="font-mono">{user.email}</span> tidak
                    dapat diubah
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-3">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Lengkap{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSelf}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="super_admin">
                              Super Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {isSelf && (
                          <p className="text-[10px] text-muted-foreground">
                            Tidak dapat ubah role sendiri
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telepon</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between rounded-md border px-3 py-2">
                        <FormLabel className="cursor-pointer">
                          Akun Aktif
                          {isSelf && (
                            <span className="block text-[10px] text-muted-foreground">
                              Tidak dapat nonaktifkan akun sendiri
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSelf}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={update.isPending}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={update.isPending}
                  className="flex-1 gap-1.5"
                >
                  {update.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Simpan
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// ResetPasswordSheet
// ============================================================

function ResetPasswordSheet({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const isDesktop = useIsDesktop();
  const reset = useResetUserPassword();
  const [showPw, setShowPw] = useState(false);
  const open = user !== null;

  const form = useForm<UserResetPasswordFormData>({
    resolver: typedResolver(userResetPasswordSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = (values: UserResetPasswordFormData) => {
    if (!user) return;
    reset.mutate(
      { id: user.id, values },
      {
        onSuccess: () => {
          onClose();
          form.reset();
        },
      }
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col gap-0",
          isDesktop && "w-full sm:max-w-xl",
          !isDesktop && "h-auto max-h-[92vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">
          Reset Password — {user?.full_name ?? ""}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Form untuk reset password user. Share password baru ke user secara
          manual.
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        {user && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-1 flex-col min-h-0"
            >
              <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Key className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Reset Password
                  </p>
                  <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                    {user.full_name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set password baru. Share ke user secara manual.
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-3">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password Baru{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPw ? "text" : "password"}
                            placeholder="Min. 6 karakter"
                            className="pr-10"
                            autoFocus
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showPw ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border bg-amber-50/60 border-amber-200 p-3 text-xs text-amber-900">
                  💡 Setelah reset, share password baru ke user secara manual
                  (misal via WhatsApp). Sistem tidak mengirim notifikasi
                  otomatis.
                </div>
              </div>

              <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={reset.isPending}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={reset.isPending}
                  className="flex-1 gap-1.5"
                >
                  {reset.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Reset Password
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
