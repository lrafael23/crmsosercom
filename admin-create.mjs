import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';

let app;

// Intentar inicializar con ADC. Si falla, el entorno no está logueado como gcloud,
// pero el cliente firebase sí está listo para usar con la web API.
try {
  app = initializeApp({
    credential: applicationDefault(),
    projectId: "sosercom-cb383"
  });
} catch (e) {
  console.error("No se pudo iniciar Admin SDK de forma nativa:", e.message);
  process.exit(1);
}

const db = getFirestore(app);
const auth = getAuth(app);

async function injectSuperAdmin() {
  const email = "rafa123@sosercom.com";
  const password = "rafa123";
  let uid;

  try {
    try {
      const u = await auth.getUserByEmail(email);
      uid = u.uid;
      console.log("Usuario existente, UID:", uid);
    } catch(e) {
      const created = await auth.createUser({
        email: email,
        password: password,
        displayName: "Rafael (Super Admin)"
      });
      uid = created.uid;
      console.log("Usuario creado vía admin Auth, UID:", uid);
    }
  } catch (e) {
      console.error(e);
      process.exit(1);
  }

  try {
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
      email: email,
      displayName: "Rafael (Super Admin)",
      role: "super_admin_global",
      status: "active",
      tenantId: "global",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uid: uid
    }, { merge: true });
    
    console.log("¡SUPERADMIN rafa123 INYECTADO CORRECTAMENTE a Firestore (Admin SDK)!");
    process.exit(0);
  } catch(e) {
      console.error("Error Firestore Admin:", e);
      process.exit(1);
  }
}

injectSuperAdmin();
