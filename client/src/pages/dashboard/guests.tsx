import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useState, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserGuard from "@/components/user-guard";
import { UserSidebar } from "@/components/user-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGuestSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Users, Plus, Upload, Download, Copy, Share2, Trash2, CheckCircle2, 
  Search, Loader2, UserPlus, Phone, Mail, UserCheck, Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function GuestManagementPage() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch invitations to get the active one
  const { data: invitations, isLoading: invLoading } = useQuery<any[]>({
    queryKey: ["/api/invitations"],
  });

  // For this simplified version, we take the first non-demo invitation
  const activeInvitation = invitations?.find(inv => !inv.slug.startsWith("demo-"));
  const invitationId = activeInvitation?.id;

  const { data: guests, isLoading: guestsLoading } = useQuery<any[]>({
    queryKey: ["/api/guests", { invitationId }],
    queryFn: () => invitationId ? fetch(`/api/guests?invitationId=${invitationId}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!invitationId,
  });

  const addGuestMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/guests", { ...data, invitationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests", { invitationId }] });
      toast({ title: "Tamu ditambahkan", description: "Berhasil menambahkan tamu baru." });
      setIsAddModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/guests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests", { invitationId }] });
      toast({ title: "Tamu dihapus", description: "Berhasil menghapus tamu." });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/guests/${id}/checkin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests", { invitationId }] });
      toast({ title: "Check-in berhasil", description: "Tamu telah dicatat hadir." });
    },
  });

  const importMutation = useMutation({
    mutationFn: (guests: any[]) => apiRequest("POST", "/api/guests/import", { invitationId, guests }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests", { invitationId }] });
      toast({ title: "Import berhasil", description: `${data.length} tamu telah diimport.` });
      setIsImportModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Import gagal", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertGuestSchema.omit({ invitationId: true, guestCode: true })),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      maxGuest: 2,
    },
  });

  const handleCopyLink = (guestCode: string) => {
    const url = `${window.location.origin}/invite/${activeInvitation.slug}?guest=${guestCode}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link disalin", description: "Link undangan personal berhasil disalin." });
  };

  const handleWhatsAppShare = (guest: any) => {
    const url = `${window.location.origin}/invite/${activeInvitation.slug}?guest=${guest.guestCode}`;
    const text = `Halo ${guest.name}, kami mengundang Anda ke pernikahan kami. Lihat undangan digital di sini: ${url}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleDownloadTemplate = () => {
    const headers = "Name,Phone,Email,MaxGuest\n";
    const example = "Budi Santoso,628123456789,budi@example.com,2\nSiti Aminah,628987654321,siti@example.com,1";
    const blob = new Blob([headers + example], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_tamu.csv";
    a.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(",");
        const entry: any = {};
        headers.forEach((header, i) => {
          const key = header.trim().toLowerCase();
          const val = values[i]?.trim();
          if (key === "name") entry.name = val;
          if (key === "phone") entry.phone = val;
          if (key === "email") entry.email = val;
          if (key === "maxguest") entry.maxGuest = parseInt(val) || 2;
        });
        return entry;
      });
      importMutation.mutate(data);
    };
    reader.readAsText(file);
  };

  if (invLoading) {
    return (
      <DashboardLayout title="Manajemen Tamu">
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!activeInvitation) {
    return (
      <DashboardLayout title="Manajemen Tamu">
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold">Belum Ada Undangan</h2>
          <p className="text-slate-500">Anda harus membuat undangan terlebih dahulu untuk mengelola tamu.</p>
          <Link href="/dashboard/new">
            <Button>Buat Undangan Sekarang</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manajemen Tamu">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daftar Tamu</h1>
            <p className="text-slate-500 text-sm">Kelola tamu untuk undangan: {activeInvitation.groomName} & {activeInvitation.brideName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5" data-testid="button-download-template">
              <Download className="w-4 h-4" /> Template
            </Button>
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-import-guests">
                  <Upload className="w-4 h-4" /> Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Daftar Tamu</DialogTitle>
                  <DialogDescription>
                    Unggah file CSV dengan kolom: Name, Phone, Email, MaxGuest.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImportCSV}
                  />
                  <Upload className="w-8 h-8 text-slate-400" />
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
                    {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Pilih File CSV
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" data-testid="button-add-guest">
                  <Plus className="w-4 h-4" /> Tambah Tamu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Tamu Baru</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((d) => addGuestMutation.mutate(d))} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Tamu</FormLabel>
                        <FormControl><Input placeholder="Contoh: Budi Santoso" data-testid="input-guest-name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. WhatsApp</FormLabel>
                          <FormControl><Input placeholder="628123..." data-testid="input-guest-phone" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="maxGuest" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maks. Tamu</FormLabel>
                          <FormControl><Input type="number" min={1} data-testid="input-guest-max" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (opsional)</FormLabel>
                        <FormControl><Input type="email" placeholder="email@tamu.com" data-testid="input-guest-email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="submit" className="w-full" disabled={addGuestMutation.isPending}>
                        {addGuestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Simpan Tamu"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Tamu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guests?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase">Check-in</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {guests?.filter(g => g.checkinStatus === "checked_in").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase">Belum Hadir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {guests?.filter(g => g.checkinStatus === "pending").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {guestsLoading ? (
              <div className="p-8 space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !guests?.length ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Belum ada tamu yang terdaftar.</p>
                <Button variant="ghost" onClick={() => setIsAddModalOpen(true)}>Tambah tamu pertama</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Maks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map((guest) => (
                      <TableRow key={guest.id} data-testid={`guest-row-${guest.id}`}>
                        <TableCell className="font-medium">{guest.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {guest.phone || "-"}
                            </span>
                            {guest.email && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {guest.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{guest.guestCode}</code></TableCell>
                        <TableCell>{guest.maxGuest}</TableCell>
                        <TableCell>
                          {guest.checkinStatus === "checked_in" ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Hadir
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyLink(guest.guestCode)} title="Copy Link Personal" data-testid={`button-copy-link-${guest.id}`}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleWhatsAppShare(guest)} title="Share via WhatsApp" data-testid={`button-share-wa-${guest.id}`}>
                              <Share2 className="w-3.5 h-3.5" />
                            </Button>
                            {guest.checkinStatus !== "checked_in" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => checkinMutation.mutate(guest.id)} title="Mark Check-in" data-testid={`button-checkin-${guest.id}`}>
                                <UserCheck className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteGuestMutation.mutate(guest.id)} title="Hapus Tamu" data-testid={`button-delete-guest-${guest.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function DashboardLayout({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <UserGuard>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-slate-50">
          <UserSidebar />
          <SidebarInset className="flex flex-col min-h-0">
            <header className="flex items-center gap-2 px-4 h-12 border-b bg-white shrink-0">
              <SidebarTrigger className="text-slate-500 hover:text-slate-800" data-testid="button-sidebar-toggle-user" />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm font-medium text-slate-700">{title}</span>
            </header>
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </UserGuard>
  );
}
