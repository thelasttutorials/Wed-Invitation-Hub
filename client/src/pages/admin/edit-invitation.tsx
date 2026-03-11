import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Plus, Trash2, ArrowLeft, Save, Eye } from "lucide-react";
import type { Invitation, LoveStoryItem } from "@shared/schema";

interface InvitationData {
  invitation: Invitation;
  loveStory: LoveStoryItem[];
}

interface LoveStoryDraft {
  dateLabel: string;
  title: string;
  description: string;
  photoUrl: string;
}

const emptyStoryItem: LoveStoryDraft = { dateLabel: "", title: "", description: "", photoUrl: "" };

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-3 border-b border-gray-100 mb-4">
      <Heart className="w-4 h-4 text-rose-400" />
      <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{children}</h3>
    </div>
  );
}

export default function AdminEditInvitation() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<InvitationData>({
    queryKey: ["/api/invitations/by-id", id],
    queryFn: () => fetch(`/api/invitations/id/${id}`).then(r => r.json()),
    enabled: !!id,
  });

  const [form, setForm] = useState({
    groomName: "",
    brideName: "",
    slug: "",
    groomParents: "",
    brideParents: "",
    akadDate: "",
    receptionDate: "",
    akadTime: "",
    receptionTime: "",
    venueName: "",
    venueAddress: "",
    mapsUrl: "",
    openingQuote: "",
    coverPhotoUrl: "",
    musicUrl: "",
    videoUrl: "",
    galleryPhotos: "",
    additionalNotes: "",
    isPublished: true,
  });

  const [loveStory, setLoveStory] = useState<LoveStoryDraft[]>([{ ...emptyStoryItem }]);

  useEffect(() => {
    if (!data?.invitation) return;
    const inv = data.invitation;
    setForm({
      groomName: inv.groomName,
      brideName: inv.brideName,
      slug: inv.slug,
      groomParents: inv.groomParents,
      brideParents: inv.brideParents,
      akadDate: inv.akadDate ?? "",
      receptionDate: inv.receptionDate ?? "",
      akadTime: inv.akadTime,
      receptionTime: inv.receptionTime,
      venueName: inv.venueName,
      venueAddress: inv.venueAddress,
      mapsUrl: inv.mapsUrl,
      openingQuote: inv.openingQuote,
      coverPhotoUrl: inv.coverPhotoUrl,
      musicUrl: inv.musicUrl,
      videoUrl: inv.videoUrl,
      galleryPhotos: (inv.galleryPhotos ?? []).join("\n"),
      additionalNotes: inv.additionalNotes,
      isPublished: inv.isPublished,
    });
    if (data.loveStory && data.loveStory.length > 0) {
      setLoveStory(data.loveStory.map(item => ({
        dateLabel: item.dateLabel,
        title: item.title,
        description: item.description,
        photoUrl: item.photoUrl,
      })));
    }
  }, [data]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const updateMutation = useMutation({
    mutationFn: (body: any) => apiRequest("PATCH", `/api/invitations/${id}`, body),
    onSuccess: () => {
      toast({ title: "Undangan berhasil diperbarui!" });
      qc.invalidateQueries({ queryKey: ["/api/invitations"] });
      qc.invalidateQueries({ queryKey: ["/api/stats"] });
      navigate("/admin");
    },
    onError: async (err: any) => {
      const body = await err.response?.json?.() ?? {};
      toast({ title: body.error || "Gagal memperbarui undangan", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.groomName.trim() || !form.brideName.trim()) {
      toast({ title: "Nama pengantin wajib diisi", variant: "destructive" });
      return;
    }
    const galleryPhotos = form.galleryPhotos
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    const validLoveStory = loveStory.filter(item => item.title.trim());
    updateMutation.mutate({ ...form, galleryPhotos, loveStory: validLoveStory });
  };

  const addLoveStoryItem = () => setLoveStory(prev => [...prev, { ...emptyStoryItem }]);
  const removeLoveStoryItem = (i: number) => setLoveStory(prev => prev.filter((_, idx) => idx !== i));
  const updateLoveStory = (i: number, k: string, v: string) =>
    setLoveStory(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Heart className="w-10 h-10 text-gray-200 mx-auto" />
          <p className="text-gray-500">Undangan tidak ditemukan.</p>
          <Link href="/admin">
            <Button variant="outline">Kembali ke Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-gray-800">WedSaas</span>
            <span className="text-gray-300 mx-1">|</span>
            <span className="text-gray-500 text-sm">Edit Undangan</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/invitation/${data.invitation.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="text-gray-500" data-testid="button-preview">
                <Eye className="w-4 h-4 mr-1" /> Preview
              </Button>
            </a>
            <Link href="/admin">
              <Button variant="ghost" size="sm" data-testid="button-back-to-admin">
                <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Pasangan */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <SectionHeading>Informasi Pasangan</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="groomName">Nama Mempelai Pria *</Label>
                <Input id="groomName" data-testid="input-groom-name" value={form.groomName} onChange={set("groomName")} placeholder="cth. Budi Santoso" className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="brideName">Nama Mempelai Wanita *</Label>
                <Input id="brideName" data-testid="input-bride-name" value={form.brideName} onChange={set("brideName")} placeholder="cth. Sari Rahayu" className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="groomParents">Nama Orang Tua Pria</Label>
                <Input id="groomParents" data-testid="input-groom-parents" value={form.groomParents} onChange={set("groomParents")} placeholder="cth. Bp. Hendra & Ibu Wati" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="brideParents">Nama Orang Tua Wanita</Label>
                <Input id="brideParents" data-testid="input-bride-parents" value={form.brideParents} onChange={set("brideParents")} placeholder="cth. Bp. Agus & Ibu Rina" className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="slug">URL Undangan</Label>
                <Input id="slug" data-testid="input-slug" value={form.slug} onChange={set("slug")} placeholder="cth. budi-sari" className="mt-1" />
                <p className="text-xs text-gray-400 mt-1">Hanya huruf kecil, angka, dan tanda hubung (-)</p>
              </div>
            </div>
          </div>

          {/* Acara */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <SectionHeading>Detail Acara</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="akadDate">Tanggal Akad</Label>
                <Input id="akadDate" data-testid="input-akad-date" type="date" value={form.akadDate} onChange={set("akadDate")} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="akadTime">Waktu Akad</Label>
                <Input id="akadTime" data-testid="input-akad-time" value={form.akadTime} onChange={set("akadTime")} placeholder="cth. 08.00 - 10.00 WIB" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="receptionDate">Tanggal Resepsi</Label>
                <Input id="receptionDate" data-testid="input-reception-date" type="date" value={form.receptionDate} onChange={set("receptionDate")} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="receptionTime">Waktu Resepsi</Label>
                <Input id="receptionTime" data-testid="input-reception-time" value={form.receptionTime} onChange={set("receptionTime")} placeholder="cth. 11.00 - selesai WIB" className="mt-1" />
              </div>
            </div>
          </div>

          {/* Venue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <SectionHeading>Venue &amp; Lokasi</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="venueName">Nama Venue</Label>
                <Input id="venueName" data-testid="input-venue-name" value={form.venueName} onChange={set("venueName")} placeholder="cth. Gedung Serbaguna Permata" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="venueAddress">Alamat</Label>
                <Textarea id="venueAddress" data-testid="input-venue-address" value={form.venueAddress} onChange={set("venueAddress")} placeholder="cth. Jl. Pahlawan No. 45, Bandung" className="mt-1" rows={2} />
              </div>
              <div>
                <Label htmlFor="mapsUrl">URL Google Maps Embed</Label>
                <Input id="mapsUrl" data-testid="input-maps-url" value={form.mapsUrl} onChange={set("mapsUrl")} placeholder="https://www.google.com/maps/embed?pb=..." className="mt-1" />
                <p className="text-xs text-gray-400 mt-1">Gunakan kode embed dari Google Maps (Bagikan &gt; Sematkan peta)</p>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <SectionHeading>Media</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="coverPhotoUrl">URL Foto Cover</Label>
                <Input id="coverPhotoUrl" data-testid="input-cover-photo" value={form.coverPhotoUrl} onChange={set("coverPhotoUrl")} placeholder="https://..." className="mt-1" />
              </div>
              <div>
                <Label htmlFor="galleryPhotos">URL Foto Galeri</Label>
                <Textarea id="galleryPhotos" data-testid="input-gallery-photos" value={form.galleryPhotos} onChange={set("galleryPhotos")} placeholder={"Satu URL per baris\nhttps://...\nhttps://..."} className="mt-1" rows={4} />
              </div>
              <div>
                <Label htmlFor="musicUrl">URL Musik Latar (MP3)</Label>
                <Input id="musicUrl" data-testid="input-music-url" value={form.musicUrl} onChange={set("musicUrl")} placeholder="https://..." className="mt-1" />
              </div>
              <div>
                <Label htmlFor="videoUrl">URL Video Embed (YouTube/Vimeo)</Label>
                <Input id="videoUrl" data-testid="input-video-url" value={form.videoUrl} onChange={set("videoUrl")} placeholder="https://www.youtube.com/embed/..." className="mt-1" />
              </div>
            </div>
          </div>

          {/* Love Story */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <SectionHeading>Kisah Cinta</SectionHeading>
            <div className="space-y-4">
              {loveStory.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 relative" data-testid={`love-story-draft-${i}`}>
                  <button
                    type="button"
                    onClick={() => removeLoveStoryItem(i)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-rose-400 transition-colors"
                    data-testid={`button-remove-story-${i}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tanggal/Label</Label>
                      <Input value={item.dateLabel} onChange={e => updateLoveStory(i, "dateLabel", e.target.value)} placeholder="cth. Januari 2020" className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Judul *</Label>
                      <Input value={item.title} onChange={e => updateLoveStory(i, "title", e.target.value)} placeholder="cth. Pertama Bertemu" className="mt-1 text-sm" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Cerita</Label>
                      <Textarea value={item.description} onChange={e => updateLoveStory(i, "description", e.target.value)} placeholder="Ceritakan momen ini..." className="mt-1 text-sm" rows={2} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">URL Foto (opsional)</Label>
                      <Input value={item.photoUrl} onChange={e => updateLoveStory(i, "photoUrl", e.target.value)} placeholder="https://..." className="mt-1 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLoveStoryItem} className="w-full border-dashed" data-testid="button-add-story">
                <Plus className="w-4 h-4 mr-1" /> Tambah Cerita
              </Button>
            </div>
          </div>

          {/* Teks */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <SectionHeading>Teks &amp; Catatan</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="openingQuote">Kutipan Pembuka</Label>
                <Textarea id="openingQuote" data-testid="input-opening-quote" value={form.openingQuote} onChange={set("openingQuote")} placeholder="cth. QS. Ar-Rum: 21..." className="mt-1" rows={3} />
              </div>
              <div>
                <Label htmlFor="additionalNotes">Catatan Tambahan</Label>
                <Textarea id="additionalNotes" data-testid="input-additional-notes" value={form.additionalNotes} onChange={set("additionalNotes")} placeholder="Pesan untuk tamu undangan..." className="mt-1" rows={2} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Publikasikan Undangan</Label>
                  <p className="text-xs text-gray-400">Undangan dapat diakses oleh tamu</p>
                </div>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={v => setForm(f => ({ ...f, isPublished: v }))}
                  data-testid="switch-published"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <Link href="/admin" className="flex-1">
              <Button type="button" variant="outline" className="w-full" data-testid="button-cancel">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
              data-testid="button-save-invitation"
            >
              {updateMutation.isPending ? "Menyimpan..." : (
                <><Save className="w-4 h-4 mr-1" /> Simpan Perubahan</>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
