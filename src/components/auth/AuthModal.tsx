import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { EmailForm } from "./EmailForm";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-text-secondary" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {mode === "login" ? "Welcome back" : "Create an account"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {mode === "login"
                  ? "Sign in to access your account."
                  : "Sign up to get started."}
              </p>
            </div>

            {/* Form */}
            <EmailForm
              mode={mode}
              onSubmit={async (email, password) => {
                if (mode === "login") {
                  await signIn(email, password);
                } else {
                  await signUp(email, password);
                }
                toast.success(mode === "login" ? "Signed in successfully" : "Account created successfully");
                navigate({ to: "/" });
              }}
              onSwitchMode={() => setMode(mode === "login" ? "signup" : "login")}
              onClose={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}