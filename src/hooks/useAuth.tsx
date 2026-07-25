import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthChange,
  signInWithGoogle,
  signInWithGithub,
  signUpWithEmail,
  signInWithEmail,
  signOut as authSignOut,
  type AuthUser,
} from "@/lib/auth";
import { useApp } from "@/lib/store";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signInGoogle: () => Promise<AuthUser>;
  signInGithub: () => Promise<AuthUser>;
  signUp: (email: string, password: string) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { setAuthUser, clearAuthUser } = useApp();

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setAuthUser(firebaseUser);
      } else {
        clearAuthUser();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setAuthUser, clearAuthUser]);

  const signInGoogle = async () => {
    const u = await signInWithGoogle();
    setUser(u);
    setAuthUser(u);
    return u;
  };

  const signInGithub = async () => {
    const u = await signInWithGithub();
    setUser(u);
    setAuthUser(u);
    return u;
  };

  const signUp = async (email: string, password: string) => {
    const u = await signUpWithEmail(email, password);
    setUser(u);
    setAuthUser(u);
    return u;
  };

  const signIn = async (email: string, password: string) => {
    const u = await signInWithEmail(email, password);
    setUser(u);
    setAuthUser(u);
    return u;
  };

  const logout = async () => {
    await authSignOut();
    setUser(null);
    clearAuthUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInGoogle, signInGithub, signUp, signIn, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}