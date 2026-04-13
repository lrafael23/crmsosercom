# Portal 360 Jurídico, Contable y Tributario - 0MVP

Plataforma SaaS web para empresas de servicios jurídicos, contables y tributarios.
Construida con Next.js 15, Tailwind CSS, shadcn/ui y Firebase.

## Instalación Local

1. Clonar o descargar este repositorio.
2. Ejecutar `npm install` para instalar todas las dependencias.
3. Crear un archivo `.env.local` en la raíz del proyecto basado en `.env.example`:
   
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="tu-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-auth-domain"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu-storage-bucket"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="tu-messaging-sender"
   NEXT_PUBLIC_FIREBASE_APP_ID="tu-app-id"
   ```

4. Iniciar el servidor local: `npm run dev`
5. El proyecto estará disponible en `http://localhost:3000`

## Despliegue en Firebase Hosting

Este proyecto está configurado para Next.js con soporte de Firebase Hosting App Hosting o WebFrameworks.

1. Instala Firebase CLI: `npm install -g firebase-tools`
2. Inicia sesión en Firebase: `firebase login`
3. Selecciona el proyecto: `firebase use <PROJECT_ID>`
4. Despliega la aplicación web: `firebase deploy --only hosting`

## Poblado de Datos (Seed Demo)

Debido a que el 0MVP no cuenta con un backend en Node (Admin SDK validado con Service Account Local) ni panel admin complejo inicializado, para cargar los usuarios sugeridos:

1. Ve a tu consola de **Firebase > Authentication** y habilita "Correo/Contraseña".
2. Crea manualmente los 4 usuarios (admin, staff, cliente, superadmin) con las contraseñas deseadas.
3. Copia sus `uid` generados.
4. Ve a **Firebase > Firestore Database** y crea en la colección `users` un documento por cada `uid` copiando la estructura:

```json
{
  "uid": "el-uid-del-auth",
  "email": "superadmin@gmail.com",
  "role": "super_admin_global",
  "isActive": true
}
```

(Variar de roles entre `admin_interno`, `cliente`, `staff`).

Para la colección `companies`, se pueden crear documentos dummy de la misma forma para enlazarlos usando `companyId` del usuario cliente.

## Estructura del Proyecto

*   `src/app/` - Rutas de UI App Router de Next.js.
*   `src/components/` - Componentes React reutilizables y UI principal (shadcn).
*   `src/lib/` - Configuración de Firebase y utilidades globales.
*   `src/lib/firebase/audit.ts` - Helper centralizado de registro para logs de auditoría requeridos.
