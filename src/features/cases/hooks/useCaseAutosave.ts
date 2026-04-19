"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/lib/firebase/client";
import type { CaseRecord } from "@/features/cases/types";

type SaveState = "idle" | "saving" | "saved" | "error" | "offline" | "pending_sync";

interface Props {
  caseId: string;
  tenantId: string;
  actorId: string;
  value: Partial<CaseRecord>;
  enabled?: boolean;
}

const AUTOSAVE_MS = 60_000;

export function useCaseAutosave({ caseId, tenantId, actorId, value, enabled = true }: Props) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const previousJson = useRef("");
  const storageKey = useMemo(() => `case-draft:${tenantId}:${caseId}`, [tenantId, caseId]);

  const persistRemote = useCallback(async (patch: Partial<CaseRecord>) => {
    setSaveState("saving");
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("No auth token");

    const res = await fetch(`/api/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tenantId, actorId, patch }),
    });

    if (!res.ok) throw new Error("No se pudo guardar");

    localStorage.removeItem(storageKey);
    setHasLocalDraft(false);
    setSaveState("saved");
    setLastSavedAt(new Date().toISOString());
  }, [actorId, caseId, storageKey, tenantId]);

  const saveNow = useCallback(async () => {
    const json = JSON.stringify(value);
    if (json === previousJson.current) return;
    previousJson.current = json;

    if (!navigator.onLine) {
      localStorage.setItem(storageKey, json);
      setHasLocalDraft(true);
      setSaveState("offline");
      return;
    }

    try {
      await persistRemote(value);
    } catch {
      localStorage.setItem(storageKey, json);
      setHasLocalDraft(true);
      setSaveState("pending_sync");
    }
  }, [persistRemote, storageKey, value]);

  useEffect(() => {
    const existing = localStorage.getItem(storageKey);
    setHasLocalDraft(!!existing);
    if (existing && navigator.onLine) {
      const parsed = JSON.parse(existing) as Partial<CaseRecord>;
      persistRemote(parsed).catch(() => setSaveState("pending_sync"));
    }
  }, [persistRemote, storageKey]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      void saveNow();
    }, AUTOSAVE_MS);
    return () => window.clearInterval(timer);
  }, [enabled, saveNow]);

  useEffect(() => {
    function onOnline() {
      const existing = localStorage.getItem(storageKey);
      if (!existing) return;
      const parsed = JSON.parse(existing) as Partial<CaseRecord>;
      void persistRemote(parsed).catch(() => setSaveState("pending_sync"));
    }

    function onOffline() {
      setSaveState("offline");
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [persistRemote, storageKey]);

  return { saveState, lastSavedAt, saveNow, hasLocalDraft };
}
