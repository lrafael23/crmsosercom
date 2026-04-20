type FirestoreValue =
  | { nullValue: null }
  | { stringValue: string }
  | { booleanValue: boolean }
  | { doubleValue: number }
  | { integerValue: string }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

export function projectId() {
  const id = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!id) throw new Error("Missing Firebase project id");
  return id;
}

export function databaseRoot() {
  return `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents`;
}

export function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toFirestoreValue(item)])) } };
  }
  return { stringValue: String(value) };
}

export function toFirestoreFields(data: Record<string, unknown>) {
  return { fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)])) };
}

export function fromFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("doubleValue" in value) return value.doubleValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in value) return fromFirestoreFields(value.mapValue.fields || {});
  return undefined;
}

export function fromFirestoreFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

export function bearerFromRequest(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
}

export async function requireFirebaseUser(request: Request) {
  const token = bearerFromRequest(request);
  if (!token) return null;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const account = data.users?.[0];
  return account ? { uid: String(account.localId), email: account.email as string | undefined, token } : null;
}

export async function firestoreFetch(pathOrUrl: string, token: string, init?: RequestInit) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${databaseRoot()}/${pathOrUrl}`;
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return null;
  return response.json();
}

export async function createDocument(collectionName: string, id: string, data: Record<string, unknown>, token: string) {
  return firestoreFetch(`${collectionName}?documentId=${encodeURIComponent(id)}`, token, {
    method: "POST",
    body: JSON.stringify(toFirestoreFields(data)),
  });
}

export async function upsertDocument(collectionName: string, id: string, data: Record<string, unknown>, token: string) {
  return firestoreFetch(`${collectionName}/${encodeURIComponent(id)}`, token, {
    method: "PATCH",
    body: JSON.stringify(toFirestoreFields(data)),
  });
}

export async function patchDocument(collectionName: string, id: string, patch: Record<string, unknown>, token: string) {
  const mask = Object.keys(patch).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join("&");
  return firestoreFetch(`${collectionName}/${encodeURIComponent(id)}?${mask}`, token, {
    method: "PATCH",
    body: JSON.stringify(toFirestoreFields(patch)),
  });
}

export async function runQuery(collectionName: string, filters: Array<{ field: string; op?: string; value: unknown }>, token: string) {
  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId: collectionName }],
  };

  if (filters.length === 1) {
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: filters[0].field },
        op: filters[0].op || "EQUAL",
        value: toFirestoreValue(filters[0].value),
      },
    };
  } else if (filters.length > 1) {
    structuredQuery.where = {
      compositeFilter: {
        op: "AND",
        filters: filters.map((filter) => ({
          fieldFilter: {
            field: { fieldPath: filter.field },
            op: filter.op || "EQUAL",
            value: toFirestoreValue(filter.value),
          },
        })),
      },
    };
  }

  const response = await firestoreFetch(`${databaseRoot()}:runQuery`, token, {
    method: "POST",
    body: JSON.stringify({ structuredQuery }),
  });
  return (response as Array<{ document?: { name: string; fields: Record<string, FirestoreValue> } }>)
    .filter((row) => row.document)
    .map((row) => ({ id: String(row.document!.name.split("/").pop()), ...fromFirestoreFields(row.document!.fields) }));
}
