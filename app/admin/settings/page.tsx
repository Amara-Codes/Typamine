import { Metadata } from "next";
import SettingsView from "@/components/admin/settings/SettingsView";
import { getAdminSettingsForAdmin } from "@/lib/actions/adminSettings";

export const metadata: Metadata = {
  title: "Settings - Typamine Admin",
};

export default async function AdminSettingsPage() {
  const adminSettings = await getAdminSettingsForAdmin();
  return <SettingsView adminSettings={adminSettings} />;
}
