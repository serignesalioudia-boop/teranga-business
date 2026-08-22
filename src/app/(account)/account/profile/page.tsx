import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";
import { Separator } from "@/components/ui/separator";


export const metadata = {
  title: "Mon profil — Teranga Business",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Mon profil</h1>

      {/* Informations personnelles */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Informations personnelles</h2>
        <ProfileForm
          initialName={user?.name ?? ""}
          initialEmail={user?.email ?? ""}
          initialPhone={user?.phone ?? ""}
        />
      </section>

      <Separator />

      {/* Mot de passe */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Mot de passe</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
