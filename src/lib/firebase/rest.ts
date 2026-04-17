const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "sosercom-cb383";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      const data = (await res.json()) as { access_token: string };
      return data.access_token;
    }
  } catch {
    // Local development can run without ADC; production Cloud Run provides it.
  }

  return null;
}

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === "object") {
    const fields: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      fields[key] = toFirestoreValue(nestedValue);
    }
    return { mapValue: { fields } };
  }

  return { nullValue: null };
}

function fromFirestoreValue(value: any): unknown {
  if (!value || typeof value !== "object") return null;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("stringValue" in value) return value.stringValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) {
    const values = value.arrayValue.values ?? [];
    return values.map(fromFirestoreValue);
  }
  if ("mapValue" in value) {
    return fromFirestoreFields(value.mapValue.fields ?? {});
  }
  return null;
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    data[key] = fromFirestoreValue(value);
  }
  return data;
}

function toFields(data: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

async function firestoreFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${FIRESTORE_BASE}${path}`, {
    ...init,
    headers,
  });
}

export async function getFirestoreDocREST<T extends Record<string, unknown>>(
  collection: string,
  docId: string
): Promise<T | null> {
  const response = await firestoreFetch(`/${collection}/${docId}`);

  if (response.status === 404) return null;
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firestore REST get failed: ${err}`);
  }

  const body = await response.json();
  return fromFirestoreFields(body.fields ?? {}) as T;
}

export async function setFirestoreDocREST(
  collection: string,
  docId: string,
  data: Record<string, unknown>
) {
  const updateMask = Object.keys(data)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join("&");
  const path = `/${collection}/${docId}${updateMask ? `?${updateMask}` : ""}`;

  const response = await firestoreFetch(path, {
    method: "PATCH",
    body: JSON.stringify({ fields: toFields(data) }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firestore REST patch failed: ${err}`);
  }

  return response.json();
}

export async function addFirestoreDocREST(
  collection: string,
  data: Record<string, unknown>
) {
  const docId = crypto.randomUUID();
  await setFirestoreDocREST(collection, docId, data);
  return docId;
}

export async function queryFirestoreEqualsREST<T extends Record<string, unknown>>(
  collection: string,
  field: string,
  value: unknown,
  orderBy?: { field: string; direction: "ASCENDING" | "DESCENDING" }
): Promise<Array<T & { id: string }>> {
  const response = await firestoreFetch(":runQuery", {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: "EQUAL",
            value: toFirestoreValue(value),
          },
        },
        ...(orderBy
          ? {
              orderBy: [
                {
                  field: { fieldPath: orderBy.field },
                  direction: orderBy.direction,
                },
              ],
            }
          : {}),
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firestore REST query failed: ${err}`);
  }

  const rows = (await response.json()) as Array<{
    document?: { name: string; fields?: Record<string, any> };
  }>;

  return rows
    .filter((row) => row.document)
    .map((row) => {
      const document = row.document!;
      const id = document.name.split("/").pop() ?? "";
      return { id, ...fromFirestoreFields(document.fields ?? {}) } as T & { id: string };
    });
}
