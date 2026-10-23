
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../services/firebase";
import { getUserProfile } from "./authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!active) return;

        setUser(firebaseUser);
        setProfile(null);

        if (!firebaseUser) {
          setLoading(false);
          return;
        }

        setLoading(true);

        try {
          const userProfile = await getUserProfile(
            firebaseUser.uid
          );

          if (!active) return;

          setProfile(
            userProfile
              ? {
                  ...userProfile,
                  uid: firebaseUser.uid,
                }
              : null
          );
        } catch (error) {
          console.error(
            "Unable to load user profile:",
            error
          );

          if (active) {
            setProfile(null);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const isAdmin =
    Boolean(user) &&
    profile?.uid === user.uid &&
    profile?.role === "admin";

  const isStudent =
    Boolean(user) &&
    profile?.uid === user.uid &&
    profile?.role === "student";

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isStudent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
