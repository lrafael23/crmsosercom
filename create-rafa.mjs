import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

async function createSuperAdmin() {
  const email = "rafa123@sosercom.com"; // Firebase requires valid email format
  const password = "rafa123"; // Minimum 6 characters (rafa123 is 7)

  try {
    console.log("Intentando crear usuario...");
    let userRecord;
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        userRecord = cred.user;
        console.log("Usuario creado en Auth:", userRecord.uid);
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            userRecord = cred.user;
            console.log("Usuario ya existía, sesion iniciada:", userRecord.uid);
        } else {
            throw e;
        }
    }

    // Assign Super Admin attributes in Firestore
    console.log("Escribiendo perfil en Firestore...");
    await setDoc(doc(db, "users", userRecord.uid), {
      email: email,
      displayName: "Rafael (Super Admin)",
      role: "super_admin_global",
      status: "active",
      tenantId: "global",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uid: userRecord.uid
    }, { merge: true });

    console.log("Perfil superadmin rafa123 creado/actualizado correctamente!");
    process.exit(0);
  } catch (error) {
    console.error("Error completo:", error);
    process.exit(1);
  }
}

createSuperAdmin();
