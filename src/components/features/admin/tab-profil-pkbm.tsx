"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { satuanPendidikanSchema, typedResolver, type SatuanPendidikanFormData } from "@/lib/validators";
import { useSatuanPendidikan, useUpsertSatuanPendidikan } from "@/hooks";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function TabProfilPkbm() {
  const { data, isLoading } = useSatuanPendidikan();
  const upsert = useUpsertSatuanPendidikan();

  const form = useForm<SatuanPendidikanFormData>({
    resolver: typedResolver(satuanPendidikanSchema),
    defaultValues: {
      nama: "", npsn: "", alamat: "", kelurahan: "", kecamatan: "",
      kabupaten: "", provinsi: "", kode_pos: "", telepon: "",
      email: "", website: "", kepala_pkbm: "", nip_kepala: "",
    },
  });

  // FIX: DB row punya `null`, form expects `undefined`. Cast aman karena form handle keduanya.
  useEffect(() => {
    if (data) form.reset(data as unknown as SatuanPendidikanFormData);
  }, [data, form]);

  const onSubmit = (values: SatuanPendidikanFormData) => {
    upsert.mutate({ ...values, id: data?.id });
  };

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Memuat...</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identitas Lembaga</CardTitle>
            <CardDescription>Data utama PKBM yang tampil di rapor</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="nama" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nama PKBM <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="PKBM Yayasan Al Barakah" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="npsn" render={({ field }) => (
              <FormItem>
                <FormLabel>NPSN</FormLabel>
                <FormControl><Input placeholder="12345678" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="kepala_pkbm" render={({ field }) => (
              <FormItem>
                <FormLabel>Kepala PKBM</FormLabel>
                <FormControl><Input placeholder="Nama kepala PKBM" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nip_kepala" render={({ field }) => (
              <FormItem>
                <FormLabel>NIP Kepala</FormLabel>
                <FormControl><Input placeholder="NIP (opsional)" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alamat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="alamat" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Alamat</FormLabel>
                <FormControl><Input placeholder="Jl. ..." {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {(["kelurahan","kecamatan","kabupaten","provinsi","kode_pos"] as const).map((name) => (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">{name.replace("_"," ")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontak</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(["telepon","email","website"] as const).map((name) => (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">{name}</FormLabel>
                  <FormControl><Input type={name === "email" ? "email" : "text"} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={upsert.isPending}>
            {upsert.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Profil
          </Button>
        </div>
      </form>
    </Form>
  );
}
