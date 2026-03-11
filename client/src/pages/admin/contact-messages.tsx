import { useQuery } from "@tanstack/react-query";
import { type ContactMessage } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, Mail, User, Calendar, MessageSquare } from "lucide-react";

export default function AdminContactMessages() {
  const { data: messages, isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contact-messages"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">Pesan Kontak</CardTitle>
          <Badge variant="outline">{messages?.length || 0} Pesan</Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[200px]">Pengirim</TableHead>
                  <TableHead className="w-[250px]">Subjek</TableHead>
                  <TableHead>Pesan</TableHead>
                  <TableHead className="w-[150px]">Tanggal</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!messages?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                      Belum ada pesan masuk.
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((msg) => (
                    <TableRow key={msg.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {msg.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail className="w-3.5 h-3.5" />
                            {msg.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {msg.subject}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5 text-sm text-slate-600 max-w-md">
                          <MessageSquare className="w-3.5 h-3.5 mt-1 flex-shrink-0 text-slate-400" />
                          <span className="line-clamp-2">{msg.message}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(msg.createdAt), "d MMM yyyy", { locale: id })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={msg.status === "unread" ? "destructive" : "secondary"}
                          className="capitalize"
                        >
                          {msg.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
