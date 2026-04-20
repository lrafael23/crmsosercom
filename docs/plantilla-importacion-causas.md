# Plantilla oficial de importacion de causas

Archivo disponible:

- `/templates/plantilla-importacion-causas.xlsx`
- `/templates/plantilla-importacion-causas.csv`

Columnas esperadas por el importador:

| Columna | Obligatoria | Descripcion |
| --- | --- | --- |
| `clientId` o `clienteId` | Recomendada | ID interno del cliente. Si no existe, se usa un ID demo/importado. |
| `clientName` o `clienteNombre` o `Cliente` | Si | Nombre del cliente o empresa. |
| `title` o `titulo` o `Causa` | Si | Titulo/caratula de la causa. |
| `category` o `materia` o `Materia` | Si | Materia general: Judicial, Civil, Laboral, Administrativo, etc. |
| `type` o `tipo` | Si | Tipo de causa: Cobro ejecutivo, familia, laboral, contractual, etc. |
| `procedure` o `procedimiento` | Si | Procedimiento: Ejecutivo, Ordinario, Gestion extrajudicial, etc. |
| `description` o `descripcion` o `Comentarios` | No | Comentarios o resumen operativo. |
| `status` o `estado` | No | `active`, `pending`, `in_progress`, `waiting_client`, `hearing`, `closed`, `archived`. |
| `stage` o `etapa` | No | `intake`, `analysis`, `documents`, `drafting`, `filing`, `hearing`, `resolution`, `closed`. |
| `assignedTo` o `responsableId` | Recomendada | UID del abogado/responsable. |
| `assignedToName` o `responsableNombre` | Si | Nombre del responsable. |
| `lastAction` o `ultimaAccion` | No | Ultima accion registrada. |
| `pendingBalance` o `saldoPendiente` | No | Saldo pendiente en CLP, solo numero. |
| `trackedMinutes` o `minutosAcumulados` | No | Minutos acumulados. |
| `nextDeadline` o `proximoPlazo` | No | Fecha `YYYY-MM-DD`. |
| `visibleToClient` o `visibleCliente` | No | `true` o `false`. |
| `priority` o `prioridad` | No | `low`, `medium`, `high`, `critical`. |

Notas:

- El importador evita romper si falta una columna no obligatoria: completa valores por defecto.
- Para demo, puedes usar el boton `Importar Excel` en `/firm/causas`.
- Para poblar datos demo reales usa `POST /api/demo/seed` autenticado como admin.
