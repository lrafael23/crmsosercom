"use client";

import { useState, useEffect } from "react";
import { X, Save, Clock, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { WeeklyAvailability, DEFAULT_AVAILABILITY } from "@/lib/availability";

interface Props {
  userId: string;
  onClose: () => void;
}

export function AvailabilitySettings({ userId, onClose }: Props) {
  const [availability, setAvailability] = useState<WeeklyAvailability>(DEFAULT_AVAILABILITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const docRef = doc(db, "lawyer_settings", userId);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().availability) {
        setAvailability(snap.data().availability);
      }
      setLoading(false);
    }
    loadSettings();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "lawyer_settings", userId), { availability }, { merge: true });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving availability:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const addSlot = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { 
        ...prev[day], 
        slots: [...prev[day].slots, { start: "09:00", end: "10:00" }] 
      }
    }));
  };

  const updateSlot = (day: string, index: number, field: "start" | "end", value: string) => {
    const newSlots = [...availability[day].slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: newSlots }
    }));
  };

  const removeSlot = (day: string, index: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { 
        ...prev[day], 
        slots: prev[day].slots.filter((_, i) => i !== index) 
      }
    }));
  };

  const daysLabels: Record<string, string> = {
    mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes", sat: "Sábado", sun: "Domingo"
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
      >
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Ajustes de Disponibilidad
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configura tus horarios para el piloto</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(daysLabels).map(dayKey => (
                <div key={dayKey} className="flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-all">
                  <div className="w-32 flex-shrink-0 flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={availability[dayKey].enabled}
                      onChange={() => toggleDay(dayKey)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`text-sm font-black ${availability[dayKey].enabled ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {daysLabels[dayKey]}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3">
                    {availability[dayKey].enabled ? (
                      <>
                        {availability[dayKey].slots.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input 
                              type="time" 
                              value={slot.start}
                              onChange={(e) => updateSlot(dayKey, idx, "start", e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold shadow-sm"
                            />
                            <span className="text-slate-400">—</span>
                            <input 
                              type="time" 
                              value={slot.end}
                              onChange={(e) => updateSlot(dayKey, idx, "end", e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold shadow-sm"
                            />
                            <button 
                              onClick={() => removeSlot(dayKey, idx)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => addSlot(dayKey)}
                          className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
                        >
                          <Plus className="w-3 h-3" /> Añadir Rango
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic pt-2 block">Cerrado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-xl ${
              saved ? "bg-emerald-500" : "bg-slate-900 dark:bg-emerald-600 hover:scale-[1.02]"
            }`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : saved ? "Guardado" : "Guardar Cambios"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
