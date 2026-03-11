import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heart, Loader2, ArrowLeft, Mail, KeyRound } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Masukkan email yang valid"),
});

const codeSchema = z.object({
  code: z
    .string()
    .min(6, "Kode harus 6 digit")
    .max(6, "Kode harus 6 digit")
    .regex(/^\d{6}$/, "Kode hanya berisi angka"),
});

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;

export default function AuthLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    if (!meLoading && meData) {
      navigate("/dashboard");
    }
  }, [meLoading, meData, navigate]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  function startCountdown() {
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const requestCodeMutation = useMutation({
    mutationFn: (data: EmailForm) =>
      apiRequest("POST", "/api/auth/request-code", data),
    onSuccess: (_data, variables) => {
      setEmail(variables.email);
      setStep("code");
      startCountdown();
      toast({
        title: "Kode terkirim!",
        description: `Cek email ${variables.email} untuk kode verifikasi.`,
      });
    },
    onError: (err: any) => {
      const msg = err?.message || "Gagal mengirim kode. Coba lagi.";
      toast({ title: "Gagal", description: msg, variant: "destructive" });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: (data: CodeForm) =>
      apiRequest("POST", "/api/auth/verify-code", { email, code: data.code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/dashboard");
    },
    onError: (err: any) => {
      const msg = err?.message || "Kode tidak valid atau sudah kadaluarsa.";
      toast({ title: "Kode salah", description: msg, variant: "destructive" });
      codeForm.setError("code", { message: msg });
    },
  });

  const handleResend = () => {
    if (countdown > 0) return;
    requestCodeMutation.mutate({ email });
    codeForm.reset();
  };

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col">
      {/* Logo */}
      <header className="p-6">
        <a href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">WedSaas</span>
        </a>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            {step === "email" ? (
              <>
                <div className="mb-6 text-center">
                  <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-rose-500" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">Masuk / Daftar</h1>
                  <p className="text-slate-500 text-sm mt-1.5">
                    Masukkan email kamu, kami akan kirim kode verifikasi
                  </p>
                </div>

                <Form {...emailForm}>
                  <form
                    onSubmit={emailForm.handleSubmit((d) => requestCodeMutation.mutate(d))}
                    className="space-y-4"
                  >
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alamat Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="nama@email.com"
                              autoComplete="email"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                      disabled={requestCodeMutation.isPending}
                      data-testid="button-kirim-kode"
                    >
                      {requestCodeMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</>
                      ) : (
                        "Kirim Kode"
                      )}
                    </Button>
                  </form>
                </Form>
              </>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-6 h-6 text-rose-500" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">Masukkan Kode</h1>
                  <p className="text-slate-500 text-sm mt-1.5">
                    Kode 6 digit telah dikirim ke
                  </p>
                  <p className="font-medium text-slate-800 text-sm">{email}</p>
                </div>

                <Form {...codeForm}>
                  <form
                    onSubmit={codeForm.handleSubmit((d) => verifyCodeMutation.mutate(d))}
                    className="space-y-4"
                  >
                    <FormField
                      control={codeForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kode Verifikasi</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="123456"
                              maxLength={6}
                              autoComplete="one-time-code"
                              className="text-center text-2xl tracking-widest font-mono h-14"
                              data-testid="input-otp-code"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                      disabled={verifyCodeMutation.isPending}
                      data-testid="button-verifikasi"
                    >
                      {verifyCodeMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memverifikasi...</>
                      ) : (
                        "Verifikasi & Masuk"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-4 text-center">
                  <p className="text-sm text-slate-500">
                    Tidak menerima kode?{" "}
                    {countdown > 0 ? (
                      <span className="text-slate-400">
                        Kirim ulang dalam {countdown}d
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={requestCodeMutation.isPending}
                        className="text-rose-500 hover:text-rose-600 font-medium underline-offset-2 hover:underline disabled:opacity-50"
                        data-testid="button-resend-code"
                      >
                        Kirim Ulang
                      </button>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { setStep("email"); codeForm.reset(); }}
                  className="mt-3 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mx-auto"
                  data-testid="button-ganti-email"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Ganti email
                </button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Dengan masuk, kamu menyetujui{" "}
            <a href="#" className="underline hover:text-slate-600">Syarat & Ketentuan</a>{" "}
            dan{" "}
            <a href="#" className="underline hover:text-slate-600">Kebijakan Privasi</a>{" "}
            kami.
          </p>
        </div>
      </div>
    </div>
  );
}
