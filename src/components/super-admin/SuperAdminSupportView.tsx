"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, CalendarDays, Eye, Loader2, Power, RefreshCcw, Search, ShieldCheck, UserRound, Users } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { IMPERSONATION_STORAGE_KEY } from "@/lib/auth/impersonation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuditLogRecord, TenantDetailPayload, TenantRecord } from "@/features/super-admin/types";
import type { SupportUserRecord } from "@/features/super-admin/types";

type TenantStatusFilter = "todos" | "active" | "suspended";

function formatDate(value?: string | null) {
  if (!value) return "Sin actividad";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-CL");
}

function getRedirectForRole(role: string) {
  if (role === "cliente" || role === "cliente_final") return "/cliente/causas";
  if (["owner_firm", "abogado", "contador", "tributario", "staff"].includes(role)) return "/firm";
  return "/super-admin";
}

export function SuperAdminSupportView() {
  const { user, impersonate } = useAuth();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TenantDetailPayload | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TenantStatusFilter>("todos");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const authedFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Sesion no disponible");
    return fetch(input, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  }, []);

  const loadTenantDetail = useCallback(async (tenantId: string) => {
    const res = await authedFetch(`/api/super-admin/tenants/${tenantId}`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo cargar el tenant");
    setDetail({ tenant: data.tenant, users: data.users ?? [], logs: data.logs ?? [] });
    setSelectedTenantId(tenantId);
  }, [authedFetch]);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "todos") params.set("status", status);
      const query = params.toString();
      const res = await authedFetch(`/api/super-admin/tenants${query ? `?${query}` : ""}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudieron cargar tenants");
      const rows = (data.data ?? []) as TenantRecord[];
      setTenants(rows);
      const nextTenantId = selectedTenantId && rows.some((row) => row.id === selectedTenantId)
        ? selectedTenantId
        : rows[0]?.id ?? null;
      if (nextTenantId) {
        await loadTenantDetail(nextTenantId);
      } else {
        setDetail(null);
        setSelectedTenantId(null);
      }
    } catch (error) {
      setTenants([]);
      setDetail(null);
      setSelectedTenantId(null);
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [authedFetch, loadTenantDetail, search, selectedTenantId, status]);

  useEffect(() => {
    if (user?.role === "super_admin_global") void loadTenants();
  }, [user?.role, loadTenants]);

  async function toggleTenantStatus(nextStatus: "active" | "suspended") {
    if (!detail?.tenant) return;
    setWorking(`tenant:${nextStatus}`);
    setMessage(null);
    try {
      const res = await authedFetch(`/api/super-admin/tenants/${detail.tenant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo actualizar tenant");
      setMessage(`Tenant ${nextStatus === "active" ? "activado" : "suspendido"}.`);
      await loadTenants();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setWorking(null);
    }
  }

  async function toggleUserStatus(uid: string, nextStatus: "active" | "suspended") {
    setWorking(`user:${uid}:${nextStatus}`);
    setMessage(null);
    try {
      const res = await authedFetch(`/api/super-admin/users/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo actualizar usuario");
      setMessage(`Usuario ${nextStatus === "active" ? "activado" : "suspendido"}.`);
      if (detail?.tenant.id) await loadTenantDetail(detail.tenant.id);
      await loadTenants();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setWorking(null);
    }
  }

  async function impersonateUser(target: SupportUserRecord, redirectPath?: string) {
    setWorking(`impersonate:${target.uid}`);
    setMessage(null);
    try {
      const res = await authedFetch("/api/super-admin/impersonation", {
        method: "POST",
        body: JSON.stringify({ targetUserId: target.uid }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo iniciar impersonacion");

      localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify({
        sessionId: data.session.id,
        targetUserId: data.targetUser.uid,
        targetRole: data.targetUser.role,
        tenantId: data.targetUser.tenantId ?? null,
      }));

      await impersonate(target.uid);
      window.location.href = redirectPath || getRedirectForRole(target.role);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setWorking(null);
    }
  }

  const activeTenants = tenants.filter((tenant) => tenant.status === "active").length;
  const suspendedTenants = tenants.filter((tenant) => tenant.status === "suspended").length;
  const totalUsers = tenants.reduce((acc, tenant) => acc + (tenant.usersCount ?? 0), 0);
  const latestActivity = useMemo(() => {
    const values = tenants.map((tenant) => tenant.lastActivityAt).filter(Boolean) as string[];
    return values.sort((a, b) => b.localeCompare(a))[0] ?? null;
  }, [tenants]);

  const firmUsers = (detail?.users ?? []).filter((userRow) => !["cliente", "cliente_final"].includes(userRow.role));
  const clientUsers = (detail?.users ?? []).filter((userRow) => ["cliente", "cliente_final"].includes(userRow.role));
  const ownerUser = firmUsers.find((userRow) => userRow.role === "owner_firm") || firmUsers[0] || null;
  const demoClientUser = clientUsers[0] || null;

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Super Admin · Soporte</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">Centro de soporte ejecutivo</h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-neutral-600">
              Revisa tenants, usuarios, estados, impersonacion y actividad reciente para soporte operativo.
            </p>
          </div>
          <Button onClick={() => void loadTenants()} className="rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800">
            <RefreshCcw className="mr-2 h-4 w-4" /> Refrescar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Tenants activos</p><p className="mt-2 text-3xl font-semibold tracking-tight">{activeTenants}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Tenants suspendidos</p><p className="mt-2 text-3xl font-semibold tracking-tight">{suspendedTenants}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Usuarios totales</p><p className="mt-2 text-3xl font-semibold tracking-tight">{totalUsers}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Ultima actividad</p><p className="mt-2 text-sm font-semibold tracking-tight">{formatDate(latestActivity)}</p></div>
      </div>

      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_220px_auto]">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tenant, owner, email o plan" className="h-12 rounded-2xl border-neutral-200 pl-9" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value as TenantStatusFilter)} className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none">
            <option value="todos">Todos</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </select>
          <Button onClick={() => void loadTenants()} className="h-12 rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800">Aplicar filtros</Button>
        </div>

        {message ? <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">{message}</div> : null}

        <div className="mt-6 overflow-x-auto rounded-[28px] border border-neutral-200 bg-white">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {["Tenant", "Estado", "Usuarios", "Clientes", "Causas", "Plan", "Ultima actividad", "Abrir"].map((head) => (
                  <th key={head} className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-left font-medium text-neutral-600">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-500"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />Cargando tenants...</td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-500">No hay tenants para los filtros actuales.</td></tr>
              ) : (
                tenants.map((row) => (
                  <tr key={row.id} className="odd:bg-white even:bg-neutral-50/50">
                    <td className="border-b border-neutral-100 px-4 py-3 font-semibold text-neutral-900">{row.name}</td>
                    <td className="border-b border-neutral-100 px-4 py-3">{row.status}</td>
                    <td className="border-b border-neutral-100 px-4 py-3">{row.usersCount ?? 0}</td>
                    <td className="border-b border-neutral-100 px-4 py-3">{row.clientsCount ?? 0}</td>
                    <td className="border-b border-neutral-100 px-4 py-3">{row.casesCount ?? 0}</td>
                    <td className="border-b border-neutral-100 px-4 py-3">{row.plan ?? "Sin plan"}</td>
                    <td className="border-b border-neutral-100 px-4 py-3">{formatDate(row.lastActivityAt)}</td>
                    <td className="border-b border-neutral-100 px-4 py-3"><Button onClick={() => void loadTenantDetail(row.id)} className="rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800">Abrir</Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail?.tenant ? (
        <div className="space-y-6">
          <div className="rounded-[32px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">Detalle del tenant seleccionado</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Tenant</p><p className="mt-2 text-base font-semibold">{detail.tenant.name}</p></div>
              <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Owner</p><p className="mt-2 text-base font-semibold">{detail.tenant.ownerName ?? "Sin owner"}</p></div>
              <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Plan</p><p className="mt-2 text-base font-semibold">{detail.tenant.plan ?? "Sin plan"}</p></div>
              <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Estado</p><p className="mt-2 text-base font-semibold">{detail.tenant.status}</p></div>
              <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Actividad</p><p className="mt-2 text-base font-semibold">{formatDate(detail.tenant.lastActivityAt)}</p></div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button disabled={working !== null} onClick={() => void toggleTenantStatus("active")} className="rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800"><ShieldCheck className="mr-2 h-4 w-4" /> Activar tenant</Button>
              <Button disabled={working !== null} variant="outline" onClick={() => void toggleTenantStatus("suspended")} className="rounded-2xl border-neutral-200"><Power className="mr-2 h-4 w-4" /> Suspender tenant</Button>
              <Button disabled={!ownerUser || working !== null} variant="outline" onClick={() => ownerUser && void impersonateUser(ownerUser, "/firm/agenda")} className="rounded-2xl border-neutral-200"><CalendarDays className="mr-2 h-4 w-4" /> Abrir agenda del tenant</Button>
              <Button disabled={!ownerUser || working !== null} variant="outline" onClick={() => ownerUser && void impersonateUser(ownerUser, "/firm/causas")} className="rounded-2xl border-neutral-200"><Briefcase className="mr-2 h-4 w-4" /> Abrir causas</Button>
              <Button disabled={!demoClientUser || working !== null} variant="outline" onClick={() => demoClientUser && void impersonateUser(demoClientUser, "/cliente/causas")} className="rounded-2xl border-neutral-200"><Building2 className="mr-2 h-4 w-4" /> Abrir portal cliente</Button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-[32px] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight">Usuarios del tenant</h2>
                <div className="mt-6 overflow-x-auto rounded-[28px] border border-neutral-200 bg-white">
                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr>
                        {["Nombre", "Email", "Rol", "Estado", "Creacion", "Acciones"].map((head) => (
                          <th key={head} className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-left font-medium text-neutral-600">{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.users.map((userRow) => (
                        <tr key={userRow.uid} className="odd:bg-white even:bg-neutral-50/50">
                          <td className="border-b border-neutral-100 px-4 py-3 font-semibold text-neutral-900">{userRow.name ?? "Sin nombre"}</td>
                          <td className="border-b border-neutral-100 px-4 py-3">{userRow.email}</td>
                          <td className="border-b border-neutral-100 px-4 py-3">{userRow.role}</td>
                          <td className="border-b border-neutral-100 px-4 py-3">{userRow.status}</td>
                          <td className="border-b border-neutral-100 px-4 py-3">{formatDate(userRow.createdAt)}</td>
                          <td className="border-b border-neutral-100 px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button disabled={working !== null} variant="outline" onClick={() => void toggleUserStatus(userRow.uid, "active")} className="rounded-2xl border-neutral-200">Activar</Button>
                              <Button disabled={working !== null} variant="outline" onClick={() => void toggleUserStatus(userRow.uid, "suspended")} className="rounded-2xl border-neutral-200">Suspender</Button>
                              <Button disabled={working !== null} onClick={() => void impersonateUser(userRow)} className="rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800"><Eye className="mr-2 h-4 w-4" /> Impersonar</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight">Acciones rapidas</h2>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <Button disabled={!ownerUser || working !== null} variant="outline" onClick={() => ownerUser && void impersonateUser(ownerUser, "/firm")} className="rounded-2xl border-neutral-200"><UserRound className="mr-2 h-4 w-4" /> Ver owner</Button>
                  <Button disabled={!demoClientUser || working !== null} variant="outline" onClick={() => demoClientUser && void impersonateUser(demoClientUser, "/cliente/citas")} className="rounded-2xl border-neutral-200"><Users className="mr-2 h-4 w-4" /> Ver cliente</Button>
                </div>
              </div>

              <div className="rounded-[32px] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight">Actividad reciente</h2>
                <div className="mt-6 space-y-4">
                  {detail.logs.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-500">No hay actividad reciente registrada.</div>
                  ) : (
                    detail.logs.map((log: AuditLogRecord) => (
                      <div key={log.id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-sm text-neutral-500">{formatDate(log.timestamp)}</p>
                        <h3 className="mt-1 text-base font-semibold text-neutral-950">{log.action_type}</h3>
                        <p className="mt-1 text-sm text-neutral-600">{log.entity_type} · {log.entity_id}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
