
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../../services/firebase";

export async function registerStudent(name, email, password) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) {
    throw new Error("Please enter your name.");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  try {
    await updateProfile(credential.user, {
      displayName: cleanName,
    });

    await setDoc(doc(db, "users", credential.user.uid), {
      name: cleanName,
      email: cleanEmail,
      role: "student",
      createdAt: serverTimestamp(),
    });

    return credential.user;
  } catch (error) {
    await signOut(auth);
    throw error;
  }
}

export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  return credential.user;
}


export async function getUserProfile(uid) {
  try {
    console.log("Loading Firestore profile for UID:", uid);

    const snapshot = await getDoc(doc(db, "users", uid));

    if (!snapshot.exists()) {
      console.error(
        "Student profile not found. Expected document: users/" + uid
      );
      return null;
    }

    const profile = snapshot.data();

    console.log("Firestore profile loaded:", {
      uid,
      role: profile.role,
      hasName: Boolean(profile.name),
    });

    return profile;
  } catch (error) {
    console.error("Firestore profile read failed:", {
      code: error.code,
      message: error.message,
    });

    throw error;
  }
}


export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function logoutUser() {
  return signOut(auth);
}
