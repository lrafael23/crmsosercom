"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["cliente", "cliente_final", "super_admin_global"]}>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </ProtectedRoute>
  );
}
