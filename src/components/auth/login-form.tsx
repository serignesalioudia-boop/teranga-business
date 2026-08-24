"use client";

import { Loader2, LockKeyhole, LogIn, Mail } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type LoginFormProps = {
  callbackUrl?: string;
  registered?: boolean;
  registeredEmail?: string;
  serverError?: string;
};

export function LoginForm({
  callbackUrl,
  registered,
  registeredEmail,
  serverError,
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(serverError ?? null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (!email || !password) {
      setError("Email et mot de passe requis.");
      setPending(false);
      return;
    }

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, callbackUrl }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
          setError(data.error || "Erreur de connexion.");
          setPending(false);
          return;
        }
        // Small delay to ensure browser commits Set-Cookie headers
        setTimeout(() => {
          window.location.href = data.redirect || "/";
        }, 150);
      })
      .catch(() => {
        setError("Erreur de connexion. Veuillez réessayer.");
        setPending(false);
      });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
      {registered && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Compte créé{registeredEmail ? ` pour ${registeredEmail}` : ""}.
          Connectez-vous.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm font-medium">
          E-mail
        </label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vous@exemple.sn"
            defaultValue={registeredEmail ?? ""}
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-sm font-medium">
          Mot de passe
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <LogIn aria-hidden />
        )}
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
