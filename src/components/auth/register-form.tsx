"use client";

import { useActionState } from "react";
import { Loader2, LockKeyhole, Mail, UserPlus, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { register, type RegisterFormState } from "@/server/actions/auth";

const initialState: RegisterFormState = undefined;

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, initialState);
  const errors = state?.errors;

  return (
    <form action={action} className="flex flex-col gap-4">
      {errors?.form && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errors.form[0]}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-name" className="text-sm font-medium">
          Nom complet
        </label>
        <div className="relative">
          <UserRound
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Votre nom"
            aria-invalid={Boolean(errors?.name)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          />
        </div>
        {errors?.name && (
          <p className="text-sm text-destructive">{errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-email" className="text-sm font-medium">
          E-mail
        </label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vous@exemple.sn"
            aria-invalid={Boolean(errors?.email)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          />
        </div>
        {errors?.email && (
          <p className="text-sm text-destructive">{errors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-password" className="text-sm font-medium">
          Mot de passe
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="8 caractères minimum"
            aria-invalid={Boolean(errors?.password)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          />
        </div>
        {errors?.password && (
          <p className="text-sm text-destructive">{errors.password[0]}</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <UserPlus aria-hidden />
        )}
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
