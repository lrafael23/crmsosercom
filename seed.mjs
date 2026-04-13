import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJIr-cGLKccL2eEiURrjZnZ560Di68NA8",
  authDomain: "sosercom-cb383.firebaseapp.com",
  projectId: "sosercom-cb383",
  storageBucket: "sosercom-cb383.firebasestorage.app",
  messagingSenderId: "976367855256",
  appId: "1:976367855256:web:ceedb13e5c646f0e0992ed"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  try {
    console.log("Creating super admin...");
    const email = "superadmin@gmail.com";
    const password = "superadmin123";
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("Super admin auth created with UID:", user.uid);

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: "Super Admin",
      role: "super_admin_global",
      isActive: true,
      createdAt: new Date().toISOString()
    });

    console.log("Super admin saved to Firestore successfully!");
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
        console.log("The account superadmin@gmail.com already exists. Credentials are superadmin123.");
        process.exit(0);
    }
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();
