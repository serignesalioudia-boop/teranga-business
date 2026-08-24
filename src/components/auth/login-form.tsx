"use client";

import { Loader2, LockKeyhole, LogIn, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { loginAction } from "@/server/actions/login";

type LoginFormProps = {
  callbackUrl?: string;
  registered?: boolean;
  registeredEmail?: string;
};

export function LoginForm({
  callbackUrl,
  registered,
  registeredEmail,
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await loginAction(email, password, callbackUrl);
      if (result?.error) {
        setError(result.error);
        setPending(false);
      }
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.includes("NEXT_REDIRECT")) {
        throw err;
      }
      setError("Erreur de connexion. Veuillez réessayer.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
