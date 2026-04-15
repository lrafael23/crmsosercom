import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, writeBatch, collection } from "firebase/firestore";
import "dotenv/config";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usersToSeed = [
    { email: "admin@sosercom.com", pass: "admin123", role: "admin", name: "Jefe Admin" },
    { email: "abogado@sosercom.com", pass: "abogado123", role: "abogado", name: "Elena Abogada" },
    { email: "contador@sosercom.com", pass: "contador123", role: "contador", name: "Juan Contador" },
    { email: "tributario@sosercom.com", pass: "trib123", role: "tributario", name: "Pedro Tributario" },
    { email: "staff@sosercom.com", pass: "staff123", role: "staff", name: "Maria Staff" },
    { email: "cliente@empresa1.com", pass: "cliente123", role: "cliente", name: "Eduardo Cliente", companyId: "empresa-1" },
    { email: "cliente@empresa2.com", pass: "cliente123", role: "cliente", name: "Sofia Cliente", companyId: "empresa-2" }
];

const companiesToSeed = [
    { id: "empresa-1", name: "Tech Corp Latam", rut: "76.123.456-7", sector: "Tecnología", tenantId: "tenant-1" },
    { id: "empresa-2", name: "Exporta Todo S.A.", rut: "77.987.654-3", sector: "Import/Export", tenantId: "tenant-1" }
];

const documentsToSeed = [
    { id: "doc-1", title: "Contrato de Prestación de Servicios", type: "legal", companyId: "empresa-1", status: "signed", tenantId: "tenant-1", url: "#" },
    { id: "doc-2", title: "Declaración Mensual F29", type: "tax", companyId: "empresa-1", status: "pending", tenantId: "tenant-1", url: "#" },
    { id: "doc-3", title: "Auditoría Anual 2025", type: "accounting", companyId: "empresa-2", status: "draft", tenantId: "tenant-1", url: "#" }
];

async function seedData() {
    console.log("Iniciando sembrado de datos en Firestore...");
    
    // Primero crear o iniciar sesión a los usuarios
    for(const u of usersToSeed) {
        let uid;
        try {
            const cred = await createUserWithEmailAndPassword(auth, u.email, u.pass);
            uid = cred.user.uid;
            console.log(`[AUTH] Creado: ${u.email} -> ${uid}`);
        } catch(e) {
            if(e.code === 'auth/email-already-in-use') {
                const cred = await signInWithEmailAndPassword(auth, u.email, u.pass);
                uid = cred.user.uid;
                console.log(`[AUTH] Ya existía, sesion iniciada: ${u.email} -> ${uid}`);
            } else {
                console.error(`[AUTH] Error en ${u.email}:`, e);
                continue;
            }
        }

        // Crear/Actualizar documento en Firestore
        try {
            await setDoc(doc(db, "users", uid), {
                email: u.email,
                displayName: u.name,
                role: u.role,
                status: "active",
                tenantId: "tenant-1",
                companyId: u.companyId || null,
                createdAt: new Date().toISOString(),
                uid: uid
            }, { merge: true });
            console.log(`[FIRESTORE] Doc user actualizado OK: ${u.email}`);
        } catch(e) {
            console.error(`[FIRESTORE] Error con doc de ${u.email}:`, e);
        }
    }

    // Usar batch para escribir el resto de los datos
    const batch = writeBatch(db);

    console.log("Sembrando empresas...");
    for(const c of companiesToSeed) {
        batch.set(doc(db, "companies", c.id), c, { merge: true });
    }

    const auditLogsToSeed = [
        { action: "LOGIN", performedByEmail: "admin@sosercom.com", details: "Inicio de sesión administrativo exitoso", timestamp: new Date() },
        { action: "IMPERSONATION_START", performedByEmail: "rafa123@sosercom.com", details: "Iniciando soporte para Eduardo Cliente", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
        { action: "UPLOAD_DOCUMENT", performedByEmail: "cliente@empresa1.com", details: "Subida de F29 - Periodo Marzo 2026", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
        { action: "TICKET_CREATED", performedByEmail: "cliente@empresa2.com", details: "Nueva consulta sobre balance trimestral", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) }
    ];

    console.log("Sembrando logs de auditoría...");
    for(const l of auditLogsToSeed) {
        const logRef = doc(collection(db, "audit_logs"));
        batch.set(logRef, l);
    }

    await batch.commit();
    console.log("¡BATCH DE DATOS FICTICIOS APLICADO CON ÉXITO!");
    process.exit(0);
}

seedData();
