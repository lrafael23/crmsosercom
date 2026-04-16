"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["super_admin_global", "admin", "abogado", "contador", "tributario", "staff"]}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </ProtectedRoute>
  );
}
