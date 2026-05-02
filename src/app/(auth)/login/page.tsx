import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - E-Raport PKBM",
  description: "Masuk ke Sistem E-Raport PKBM Yayasan Al Barakah",
};

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/profile");
  }

  return <LoginForm />;
}