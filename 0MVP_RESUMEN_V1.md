# Resumen 0MVP Versión 1 - Portal 360

Este documento sintetiza la arquitectura, módulos y jerarquías desplegadas en la Versión 1 (0MVP) de tu plataforma SaaS de servicios jurídicos, contables y tributarios.

## 1. Arquitectura y Stack
- **Frontend / Framework:** Next.js 15 (App Router). Configurado para generar un sitio 100% estático superrápido.
- **UI y Diseño:** Tailwind CSS y shadcn/ui. Sistema de modo oscuro nativo, estilización premium y minimalista (vistas limpias, estado vacío elegante, tipografía corporativa).
- **Control de Acceso / Base de Datos:** Firebase v10 (Authentication & Firestore). Integración activa real en variables de entorno.
- **Hosting:** Firebase Hosting (optimizador de URL activado para SEO y enlaces directos).

## 2. Modelado de Roles
El portal está blindado con Role-Based Access Control (RBAC). El menú lateral se adapta inteligentemente a 4 perfiles:
1. **Cliente (`cliente`):** Solo ve el portal "Mi Panel" y acceso a sus documentos. (Filtrados por su ID de empresa).
2. **Staff (`staff`):** Miembros de tu equipo operativo. Ven el portal y además la zona de "Administración".
3. **Administrador Interno (`admin_interno`):** Administradores del negocio que lideran al Staff.
4. **Super Admin Global (`super_admin_global`):** Acceso total sin restricciones a la suite ejecutiva. (Único rol con acceso a `/super-admin*`).

*Nota: La sesión actual se maneja globalmente. Si el usuario pierde sesión, es expulsado y retornado a la Landing Page/Login protegida (Layout Interceptor `ProtectedRoute`).*

## 3. Inventario Exacto de Pantallas (100% Disponibles y Sin Fallos 404)

### Plataforma Comercial
| Ruta | Descripción |
| :--- | :--- |
| `/` | Landing page pública, de corte profesional y con call-to-actions de conversión y marketing. |
| `/login` | Pasarela de validación segura conectada al motor de Firebase Auth. |

### Mi Panel (Uso de Clientes y Equipo Operativo)
| Ruta | Descripción |
| :--- | :--- |
| `/dashboard` | Resumen general visual con KPIs (Honorarios, tramos, estatus). |
| `/dashboard/documentos` | Gestor documental tipo Drive para la empresa. |
| `/dashboard/tramites` | Tabla de estados de trámites cruzados (Aprobado, En Revisión). |
| `/dashboard/tickets` | Módulo estilo mesa de ayuda para separar requerimientos Legales de Contables. |
| `/dashboard/pagos` | Cuentas, facturación mensual y control de saldos del plan de honorarios. |
| `/dashboard/impuestos` | Reporte predictivo tributario anual y mensual (Ej: Simulación F29). |

### Administración (Uso del Staff Contable/Jurídico)
| Ruta | Descripción |
| :--- | :--- |
| `/admin` | Main placeholder del layout administrador. |
| `/admin/clientes` | Catálogo centralizado para ver y abrir carpetas de tus clientes/empresas actuales. |
| `/admin/leads` | Sistema comercial tipo CRM básico para atrapar las cotizaciones o agendamientos a cierre. |
| `/admin/configuracion` | Herramientas como crear servicios predeterminados (Ej: Plan Pyme, Asesoría Especial), e invitaciones. |

### Dashboards Ejecutivos Diestros (Exclusivo Super Admin)
| Ruta | Descripción |
| :--- | :--- |
| `/super-admin/operacion` | Vista de cuellos de botella macro. |
| `/super-admin/clientes` | Analítica y monitoreo de satisfacción o recesión de cuentas clave. |
| `/super-admin/ventas` | Resumen de los "Leads" convertidos hacia "Clientes". |
| `/super-admin/equipo` | Control de cargas de las personas internas de la firma. |
| `/super-admin/auditoria` | Integrado REAL con `audit_logs` en Firebase; ve quién entra, qué visualiza y qué edita de forma inmutable. |
| `/super-admin/finanzas` | Proyección de facturación global P&L. |

## 4. Estado Actual para el "Go-live"

Todo el front-end ha sido compilado como estático (`output: export`) usando la versión Next.js 15 y distribuido a los nodos de Google mediante `firebase deploy`.
Se rectificó la regla interna de **CleanUrls** posibilitando un salto libre a cada pantalla en el navegador sin problemas técnicos, dejando en tus manos las 18 pantallas de arquitectura sólidas.

### Próxima Fase (Fase 2 Comercial)
1. Conectar tu panel Super Admin / Admin para que en lugar de usar comandos para poblar base de datos, exista un panel de control con base de datos React (CRUD Formulario) que cree usuarios y companies directo.
2. Hacer dinámicas las tablas actualmente "UI-mockups" para interactuar sobre Firestore bidireccionalmente.
