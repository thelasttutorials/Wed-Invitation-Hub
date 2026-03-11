import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface UserGuardProps {
  children: React.ReactNode;
}

export default function UserGuard({ children }: UserGuardProps) {
  const [, navigate] = useLocation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isLoading && (isError || !data)) {
      navigate("/login");
    }
  }, [isLoading, isError, data, navigate]);

  if (isLoading || isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return <>{children}</>;
}
