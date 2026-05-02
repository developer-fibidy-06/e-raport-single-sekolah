// ============================================================
// FILE PATH: src/types/database.ts
// ============================================================
// REPLACE. v2.4 — tambah tabel tanggal_cetak_paket.
//
// Perubahan dari versi sebelumnya:
//   - ADD table `tanggal_cetak_paket` (Row/Insert/Update +
//     Relationships ke tahun_pelajaran)
//   - KEEP semua schema lainnya (user_profiles, satuan_pendidikan,
//     tahun_pelajaran, dst) tanpa perubahan
//   - tahun_pelajaran.tanggal_cetak masih ada (deprecated tapi
//     belum di-drop dari DB — nanti tidak dipakai lagi di hook
//     useRaporFullData & PDF doc)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          role: string;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: string;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: string;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      satuan_pendidikan: {
        Row: {
          id: number;
          nama: string;
          npsn: string | null;
          alamat: string | null;
          kelurahan: string | null;
          kecamatan: string | null;
          kabupaten: string | null;
          provinsi: string | null;
          kode_pos: string | null;
          telepon: string | null;
          email: string | null;
          website: string | null;
          kota: string | null;
          kepala_pkbm: string | null;
          nip_kepala: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nama: string;
          npsn?: string | null;
          alamat?: string | null;
          kelurahan?: string | null;
          kecamatan?: string | null;
          kabupaten?: string | null;
          provinsi?: string | null;
          kode_pos?: string | null;
          telepon?: string | null;
          email?: string | null;
          website?: string | null;
          kota?: string | null;
          kepala_pkbm?: string | null;
          nip_kepala?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nama?: string;
          npsn?: string | null;
          alamat?: string | null;
          kelurahan?: string | null;
          kecamatan?: string | null;
          kabupaten?: string | null;
          provinsi?: string | null;
          kode_pos?: string | null;
          telepon?: string | null;
          email?: string | null;
          website?: string | null;
          kota?: string | null;
          kepala_pkbm?: string | null;
          nip_kepala?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      tahun_pelajaran: {
        Row: {
          id: number;
          nama: string;
          semester: number;
          is_aktif: boolean;
          tanggal_cetak: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nama: string;
          semester: number;
          is_aktif?: boolean;
          tanggal_cetak?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nama?: string;
          semester?: number;
          is_aktif?: boolean;
          tanggal_cetak?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      tanggal_cetak_paket: {
        Row: {
          id: number;
          tahun_pelajaran_id: number;
          paket: string;
          tanggal_cetak: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          tahun_pelajaran_id: number;
          paket: string;
          tanggal_cetak: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          tahun_pelajaran_id?: number;
          paket?: string;
          tanggal_cetak?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tanggal_cetak_paket_tahun_pelajaran_id_fkey";
            columns: ["tahun_pelajaran_id"];
            referencedRelation: "tahun_pelajaran";
            referencedColumns: ["id"];
          }
        ];
      };

      rombongan_belajar: {
        Row: {
          id: number;
          tahun_pelajaran_id: number;
          nama_kelas: string;
          tingkat: number;
          kelas_paralel: string;
          paket: string;
          fase: string;
          wali_kelas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          tahun_pelajaran_id: number;
          nama_kelas: string;
          tingkat: number;
          kelas_paralel?: string;
          paket: string;
          fase: string;
          wali_kelas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          tahun_pelajaran_id?: number;
          nama_kelas?: string;
          tingkat?: number;
          kelas_paralel?: string;
          paket?: string;
          fase?: string;
          wali_kelas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rombongan_belajar_tahun_pelajaran_id_fkey";
            columns: ["tahun_pelajaran_id"];
            referencedRelation: "tahun_pelajaran";
            referencedColumns: ["id"];
          }
        ];
      };

      peserta_didik: {
        Row: {
          id: string;
          nisn: string | null;
          nis: string | null;
          nama_lengkap: string;
          jenis_kelamin: string;
          tempat_lahir: string | null;
          tanggal_lahir: string | null;
          agama: string;
          alamat: string | null;
          rt: string | null;
          rw: string | null;
          kelurahan: string | null;
          kecamatan: string | null;
          kabupaten: string | null;
          provinsi: string | null;
          nama_ayah: string | null;
          nama_ibu: string | null;
          pekerjaan_ayah: string | null;
          pekerjaan_ibu: string | null;
          no_telp_ortu: string | null;
          is_aktif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nisn?: string | null;
          nis?: string | null;
          nama_lengkap: string;
          jenis_kelamin: string;
          tempat_lahir?: string | null;
          tanggal_lahir?: string | null;
          agama: string;
          alamat?: string | null;
          rt?: string | null;
          rw?: string | null;
          kelurahan?: string | null;
          kecamatan?: string | null;
          kabupaten?: string | null;
          provinsi?: string | null;
          nama_ayah?: string | null;
          nama_ibu?: string | null;
          pekerjaan_ayah?: string | null;
          pekerjaan_ibu?: string | null;
          no_telp_ortu?: string | null;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nisn?: string | null;
          nis?: string | null;
          nama_lengkap?: string;
          jenis_kelamin?: string;
          tempat_lahir?: string | null;
          tanggal_lahir?: string | null;
          agama?: string;
          alamat?: string | null;
          rt?: string | null;
          rw?: string | null;
          kelurahan?: string | null;
          kecamatan?: string | null;
          kabupaten?: string | null;
          provinsi?: string | null;
          nama_ayah?: string | null;
          nama_ibu?: string | null;
          pekerjaan_ayah?: string | null;
          pekerjaan_ibu?: string | null;
          no_telp_ortu?: string | null;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      enrollment: {
        Row: {
          id: string;
          peserta_didik_id: string;
          rombongan_belajar_id: number;
          tahun_pelajaran_id: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          peserta_didik_id: string;
          rombongan_belajar_id: number;
          tahun_pelajaran_id: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          peserta_didik_id?: string;
          rombongan_belajar_id?: number;
          tahun_pelajaran_id?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollment_peserta_didik_id_fkey";
            columns: ["peserta_didik_id"];
            referencedRelation: "peserta_didik";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollment_rombongan_belajar_id_fkey";
            columns: ["rombongan_belajar_id"];
            referencedRelation: "rombongan_belajar";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollment_tahun_pelajaran_id_fkey";
            columns: ["tahun_pelajaran_id"];
            referencedRelation: "tahun_pelajaran";
            referencedColumns: ["id"];
          }
        ];
      };

      mata_pelajaran: {
        Row: {
          id: number;
          nama: string;
          paket: string;
          fase: string | null;
          kelompok: string;
          agama: string | null;
          urutan: number;
          is_aktif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nama: string;
          paket: string;
          fase?: string | null;
          kelompok?: string;
          agama?: string | null;
          urutan?: number;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nama?: string;
          paket?: string;
          fase?: string | null;
          kelompok?: string;
          agama?: string | null;
          urutan?: number;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      predikat_global: {
        Row: {
          predikat: string;
          nilai_min: number;
          nilai_max: number;
        };
        Insert: {
          predikat: string;
          nilai_min: number;
          nilai_max: number;
        };
        Update: {
          predikat?: string;
          nilai_min?: number;
          nilai_max?: number;
        };
        Relationships: [];
      };

      kompetensi_dasar: {
        Row: {
          id: number;
          mata_pelajaran_id: number;
          nama_kompetensi: string;
          urutan: number;
          deskripsi_a: string;
          deskripsi_b: string;
          deskripsi_c: string;
          deskripsi_d: string;
          is_aktif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          mata_pelajaran_id: number;
          nama_kompetensi: string;
          urutan?: number;
          deskripsi_a?: string;
          deskripsi_b?: string;
          deskripsi_c?: string;
          deskripsi_d?: string;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          mata_pelajaran_id?: number;
          nama_kompetensi?: string;
          urutan?: number;
          deskripsi_a?: string;
          deskripsi_b?: string;
          deskripsi_c?: string;
          deskripsi_d?: string;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kompetensi_dasar_mata_pelajaran_id_fkey";
            columns: ["mata_pelajaran_id"];
            referencedRelation: "mata_pelajaran";
            referencedColumns: ["id"];
          }
        ];
      };

      nilai_mapel: {
        Row: {
          id: string;
          enrollment_id: string;
          mata_pelajaran_id: number;
          nilai_akhir: number | null;
          predikat: string | null;
          capaian_kompetensi: string | null;
          input_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          mata_pelajaran_id: number;
          nilai_akhir?: number | null;
          predikat?: string | null;
          capaian_kompetensi?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          mata_pelajaran_id?: number;
          nilai_akhir?: number | null;
          predikat?: string | null;
          capaian_kompetensi?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nilai_mapel_enrollment_id_fkey";
            columns: ["enrollment_id"];
            referencedRelation: "enrollment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "nilai_mapel_mata_pelajaran_id_fkey";
            columns: ["mata_pelajaran_id"];
            referencedRelation: "mata_pelajaran";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "nilai_mapel_input_by_fkey";
            columns: ["input_by"];
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      p5_dimensi: {
        Row: {
          id: number;
          nomor: number;
          nama: string;
          urutan: number;
          is_aktif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nomor: number;
          nama: string;
          urutan?: number;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nomor?: number;
          nama?: string;
          urutan?: number;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      p5_elemen: {
        Row: {
          id: number;
          dimensi_id: number;
          nama: string;
          urutan: number;
          is_aktif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          dimensi_id: number;
          nama: string;
          urutan?: number;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          dimensi_id?: number;
          nama?: string;
          urutan?: number;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "p5_elemen_dimensi_id_fkey";
            columns: ["dimensi_id"];
            referencedRelation: "p5_dimensi";
            referencedColumns: ["id"];
          }
        ];
      };

      p5_sub_elemen: {
        Row: {
          id: number;
          elemen_id: number;
          fase: string;
          deskripsi: string;
          urutan: number;
          is_aktif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          elemen_id: number;
          fase: string;
          deskripsi: string;
          urutan?: number;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          elemen_id?: number;
          fase?: string;
          deskripsi?: string;
          urutan?: number;
          is_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "p5_sub_elemen_elemen_id_fkey";
            columns: ["elemen_id"];
            referencedRelation: "p5_elemen";
            referencedColumns: ["id"];
          }
        ];
      };

      penilaian_p5: {
        Row: {
          id: string;
          enrollment_id: string;
          sub_elemen_id: number;
          predikat: string | null;
          input_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          sub_elemen_id: number;
          predikat?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          sub_elemen_id?: number;
          predikat?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "penilaian_p5_enrollment_id_fkey";
            columns: ["enrollment_id"];
            referencedRelation: "enrollment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "penilaian_p5_sub_elemen_id_fkey";
            columns: ["sub_elemen_id"];
            referencedRelation: "p5_sub_elemen";
            referencedColumns: ["id"];
          }
        ];
      };

      catatan_p5: {
        Row: {
          id: string;
          enrollment_id: string;
          catatan: string | null;
          input_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          catatan?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          catatan?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catatan_p5_enrollment_id_fkey";
            columns: ["enrollment_id"];
            referencedRelation: "enrollment";
            referencedColumns: ["id"];
          }
        ];
      };

      ekstrakurikuler: {
        Row: {
          id: string;
          enrollment_id: string;
          nama_ekskul: string;
          predikat: string | null;
          keterangan: string | null;
          input_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          nama_ekskul: string;
          predikat?: string | null;
          keterangan?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          nama_ekskul?: string;
          predikat?: string | null;
          keterangan?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ekstrakurikuler_enrollment_id_fkey";
            columns: ["enrollment_id"];
            referencedRelation: "enrollment";
            referencedColumns: ["id"];
          }
        ];
      };

      ekskul_preset: {
        Row: {
          id: number;
          nama_ekskul: string;
          gender: string;
          is_aktif: boolean;
          urutan: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nama_ekskul: string;
          gender: string;
          is_aktif?: boolean;
          urutan?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nama_ekskul?: string;
          gender?: string;
          is_aktif?: boolean;
          urutan?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ketidakhadiran: {
        Row: {
          id: string;
          enrollment_id: string;
          sakit: number;
          izin: number;
          alpha: number;
          input_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          sakit?: number;
          izin?: number;
          alpha?: number;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          sakit?: number;
          izin?: number;
          alpha?: number;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ketidakhadiran_enrollment_id_fkey";
            columns: ["enrollment_id"];
            referencedRelation: "enrollment";
            referencedColumns: ["id"];
          }
        ];
      };

      catatan_wali_kelas: {
        Row: {
          id: string;
          enrollment_id: string;
          catatan: string | null;
          tanggapan_ortu: string | null;
          input_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          catatan?: string | null;
          tanggapan_ortu?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          catatan?: string | null;
          tanggapan_ortu?: string | null;
          input_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catatan_wali_kelas_enrollment_id_fkey";
            columns: ["enrollment_id"];
            referencedRelation: "enrollment";
            referencedColumns: ["id"];
          }
        ];
      };

      rapor_header: {
        Row: {
          id: string;
          enrollment_id: string;
          status: string;
          published_at: string | null;
          published_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          status?: string;
          published_at?: string | null;
          published_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          status?: string;
          published_at?: string | null;
          published_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rapor_header_enrollment_id_fkey";
            columns: ["enrollment_id"];
            referencedRelation: "enrollment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rapor_header_published_by_fkey";
            columns: ["published_by"];
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      derive_predikat: {
        Args: { p_nilai: number };
        Returns: string;
      };
      get_capaian_kompetensi: {
        Args: { p_kd_id: number; p_nilai: number };
        Returns: string;
      };
      get_my_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      format_kelas_label: {
        Args: { p_tingkat: number; p_paralel: string };
        Returns: string;
      };
      format_semester_label: {
        Args: { p_semester: number };
        Returns: string;
      };
    };

    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];