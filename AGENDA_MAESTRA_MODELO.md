# Agenda Maestra - Modelo y QA

## Rutas implementadas

- `/firm/agenda`: vista operativa para owner_firm, abogado, contador, tributario y staff.
- `/admin/agenda`: vista operativa para admin Sosercom y perfiles internos autorizados.
- `/super-admin/agenda`: vista global para super_admin_global.
- `/cliente/citas`: vista cliente sobre la misma Agenda Maestra, limitada a eventos visibles del cliente.
- `/api/agenda/events`: Route Handler compatible con Vercel para CRUD server-side via token Firebase del usuario.
- `/api/agenda/notify`: Route Handler compatible con Vercel para cola de notificaciones y envio por Resend cuando `RESEND_API_KEY` existe.

## Colecciones Firestore

### `agenda_events`

Campos principales:

- `id`
- `tenantId`
- `companyId`
- `caseId`
- `clientId`
- `clientName`
- `clientEmail`
- `createdBy`
- `assignedTo`
- `assignedToName`
- `assignedToEmail`
- `title`
- `description`
- `type`: `audiencia`, `videollamada`, `tarea`, `plazo`, `cobro`, `tramite`, `reunion_interna`, `recordatorio_cliente`
- `status`: `pendiente`, `en_proceso`, `cumplido`, `critico`, `cancelado`, `reprogramado`
- `priority`: `baja`, `media`, `alta`, `critica`
- `day`
- `date`
- `startAt`
- `endAt`
- `timezone`
- `location`
- `meetingUrl`
- `notifyClient`
- `notifyAssignee`
- `emailNotificationStatus`
- `reminderAt`
- `linkedBillingId`
- `linkedDeadlineId`
- `linkedWorkflowStepId`
- `createdAt`
- `updatedAt`

### `lawyer_availability`

- `lawyerId`
- `tenantId`
- `weeklyAvailability`
- `bufferMinutes`
- `blockedDates`
- `meetingQuota`
- `updatedAt`

### `agenda_reminders`

- `eventId`
- `scheduledFor`
- `recipientUserId`
- `recipientEmail`
- `status`
- `channel`
- `payload`
- `createdAt`

### `agenda_activity_logs`

- `eventId`
- `action`
- `actorId`
- `actorRole`
- `oldValue`
- `newValue`
- `createdAt`

### `notification_queue`

- `type`
- `recipient`
- `subject`
- `payload`
- `status`
- `retries`
- `createdAt`
- `createdBy`

### `audit_logs`

La Agenda Maestra escribe auditoria general para acciones realizadas desde el cliente: crear, editar, eliminar, duplicar, cambiar estado, reasignar y enviar correo.

## Permisos implementados

- `super_admin_global`: lee y opera globalmente.
- `admin`: lee y opera globalmente desde `/admin/agenda`.
- `owner_firm`: lee y opera eventos de su tenant.
- `abogado`, `contador`, `tributario`, `staff`: leen eventos del tenant y editan eventos propios, creados o asignados.
- `cliente_final` / `cliente`: ve solo eventos con `clientId == uid` y `notifyClient == true`; puede crear videollamadas o recordatorios cliente.

## Relaciones operativas

- Causas: `caseId` permite abrir ficha y mantener contexto.
- Clientes: `clientId`, `clientName`, `clientEmail` permiten visibilidad cliente y notificaciones.
- Responsables: `assignedTo`, `assignedToName`, `assignedToEmail` permiten filtros, reasignacion y correos.
- Cobros: `linkedBillingId` permite enlazar con payment_orders, payments o billing_events.
- Plazos: `linkedDeadlineId` permite enlazar vencimientos.
- Workflow: `linkedWorkflowStepId` permite enlazar hitos de causa.
- Videollamadas: `meetingUrl` guarda el enlace Meet configurado.

## Checklist QA

- Abrir `/firm/agenda` con abogado/owner_firm.
- Abrir `/admin/agenda` con admin.
- Abrir `/super-admin/agenda` con super_admin_global.
- Abrir `/cliente/citas` con cliente y validar que no puede editar agenda interna.
- Crear evento desde boton principal.
- Crear evento desde dia vacio.
- Crear tarea, audiencia, videollamada y cobro desde shortcuts.
- Editar titulo, descripcion, responsable, cliente, tipo, estado, fecha y hora.
- Eliminar evento y confirmar que desaparece.
- Duplicar evento y confirmar estado `pendiente`.
- Buscar por texto, cliente o responsable.
- Filtrar por responsable, tipo y estado.
- Click en evento: debe actualizar detalle inferior.
- Reasignar responsable desde detalle.
- Marcar avance: `pendiente -> en_proceso -> cumplido`.
- Enviar correo: con `RESEND_API_KEY` debe enviar; sin key debe dejar registro en `notification_queue`.
- Validar que `agenda_activity_logs` registra acciones.
- Validar que `audit_logs` registra acciones generales.

## Validacion realizada

- `npx tsc --noEmit --pretty false`: OK.
- `npm run build`: OK.
- `firebase deploy --only firestore:rules --project sosercom-cb383`: OK.
- Seed demo: 6 eventos operativos creados en `agenda_events` y disponibilidad base en `lawyer_availability`.
