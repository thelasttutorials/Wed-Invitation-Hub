import { useSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function PrivacyPage() {
  useSEO({
    title: "Kebijakan Privasi — WedSaas",
    description: "Baca kebijakan privasi WedSaas. Kami menjaga keamanan dan kerahasiaan data pribadi Anda.",
    noIndex: true,
  });

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
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-4" data-testid="text-title">Kebijakan Privasi</h1>
          <p className="text-slate-500">Terakhir diperbarui: 1 Maret 2024</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Informasi yang Kami Kumpulkan</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Kami mengumpulkan informasi yang Anda berikan langsung kepada kami saat Anda membuat akun, membuat undangan, atau menghubungi kami untuk bantuan. Ini termasuk:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Informasi Akun: Alamat email.</li>
                <li>Informasi Undangan: Nama mempelai, tanggal acara, lokasi, foto, dan cerita cinta.</li>
                <li>Data Tamu: Nama tamu yang Anda masukkan atau yang melakukan RSVP.</li>
                <li>Komunikasi: Pesan yang Anda kirimkan kepada kami.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Kami menggunakan informasi yang dikumpulkan untuk:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Menyediakan, memelihara, dan meningkatkan layanan kami.</li>
                <li>Memproses transaksi dan mengirimkan konfirmasi terkait.</li>
                <li>Menampilkan undangan digital Anda kepada tamu yang memiliki tautan.</li>
                <li>Mengirimkan pemberitahuan teknis, pembaruan, peringatan keamanan, dan pesan dukungan.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Berbagi Informasi</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Kami tidak menjual informasi pribadi Anda. Kami hanya membagikan informasi dalam situasi berikut:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Dengan persetujuan Anda (seperti saat Anda membagikan tautan undangan).</li>
                <li>Untuk mematuhi kewajiban hukum.</li>
                <li>Untuk melindungi hak dan keamanan WedSaas dan pengguna kami.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Keamanan Data</h2>
              <p className="text-slate-600 leading-relaxed">
                Kami mengambil langkah-langkah wajar untuk melindungi informasi pribadi Anda dari kehilangan, pencurian, penyalahgunaan, dan akses tidak sah. Namun, perlu diingat bahwa tidak ada metode transmisi internet atau penyimpanan elektronik yang 100% aman.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Hak Anda</h2>
              <p className="text-slate-600 leading-relaxed">
                Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda kapan saja melalui dashboard pengguna Anda atau dengan menghubungi kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Hubungi Kami</h2>
              <p className="text-slate-600 leading-relaxed">
                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui halaman Kontak.
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
