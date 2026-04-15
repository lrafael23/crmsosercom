"use client";

import { useState } from "react";
import { 
  X, 
  Mail, 
  User, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/client";
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { assertCanAddSeat, incrementActiveSeats } from "@/lib/billing";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface UserInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

const ROLES = [
  { id: "abogado", label: "Abogado", icon: Shield, desc: "Acceso total a causas y clientes." },
  { id: "contador", label: "Contador", icon: User, desc: "Gestión de facturación y reportes." },
  { id: "staff", label: "Staff/Secretaría", icon: User, desc: "Gestión de agenda y documentos." },
];

// ─── Componente ──────────────────────────────────────────────────────────────

export default function UserInviteModal({ isOpen, onClose, tenantId }: UserInviteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "abogado",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Validar límites de plan
      const { isExtra } = await assertCanAddSeat(tenantId);

      // 2. Crear documento de usuario en Firestore
      // Generamos un ID aleatorio o usamos el email como base si no hay integración de Auth real aún.
      // Para este MVP, crearemos el documento en 'users' para que aparezca en la lista.
      const tempId = `temp_${Math.random().toString(36).substr(2, 9)}`;
      
      await setDoc(doc(db, "users", tempId), {
        uid: tempId,
        displayName: formData.name,
        email: formData.email.toLowerCase(),
        role: formData.role,
        tenantId,
        status: "pending", // Queda como pendiente hasta que "acepte" (o se le cree la cuenta real)
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Incrementar contador en el uso del plan
      await incrementActiveSeats(tenantId, isExtra);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ email: "", name: "", role: "abogado" });
      }, 2000);

    } catch (err: any) {
      console.error("Error inviting user:", err);
      setError(err.message || "Ocurrió un error al procesar la invitación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            {/* Success Overlay */}
            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-10 bg-emerald-600 flex flex-col items-center justify-center text-white p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                  >
                    <CheckCircle className="w-20 h-20 mb-6" />
                  </motion.div>
                  <h2 className="text-2xl font-black mb-2">¡Invitación Enviada!</h2>
                  <p className="font-medium opacity-90">El nuevo miembro ha sido registrado en tu equipo con éxito.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="px-8 pt-8 pb-6 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none">Invitar colaborador</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Expande la capacidad operativa de tu estudio.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="text"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 ring-emerald-500/20 outline-none transition-all"
                      placeholder="Ej: Juan Pérez"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="email"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 ring-emerald-500/20 outline-none transition-all"
                      placeholder="ejemplo@estudio.cl"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Seleccionar Rol</label>
                <div className="grid grid-cols-1 gap-3">
                  {ROLES.map(role => {
                    const Icon = role.icon;
                    const isSelected = formData.role === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role.id })}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                          isSelected 
                            ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-500 ring-4 ring-emerald-500/10" 
                            : "bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>{role.label}</p>
                          <p className="text-xs text-slate-500 font-medium">{role.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Confirmar Invitación
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">
                  Al invitar, aceptas los términos y condiciones de Portal 360
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
