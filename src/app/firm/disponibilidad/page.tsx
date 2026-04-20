"use client";

import { Loader2 } from "lucide-react";
import { LawyerAvailabilityPanel } from "@/components/appointments/LawyerAvailabilityPanel";
import { useAuth } from "@/lib/auth/AuthContext";

export default function FirmAvailabilityPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <div className="rounded-[32px] bg-white p-10 text-center text-neutral-500 shadow-sm"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  }

  return <LawyerAvailabilityPanel lawyerId={user.uid} />;
}
