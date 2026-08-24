import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    registered?: string;
    email?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;

  const callbackUrl =
    params.callbackUrl &&
    params.callbackUrl.startsWith("/") &&
    !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : "/";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Accédez à votre compte Teranga Business.
        </p>
      </div>
      <LoginForm
        callbackUrl={callbackUrl}
        registered={params.registered === "1"}
        registeredEmail={params.email}
        serverError={params.error}
      />
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
