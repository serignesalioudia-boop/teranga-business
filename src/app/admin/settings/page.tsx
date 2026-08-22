export const dynamic = "force-dynamic";

import { getPlatformSettings } from "@/server/actions/platform-settings";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";


export const metadata = {
  title: "Paramètres — Admin",
};

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres de la plateforme</h1>
      <PlatformSettingsForm settings={settings} />
    </div>
  );
}
