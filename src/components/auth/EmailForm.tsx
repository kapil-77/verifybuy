import { useState, type FormEvent } from "react";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";

type Mode = "login" | "signup";

interface EmailFormProps {
  mode: Mode;
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitchMode: () => void;
  onClose: () => void;
}

export function EmailForm({ mode, onSubmit, onSwitchMode, onClose }: EmailFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email, password);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      if (message.includes("auth/email-already-in-use")) {
        setError("This email is already registered. Try logging in.");
      } else if (message.includes("auth/user-not-found") || message.includes("auth/invalid-credential")) {
        setError("Invalid email or password.");
      } else if (message.includes("auth/weak-password")) {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="auth-email" className="block text-sm font-medium text-foreground mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete={mode === "login" ? "email" : "email"}
            className="w-full h-10 rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="auth-password" className="block text-sm font-medium text-foreground mb-1.5">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "login" ? "Enter your password" : "Create a password (min 6 chars)"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full h-10 rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-[#2a2b2c] text-white text-sm font-semibold shadow-sm transition-all duration-200 hover:bg-[#3a3b3c] hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> {mode === "login" ? "Signing in…" : "Creating account…"}</>
        ) : (
          mode === "login" ? "Sign In" : "Create Account"
        )}
      </button>

      <p className="text-center text-xs text-text-muted">
        {mode === "login" ? (
          <>Don't have an account?{" "}<button type="button" onClick={onSwitchMode} className="text-primary hover:underline font-medium">Sign up</button></>
        ) : (
          <>Already have an account?{" "}<button type="button" onClick={onSwitchMode} className="text-primary hover:underline font-medium">Sign in</button></>
        )}
      </p>
    </form>
  );
}