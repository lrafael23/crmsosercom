"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["super_admin_global"]}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </ProtectedRoute>
  );
}
