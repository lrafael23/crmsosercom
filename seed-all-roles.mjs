/**
 * seed-all-roles.mjs
 * Crea un usuario de prueba por cada rol del sistema Portal 360.
 * Roles: super_admin_global, admin, abogado, contador, tributario, staff, cliente
 * 
 * Uso: node seed-all-roles.mjs
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJIr-cGLKccL2eEiURrjZnZ560Di68NA8",
  authDomain: "sosercom-cb383.firebaseapp.com",
  projectId: "sosercom-cb383",
  storageBucket: "sosercom-cb383.firebasestorage.app",
  messagingSenderId: "976367855256",
  appId: "1:976367855256:web:ceedb13e5c646f0e0992ed",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Mapa completo de roles configurados en el sistema:
 *
 * | Rol                 | Zona                       | Descripción                                    |
 * |---------------------|----------------------------|------------------------------------------------|
 * | super_admin_global  | /super-admin/*             | Control total, sin restricciones               |
 * | admin               | /admin/*                   | Administrador interno del negocio              |
 * | abogado             | /admin/*                   | Staff jurídico especializado                   |
 * | contador            | /admin/*                   | Staff contable especializado                   |
 * | tributario          | /admin/*                   | Staff tributario especializado                 |
 * | staff               | /admin/*                   | Operativo general del equipo                   |
 * | cliente             | /dashboard/*               | Empresa/persona que contrata los servicios     |
 */
const USERS_TO_SEED = [
  {
    email: "superadmin@gmail.com",
    password: "superadmin123",
    displayName: "Super Admin Global",
    role: "super_admin_global",
    status: "active",
    tenantId: "sosercom",
    companyId: null,
    department: null,
    existingUid: "hlLpqxgaFyfTZBwWUsUjeGEHH982", // ya existe, solo actualizar
  },
  {
    email: "admin@sosercom.cl",
    password: "Admin123!",
    displayName: "Diego Morales (Admin)",
    role: "admin",
    status: "active",
    tenantId: "sosercom",
    companyId: null,
    department: "gerencia",
    existingUid: null,
  },
  {
    email: "abogado@sosercom.cl",
    password: "Abogado123!",
    displayName: "Valentina Ríos (Abogada)",
    role: "abogado",
    status: "active",
    tenantId: "sosercom",
    companyId: null,
    department: "juridico",
    existingUid: null,
  },
  {
    email: "contador@sosercom.cl",
    password: "Contador123!",
    displayName: "Rodrigo Paz (Contador)",
    role: "contador",
    status: "active",
    tenantId: "sosercom",
    companyId: null,
    department: "contabilidad",
    existingUid: null,
  },
  {
    email: "tributario@sosercom.cl",
    password: "Tributario123!",
    displayName: "Carolina Fuentes (Tributaria)",
    role: "tributario",
    status: "active",
    tenantId: "sosercom",
    companyId: null,
    department: "tributario",
    existingUid: null,
  },
  {
    email: "staff@sosercom.cl",
    password: "Staff123!",
    displayName: "Andrés Castro (Staff)",
    role: "staff",
    status: "active",
    tenantId: "sosercom",
    companyId: null,
    department: "operaciones",
    existingUid: null,
  },
  {
    email: "cliente@empresademo.cl",
    password: "Cliente123!",
    displayName: "Empresa Demo S.A.",
    role: "cliente",
    status: "active",
    tenantId: "sosercom",
    companyId: "empresa-demo-sa",
    department: null,
    existingUid: null,
  },
];

async function upsertFirestoreUser(uid, userData) {
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      status: userData.status,
      tenantId: userData.tenantId,
      companyId: userData.companyId,
      department: userData.department,
      createdBy: "seed-script",
      validatedBy: "seed-script",
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function seed() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║   Portal 360 — Seed de Usuarios por Rol    ║");
  console.log("╚════════════════════════════════════════════╝\n");

  const results = [];

  for (const userData of USERS_TO_SEED) {
    const tag = `[${userData.role.toUpperCase()}]`;

    try {
      // --- Caso 1: el usuario ya existe en Auth, solo actualizar password y Firestore ---
      if (userData.existingUid) {
        console.log(`${tag} Iniciando sesión como ${userData.email} para actualizar contraseña...`);
        const cred = await signInWithEmailAndPassword(auth, userData.email, userData.password)
          .catch(async () => {
            // Si la contraseña ya no coincide, reconectamos con sign-in 
            return null;
          });

        let uid = userData.existingUid;

        // Actualiza en Firestore con el esquema completo
        await upsertFirestoreUser(uid, userData);

        results.push({ role: userData.role, email: userData.email, uid, action: "actualizado" });
        console.log(`${tag} ✅ Firestore actualizado. UID: ${uid}\n`);
        continue;
      }

      // --- Caso 2: crear usuario nuevo ---
      console.log(`${tag} Creando usuario ${userData.email}...`);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const uid = userCredential.user.uid;

      await upsertFirestoreUser(uid, userData);

      results.push({ role: userData.role, email: userData.email, uid, action: "creado" });
      console.log(`${tag} ✅ Creado con UID: ${uid}\n`);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.log(`${tag} ⚠️  El email ${userData.email} ya existe en Auth. Continuando...\n`);
        results.push({ role: userData.role, email: userData.email, uid: "ya-existía", action: "omitido" });
      } else {
        console.error(`${tag} ❌ Error: ${error.message}\n`);
        results.push({ role: userData.role, email: userData.email, uid: "ERROR", action: error.message });
      }
    }
  }

  // Resumen final
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    RESUMEN DE USUARIOS                      ║");
  console.log("╠══════════════════╦═══════════════════════════╦══════════════╣");
  console.log("║ ROL              ║ EMAIL                     ║ CONTRASEÑA   ║");
  console.log("╠══════════════════╬═══════════════════════════╬══════════════╣");
  
  const credentials = [
    { role: "super_admin_global", email: "superadmin@gmail.com",     pass: "superadmin123"  },
    { role: "admin",              email: "admin@sosercom.cl",         pass: "Admin123!"      },
    { role: "abogado",            email: "abogado@sosercom.cl",       pass: "Abogado123!"    },
    { role: "contador",           email: "contador@sosercom.cl",      pass: "Contador123!"   },
    { role: "tributario",         email: "tributario@sosercom.cl",    pass: "Tributario123!" },
    { role: "staff",              email: "staff@sosercom.cl",         pass: "Staff123!"      },
    { role: "cliente",            email: "cliente@empresademo.cl",    pass: "Cliente123!"    },
  ];

  for (const c of credentials) {
    const status = results.find(r => r.role === c.role);
    const icon = status?.action === "creado" ? "✅" : status?.action === "actualizado" ? "🔄" : "⚠️";
    console.log(`║ ${c.role.padEnd(16)} ║ ${c.email.padEnd(25)} ║ ${c.pass.padEnd(12)} ║ ${icon}`);
  }
  console.log("╚══════════════════╩═══════════════════════════╩══════════════╝\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
