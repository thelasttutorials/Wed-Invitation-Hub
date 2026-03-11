import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <a href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">WedSaas</span>
          </a>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-4" data-testid="text-title">Syarat & Ketentuan</h1>
          <p className="text-slate-500">Terakhir diperbarui: 1 Maret 2024</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Penerimaan Ketentuan</h2>
              <p className="text-slate-600 leading-relaxed">
                Dengan mengakses dan menggunakan layanan WedSaas, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari ketentuan ini, Anda tidak diperbolehkan menggunakan layanan kami.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Penggunaan Layanan</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Anda setuju untuk menggunakan layanan kami hanya untuk tujuan yang sah dan sesuai dengan ketentuan ini. Anda bertanggung jawab penuh atas:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Semua konten yang Anda unggah ke undangan digital Anda.</li>
                <li>Menjaga kerahasiaan tautan akses dashboard Anda.</li>
                <li>Memastikan data yang Anda masukkan adalah akurat dan tidak melanggar hak pihak ketiga.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Pembayaran dan Langganan</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Beberapa fitur kami memerlukan pembayaran. Ketentuan pembayaran adalah sebagai berikut:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Harga tercantum dalam Rupiah dan dapat berubah sewaktu-waktu.</li>
                <li>Pembayaran bersifat final dan tidak dapat dikembalikan (non-refundable) kecuali diwajibkan oleh hukum.</li>
                <li>Layanan akan diaktifkan setelah konfirmasi pembayaran diterima.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Hak Kekayaan Intelektual</h2>
              <p className="text-slate-600 leading-relaxed">
                WedSaas memiliki semua hak, judul, dan kepentingan dalam layanan, termasuk desain, kode, dan merek dagang. Anda tetap memiliki hak cipta atas konten (seperti foto dan teks) yang Anda unggah ke layanan kami.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Batasan Tanggung Jawab</h2>
              <p className="text-slate-600 leading-relaxed">
                WedSaas tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan kami. Kami tidak menjamin bahwa layanan akan selalu tersedia tanpa gangguan.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Perubahan Ketentuan</h2>
              <p className="text-slate-600 leading-relaxed">
                Kami berhak mengubah Syarat dan Ketentuan ini kapan saja. Kami akan memberitahu pengguna tentang perubahan materi dengan memposting ketentuan baru di halaman ini.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Hukum yang Berlaku</h2>
              <p className="text-slate-600 leading-relaxed">
                Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <a href="/">
            <Button variant="outline" data-testid="link-back-home">Kembali ke Beranda</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
