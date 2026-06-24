import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

async function saveUserProfile(user) {
  if (!user) return;

  await setDoc(
    doc(db, "users", user.uid),
    {
      userId: user.uid,
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle() {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    await saveUserProfile(credential.user);
    return credential;
  } catch (error) {
    console.error("Google sign-in failed:", error);

    if (error?.code === "auth/operation-not-allowed") {
      throw new Error("Google sign-in is not enabled yet. Enable Google in Firebase Authentication.");
    }

    if (error?.code === "auth/popup-closed-by-user") {
      throw new Error("Google sign-in was closed before it finished.");
    }

    throw new Error("Google sign-in failed. Please try again.");
  }
}

export function logoutUser() {
  return signOut(auth);
}
