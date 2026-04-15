import { addMinutes, format, isBefore, startOfDay, addDays, isEqual } from "date-fns";

/**
 * Portal 360 — Lógica de Disponibilidad
 */

export interface TimeSlot {
  start: string; // "HH:mm"
  end: string;
}

export interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeeklyAvailability {
  [key: string]: DayAvailability; // "mon", "tue", etc.
}

export const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  mon: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  tue: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  wed: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  thu: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  fri: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  sat: { enabled: false, slots: [] },
  sun: { enabled: false, slots: [] },
};

/**
 * Genera slots de 45 minutos dentro de un rango
 */
export function generateSlots(startStr: string, endStr: string, durationMinutes: number = 45) {
  const slots: string[] = [];
  let current = new Date(`2000-01-01T${startStr}:00`);
  const end = new Date(`2000-01-01T${endStr}:00`);

  while (isBefore(current, end)) {
    slots.push(format(current, "HH:mm"));
    current = addMinutes(current, durationMinutes);
  }

  return slots;
}

/**
 * Verifica si una fecha y hora está a más de 24h de anticipación
 */
export function isWithinNoticePeriod(date: Date, timeStr: string): boolean {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const targetDate = new Date(date);
  targetDate.setHours(hours, minutes, 0, 0);
  
  const minNoticeDate = addDays(new Date(), 1); // 24 horas exactas desde ahora sería ideal, 
                                                // pero 1 día calendario es lo que pide el user.
  return isBefore(minNoticeDate, targetDate);
}

/**
 * Filtra slots ocupados por citas existentes
 */
export function filterAvailableSlots(
  date: Date, 
  allSlots: string[], 
  existingAppointments: { date: Date; time: string }[]
) {
  return allSlots.filter(slot => {
    // 1. No estar ocupado
    const isOccupied = existingAppointments.some(apt => 
      isEqual(startOfDay(apt.date), startOfDay(date)) && apt.time === slot
    );
    if (isOccupied) return false;

    // 2. Cumplir con pre-aviso de 1 día
    return isWithinNoticePeriod(date, slot);
  });
}
