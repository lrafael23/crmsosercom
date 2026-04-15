/**
 * Portal 360 — Definición de Planes del Producto
 *
 * Esta es la fuente de verdad para precios, límites y features.
 * Los IDs de planes en Mercado Pago se almacenan en Firestore
 * bajo la colección `mp_subscription_plans`.
 */

export type PlanId = "basico" | "full" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  /** Precio en CLP (pesos chilenos) */
  priceCLP: number;
  /** Descripción corta para tarjetas */
  tagline: string;
  /** Límite de causas activas (null = ilimitado) */
  maxActiveCases: number | null;
  /** Límite de conferencias mensuales incluidas (0MVP) */
  maxMonthlyConferences: number | null;
  /** Asientos de usuarios internos incluidos */
  includedSeats: number;
  /** Si permite seats extra (solo Premium) */
  allowExtraSeats: boolean;
  /** Precio por seat extra en CLP (solo Premium) */
  extraSeatPriceCLP: number | null;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  basico: {
    id: "basico",
    name: "Básico",
    priceCLP: 10000,
    tagline: "Para abogados independientes o estudios muy pequeños",
    maxActiveCases: 10,
    maxMonthlyConferences: 5,
    includedSeats: 2,
    allowExtraSeats: false,
    extraSeatPriceCLP: null,
    features: [
      "Hasta 10 causas activas",
      "2 usuarios internos",
      "Dashboard operativo",
      "Gestión de causas y clientes",
      "Timeline de etapas por causa",
      "Gestión de documentos",
      "Registro de pagos y honorarios",
      "Agenda y reuniones",
      "Portal del cliente final",
    ],
  },
  full: {
    id: "full",
    name: "Full",
    priceCLP: 35000,
    tagline: "Para estudios pequeños y medianos en crecimiento",
    maxActiveCases: 50,
    maxMonthlyConferences: 25,
    includedSeats: 5,
    allowExtraSeats: false,
    extraSeatPriceCLP: null,
    highlighted: true,
    features: [
      "Hasta 50 causas activas",
      "5 usuarios internos",
      "Todo lo del plan Básico",
      "Panel operativo avanzado",
      "Métricas ampliadas",
      "Soporte prioritario",
      "Mayor capacidad de clientes",
      "Reportes por área",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceCLP: 99000,
    tagline: "Para grandes estudios jurídicos sin límites operativos",
    maxActiveCases: null, // Ilimitado
    maxMonthlyConferences: null, // Ilimitado
    includedSeats: 10,
    allowExtraSeats: true,
    extraSeatPriceCLP: 7000,
    features: [
      "Causas activas ilimitadas",
      "10 usuarios internos incluidos",
      "+$7.000/mes por usuario adicional",
      "Todo lo del plan Full",
      "Panel ejecutivo avanzado",
      "Métricas completas y exportables",
      "Gestión extendida de equipo",
      "Auditoría financiera detallada",
      "Soporte dedicado",
    ],
  },
};

export const PLANS_ARRAY = Object.values(PLANS);

/**
 * Obtiene la definición del plan por ID.
 */
export function getPlan(planId: PlanId): Plan {
  return PLANS[planId];
}

/**
 * Verifica si se puede agregar una causa activa más.
 * @param planId - ID del plan actual
 * @param currentActiveCases - Número actual de causas activas
 */
export function canAddCase(planId: PlanId, currentActiveCases: number): boolean {
  const plan = PLANS[planId];
  if (plan.maxActiveCases === null) return true; // Premium: ilimitado
  return currentActiveCases < plan.maxActiveCases;
}

/**
 * Verifica si se puede agregar un usuario interno más.
 * Si el plan es Premium y se superan los includedSeats, se cobra extra.
 * @param planId - ID del plan
 * @param currentSeats - Usuarios internos actuales
 * @returns { allowed: boolean; isExtra: boolean; extraCost: number }
 */
export function canAddSeat(
  planId: PlanId,
  currentSeats: number
): { allowed: boolean; isExtra: boolean; extraCostCLP: number } {
  const plan = PLANS[planId];

  if (currentSeats < plan.includedSeats) {
    return { allowed: true, isExtra: false, extraCostCLP: 0 };
  }

  if (plan.allowExtraSeats && plan.extraSeatPriceCLP !== null) {
    return { allowed: true, isExtra: true, extraCostCLP: plan.extraSeatPriceCLP };
  }

  return { allowed: false, isExtra: false, extraCostCLP: 0 };
}

/**
 * Calcula el costo mensual real de un tenant en Premium con seats extras.
 */
export function calculatePremiumMonthlyCost(currentSeats: number): number {
  const plan = PLANS.premium;
  const basePrice = plan.priceCLP;
  const extraSeats = Math.max(0, currentSeats - plan.includedSeats);
  const extraCost = extraSeats * (plan.extraSeatPriceCLP ?? 0);
  return basePrice + extraCost;
}

/**
 * Formatea precio en CLP para mostrar en UI.
 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}
