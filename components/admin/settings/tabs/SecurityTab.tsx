"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Switch } from "@/components/common/Switch";
import { SettingsSection, SettingsSubCard } from "@/components/admin/settings/SettingsSection";
import { SaveBar } from "@/components/admin/settings/SaveBar";
import { useSettingsForm } from "@/components/admin/settings/useSettingsForm";
import { saveSecuritySettings } from "@/lib/actions/adminSettings";
import { AdminSettings } from "@/types";

export default function SecurityTab({ initialSettings }: { initialSettings: AdminSettings }) {
  const [require2fa, setRequire2fa] = useState(initialSettings.require2fa);
  const [sessionTimeout, setSessionTimeout] = useState(String(initialSettings.sessionTimeoutMinutes));
  const [ipAllowlist, setIpAllowlist] = useState(initialSettings.ipAllowlist ?? "");
  const [auditRetention, setAuditRetention] = useState(String(initialSettings.auditRetentionDays));

  const { errorMessage, dispatch, isPending, justSaved } = useSettingsForm(saveSecuritySettings);

  return (
    <SettingsSection title="Security & Access" subtitle="Admin authentication, sessions and audit policy">
      <form action={dispatch} className="space-y-10">
        <SettingsSubCard
          title="Two-Factor Authentication"
          description="Require all admin accounts to enroll in 2FA before accessing the panel."
          right={<Switch checked={require2fa} onChange={setRequire2fa} name="require2fa" id="require-2fa" />}
        >
          <label htmlFor="require-2fa" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bluegray-800 dark:text-redgray-200 -mt-2 cursor-pointer">
            <ShieldCheck className="h-3.5 w-3.5" />
            Require 2FA for Admins
          </label>
        </SettingsSubCard>

        <SettingsSubCard title="Sessions" description="Control how long an admin session stays valid without activity.">
          <Input
            type="number"
            min={5}
            name="sessionTimeoutMinutes"
            label="Session Timeout (minutes)"
            value={sessionTimeout}
            onChange={setSessionTimeout}
          />
        </SettingsSubCard>

        <SettingsSubCard title="IP Allowlist" description="Restrict admin panel access to these IP addresses or CIDR ranges, one per line. Leave empty to allow any IP.">
          <Input
            as="textarea"
            rows={4}
            name="ipAllowlist"
            placeholder={"203.0.113.4\n198.51.100.0/24"}
            value={ipAllowlist}
            onChange={setIpAllowlist}
          />
        </SettingsSubCard>

        <SettingsSubCard title="Audit Log" description="How long admin activity logs are retained before being purged.">
          <Input
            type="number"
            min={1}
            name="auditRetentionDays"
            label="Retention (days)"
            value={auditRetention}
            onChange={setAuditRetention}
          />
        </SettingsSubCard>

        <SaveBar errorMessage={errorMessage} isPending={isPending} justSaved={justSaved} label="Save Security Settings" />
      </form>
    </SettingsSection>
  );
}
