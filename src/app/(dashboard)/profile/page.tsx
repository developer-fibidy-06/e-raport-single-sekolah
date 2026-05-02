// ============================================================
// FILE PATH: src/app/(dashboard)/profile/page.tsx
// ============================================================
// REPLACE. Perubahan:
//   - HAPUS heading "Profil Saya" + subtitle
//   - Layout vertikal full-width (1 kolom), no grid
//     → lebar inherit dari `container mx-auto p-4 md:p-6` di dashboard
//       layout, jadi konsisten dengan halaman Penilaian & Rapor
//   - Hapus card "Edit Profile coming soon"
//   - Tambah Card terakhir: tombol Logout dengan confirm dialog
// ============================================================

"use client";

import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Mail, Shield, LogOut, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared";
import { getInitials } from "@/lib/utils";
import { ROUTES } from "@/constants";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push(ROUTES.LOGIN);
  };

  return (
    <div className="space-y-4">
      {/* Profile card — avatar + nama + role badge */}
      <Card>
        <CardContent className="flex flex-col items-center py-8 gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="font-bold text-lg">{user.full_name}</p>
            <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium mt-1">
              {user.role === "super_admin" ? "Super Admin" : "Pengguna"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Info akun — list vertikal full-width */}
      <Card>
        <CardContent className="space-y-3 py-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border flex-shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Nama Lengkap</p>
              <p className="text-sm font-medium truncate">{user.full_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border flex-shrink-0">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Peran</p>
              <p className="text-sm font-medium capitalize">
                {user.role === "super_admin" ? "Super Admin" : "Pengguna"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border flex-shrink-0">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Status Akun</p>
              <p className="text-sm font-medium">
                {user.is_active ? (
                  <span className="text-green-600">Aktif</span>
                ) : (
                  <span className="text-red-600">Nonaktif</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout button — Card terakhir */}
      <Card>
        <CardContent className="py-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-3 text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={() => setShowLogoutDialog(true)}
            disabled={isLoggingOut}
          >
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Keluar dari Akun</p>
              <p className="text-xs text-muted-foreground">
                Logout dari sesi saat ini
              </p>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Confirm dialog logout */}
      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Keluar dari Aplikasi"
        description="Apakah Anda yakin ingin keluar dari akun ini?"
        confirmLabel="Keluar"
        variant="destructive"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
      />
    </div>
  );
}