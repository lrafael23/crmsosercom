/**
 * seed-auth-only.mjs
 * Solo crea/verifica usuarios en Firebase Authentication.
 * (Firestore se pobla por separado via Admin SDK / MCP)
 *
 * Uso: node seed-auth-only.mjs
 */

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

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

const USERS = [
  { email: "superadmin@gmail.com",    password: "superadmin123",  role: "super_admin_global" },
  { email: "admin@sosercom.cl",       password: "Admin123!",      role: "admin"              },
  { email: "abogado@sosercom.cl",     password: "Abogado123!",    role: "abogado"            },
  { email: "contador@sosercom.cl",    password: "Contador123!",   role: "contador"           },
  { email: "tributario@sosercom.cl",  password: "Tributario123!", role: "tributario"         },
  { email: "staff@sosercom.cl",       password: "Staff123!",      role: "staff"              },
  { email: "cliente@empresademo.cl",  password: "Cliente123!",    role: "cliente"            },
];

async function seedAuth() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   Portal 360 — Creando Usuarios en Firebase Auth ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const created = [];

  for (const u of USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      console.log(`✅ [${u.role}] Creado: ${u.email} → UID: ${cred.user.uid}`);
      created.push({ ...u, uid: cred.user.uid, action: "CREADO" });
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        // Iniciar sesión para obtener el UID
        try {
          const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
          console.log(`🔄 [${u.role}] Ya existía: ${u.email} → UID: ${cred.user.uid}`);
          created.push({ ...u, uid: cred.user.uid, action: "YA EXISTÍA" });
        } catch (loginErr) {
          console.log(`⚠️  [${u.role}] ${u.email} ya existe pero la contraseña puede ser diferente.`);
          created.push({ ...u, uid: "VERIFICAR", action: "CONTRASEÑA diff" });
        }
      } else {
        console.error(`❌ [${u.role}] Error al crear ${u.email}: ${err.message}`);
        created.push({ ...u, uid: "ERROR", action: err.message });
      }
    }
  }

  console.log("\n\n╔═══════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                           USUARIOS CREADOS — RESUMEN                            ║");
  console.log("╠══════════════════════╦══════════════════════════════╦══════════════════════════╣");
  console.log("║ ROL                  ║ EMAIL                        ║ UID                      ║");
  console.log("╠══════════════════════╬══════════════════════════════╬══════════════════════════╣");
  for (const u of created) {
    console.log(`║ ${u.role.padEnd(20)} ║ ${u.email.padEnd(28)} ║ ${u.uid.padEnd(24)} ║`);
  }
  console.log("╚══════════════════════╩══════════════════════════════╩══════════════════════════╝\n");

  process.exit(0);
}

seedAuth().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
