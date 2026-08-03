"use client";

import { useState } from "react";
import { Cookie } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Switch } from "@/components/common/Switch";
import { SettingsSection, SettingsSubCard } from "@/components/admin/settings/SettingsSection";
import { SaveBar } from "@/components/admin/settings/SaveBar";
import { useSettingsForm } from "@/components/admin/settings/useSettingsForm";
import { saveLegalSettings } from "@/lib/actions/adminSettings";
import { AdminSettings } from "@/types";

export default function LegalTab({ initialSettings }: { initialSettings: AdminSettings }) {
  const [cookieBannerActive, setCookieBannerActive] = useState(initialSettings.cookieBannerActive);
  const [cookieBannerText, setCookieBannerText] = useState(initialSettings.cookieBannerText ?? "");
  const [privacyUrl, setPrivacyUrl] = useState(initialSettings.privacyPolicyUrl ?? "");
  const [termsUrl, setTermsUrl] = useState(initialSettings.termsOfServiceUrl ?? "");
  const [gdprEmail, setGdprEmail] = useState(initialSettings.gdprRequestEmail ?? "");

  const { errorMessage, dispatch, isPending, justSaved } = useSettingsForm(saveLegalSettings);

  return (
    <SettingsSection title="Legal & Compliance" subtitle="Cookie consent, policy links and data requests">
      <form action={dispatch} className="space-y-10">
        <SettingsSubCard
          title="Cookie Consent Banner"
          description="Show a consent banner to visitors before non-essential cookies are set."
          right={<Switch checked={cookieBannerActive} onChange={setCookieBannerActive} name="cookieBannerActive" id="cookie-banner-active" />}
        >
          <label htmlFor="cookie-banner-active" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bluegray-800 dark:text-redgray-200 -mt-2 cursor-pointer">
            <Cookie className="h-3.5 w-3.5" />
            Cookie Consent Banner Active
          </label>
          {cookieBannerActive && (
            <Input as="textarea" rows={3} name="cookieBannerText" label="Banner Text" value={cookieBannerText} onChange={setCookieBannerText} />
          )}
        </SettingsSubCard>

        <SettingsSubCard title="Policy Links" description="Referenced in the site footer, the cookie banner and legal emails.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input name="privacyPolicyUrl" label="Privacy Policy URL" value={privacyUrl} onChange={setPrivacyUrl} />
            <Input name="termsOfServiceUrl" label="Terms of Service URL" value={termsUrl} onChange={setTermsUrl} />
          </div>
        </SettingsSubCard>

        <SettingsSubCard title="Data Requests" description="Inbox that receives GDPR/CCPA data access and deletion requests.">
          <Input type="email" name="gdprRequestEmail" label="GDPR Data Request Email" value={gdprEmail} onChange={setGdprEmail} />
        </SettingsSubCard>

        <SaveBar errorMessage={errorMessage} isPending={isPending} justSaved={justSaved} label="Save Legal Settings" />
      </form>
    </SettingsSection>
  );
}
