/**
 * Portal 360 — Cliente de Mercado Pago (SOLO SERVIDOR)
 *
 * ⚠️  NUNCA importar este archivo en componentes cliente (`'use client'`).
 * El MP_ACCESS_TOKEN vive EXCLUSIVAMENTE aquí, en el entorno del servidor.
 *
 * Uso correcto: Route Handlers en `src/app/api/`
 */

import { MercadoPagoConfig, Payment, PreApprovalPlan, PreApproval } from "mercadopago";

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken && process.env.NODE_ENV !== "test") {
  // Solo advertimos — no bloqueamos el build.
  // En producción, configura MP_ACCESS_TOKEN en las variables de entorno.
  console.warn(
    "[MercadoPago] MP_ACCESS_TOKEN no está configurado. " +
    "Los endpoints de pago fallarán en runtime."
  );
}

/**
 * Instancia principal del cliente de Mercado Pago.
 * Configurada con el ACCESS TOKEN del servidor.
 */
export const mp = new MercadoPagoConfig({
  accessToken: accessToken ?? "MISSING_TOKEN",
  options: {
    timeout: 5000,
  },
});

/**
 * Clientes pre-instanciados para los recursos más usados.
 * Úsalos directamente en los Route Handlers.
 */
export const mpPayment = new Payment(mp);
export const mpPreApprovalPlan = new PreApprovalPlan(mp);
export const mpPreApproval = new PreApproval(mp);

/**
 * Tipos útiles re-exportados para los Route Handlers.
 */
export type { PreApprovalPlan, PreApproval, Payment };
