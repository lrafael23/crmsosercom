# Handoff siguiente sesion

## Estado actual

La jerarquia multi-tenant ya fue implementada en frontend y backend logico local:

- `super_admin_global` controla todo.
- `admin` representa al estudio/abogado principal.
- `abogado`, `contador`, `tributario`, `staff` operan dentro del tenant.
- `cliente` queda restringido al portal cliente.
- `pending_validation` y `suspended` ya bloquean acceso con pantalla intermedia.

## Archivos ya modificados

- `src/lib/auth/AuthContext.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/auth/ValidationGuard.tsx`
- `src/app/login/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/dashboard/layout.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/header.tsx`
- `src/app/dashboard/documentos/page.tsx`
- `src/app/super-admin/auditoria/page.tsx`
- `src/components/dashboard-ui.tsx`
- `src/lib/firebase/audit.ts`
- `firestore.rules`
- `seed.js`

## Validaciones ya ejecutadas

- `npm run build` -> correcto
- `npm run lint` -> sin errores, quedan solo warnings heredados:
  - `src/app/admin/leads/page.tsx`
  - `src/app/dashboard/tramites/page.tsx`

## Bloqueo actual

No se pudo desplegar Firebase Rules porque este repo no tiene proyecto activo en `.firebaserc`.

Comando fallido:

```bash
firebase deploy --only firestore:rules
```

Error recibido:

- `No currently active project`

## Lo siguiente que hay que hacer

### 1. Desplegar reglas de Firestore

Tener a mano el `projectId` real de Firebase y ejecutar:

```bash
firebase deploy --only firestore:rules --project TU_PROJECT_ID
```

Opcionalmente dejarlo persistido en el repo:

```bash
firebase use --add
```

Luego verificar `.firebaserc`.

### 2. Actualizar datos reales en Firebase Auth / Firestore

Revisar documentos `users/{uid}` y normalizar:

- reemplazar `admin_interno` por `admin`
- asegurar campo `status` en todos los usuarios
- asegurar `tenantId` correcto para admins, equipo y clientes
- asegurar `companyId` en clientes
- opcional: agregar `createdBy` y `validatedBy`

Modelo recomendado por usuario:

```json
{
  "uid": "auth-uid",
  "email": "usuario@dominio.com",
  "displayName": "Nombre Apellido",
  "role": "admin",
  "status": "active",
  "tenantId": "tenant-estudio-001",
  "companyId": null,
  "department": "juridico",
  "createdBy": "uid-creador",
  "validatedBy": "uid-validador"
}
```

Ejemplo para cliente:

```json
{
  "uid": "auth-uid",
  "email": "cliente@empresa.com",
  "displayName": "Cliente Final",
  "role": "cliente",
  "status": "active",
  "tenantId": "tenant-estudio-001",
  "companyId": "company-001",
  "department": null,
  "createdBy": "uid-admin-estudio",
  "validatedBy": "uid-superadmin-o-admin"
}
```

### 3. Probar accesos reales

Validar manualmente estos escenarios:

- `super_admin_global` -> entra a `/super-admin`
- `admin` -> entra a `/admin`
- `abogado` / `contador` / `tributario` / `staff` -> entran a `/admin`
- `cliente` -> entra a `/dashboard`
- cualquier usuario `pending_validation` -> ve la pantalla intermedia
- cualquier usuario `suspended` -> ve la pantalla de suspension
- `cliente` intentando `/admin` -> rebota a `/dashboard`
- `admin` intentando `/dashboard` -> rebota a `/admin`

### 4. Despues hacer commit y push

Revisar estado:

```bash
git status
git diff
```

Commit sugerido:

```bash
git add .
git commit -m "Refactor auth and tenant access hierarchy"
git push origin master
```

## Notas para la nueva sesion

Si abres una nueva sesion, puedes pegar algo como esto:

```text
Revisa `NEXT_SESSION_HANDOFF.md` y continua desde ahi. Ya se implemento la jerarquia multi-tenant en codigo local, falta desplegar `firestore.rules` con el projectId correcto, validar usuarios reales en Firebase y luego hacer commit/push.
```

## Observaciones tecnicas

- `AuthContext` ahora resuelve rutas por rol con `getDefaultRouteForRole`.
- `ProtectedRoute` ya valida sesion, estado y zona.
- `ValidationGuard` ya soporta `pending_validation` y `suspended`.
- `login/page.tsx` ya resuelve el usuario real desde Firestore antes de redirigir.
- `firestore.rules` ya separa permisos para `users`, `companies`, `documents` y `audit_logs`.
- El deploy a Firebase no se hizo todavia.
- El commit y push a GitHub no se hizo todavia.
