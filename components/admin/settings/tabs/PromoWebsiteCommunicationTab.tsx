"use client";

import { useState } from "react";
import { Info, Megaphone, MonitorPlay } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Switch } from "@/components/common/Switch";
import { SettingsSection, SettingsSubCard } from "@/components/admin/settings/SettingsSection";
import { SaveBar } from "@/components/admin/settings/SaveBar";
import { useSettingsForm } from "@/components/admin/settings/useSettingsForm";
import ImageDropInput from "@/components/admin/common/ImageDropInput";
import useFilePreview from "@/components/admin/common/useFilePreview";
import { GranularColorPickerButton } from "@/components/admin/common/content-modules/shared";
import { saveMarqueeSettings, savePopupSettings } from "@/lib/actions/adminSettings";
import { AdminSettings, MarqueeType, PopupFrequency } from "@/types";

const FREQUENCY_OPTIONS = [
  { label: "Only on first visit", value: "first_visit" },
  { label: "Every visit", value: "every_visit" },
  { label: "Periodically (every N days)", value: "periodic" },
];

const MARQUEE_TYPE_OPTIONS = [
  { label: "Every Page (thin strip above header)", value: "every_page" },
  { label: "Homepage Top (thin strip above header)", value: "homepage_top" },
  { label: "Homepage Banner (wide banner below hero)", value: "homepage_banner" },
];

export default function PromoWebsiteCommunicationTab({ initialSettings }: { initialSettings: AdminSettings }) {
  // --- Marquee -------------------------------------------------------
  const [marqueeActive, setMarqueeActive] = useState(initialSettings.marqueeActive);
  const [marqueeText, setMarqueeText] = useState(initialSettings.marqueeText ?? "");
  const [marqueeType, setMarqueeType] = useState<MarqueeType>(initialSettings.marqueeType);
  const [marqueeTextColor, setMarqueeTextColor] = useState(initialSettings.marqueeTextColor ?? "");
  const [marqueeBgColor, setMarqueeBgColor] = useState(initialSettings.marqueeBgColor ?? "");

  const marqueeForm = useSettingsForm(saveMarqueeSettings);

  // --- Popup -----------------------------------------------------------
  const [popupActive, setPopupActive] = useState(initialSettings.popupActive);
  const [popupHeadline, setPopupHeadline] = useState(initialSettings.popupHeadline ?? "");
  const [popupMessage, setPopupMessage] = useState(initialSettings.popupMessage ?? "");
  const [ctaLabel, setCtaLabel] = useState(initialSettings.popupCtaLabel ?? "");
  const [ctaLink, setCtaLink] = useState(initialSettings.popupCtaLink ?? "");
  const [frequency, setFrequency] = useState<PopupFrequency>(initialSettings.popupFrequency);
  const [frequencyDays, setFrequencyDays] = useState(String(initialSettings.popupFrequencyDays));
  const [removePopupImage, setRemovePopupImage] = useState(false);
  const popupImage = useFilePreview();

  const popupForm = useSettingsForm(savePopupSettings);

  return (
    <SettingsSection
      title="Promo Website Communication"
      subtitle="On-site announcements shown to visitors of the public website"
    >
      <form action={marqueeForm.dispatch}>
        <SettingsSubCard
          title="Homepage Marquee"
          description="A scrolling announcement bar shown to visitors of the public website."
          right={
            <Switch
              checked={marqueeActive}
              onChange={setMarqueeActive}
              name="marqueeActive"
              id="marquee-active"
            />
          }
        >
          <label htmlFor="marquee-active" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bluegray-800 dark:text-redgray-200 -mt-2 cursor-pointer">
            <Megaphone className="h-3.5 w-3.5" />
            Active Homepage Marquee
          </label>

          {marqueeActive && (
            <div className="space-y-6">
              <Input
                as="textarea"
                rows={3}
                name="marqueeText"
                label="Marquee Text"
                placeholder="e.g. New variable font family just dropped — explore the collection"
                value={marqueeText}
                onChange={setMarqueeText}
              />

              <Select
                label="Marquee Placement"
                options={MARQUEE_TYPE_OPTIONS}
                value={marqueeType}
                onChange={(v) => setMarqueeType(v as MarqueeType)}
              />
              <input type="hidden" name="marqueeType" value={marqueeType} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <GranularColorPickerButton
                  label="Marquee Text Color"
                  mode="text"
                  value={marqueeTextColor}
                  onChange={setMarqueeTextColor}
                />
                <GranularColorPickerButton
                  label="Marquee Background Color"
                  mode="bg"
                  value={marqueeBgColor}
                  onChange={setMarqueeBgColor}
                />
              </div>
              <input type="hidden" name="marqueeTextColor" value={marqueeTextColor} />
              <input type="hidden" name="marqueeBgColor" value={marqueeBgColor} />
            </div>
          )}

          <SaveBar {...marqueeForm} label="Save Marquee Settings" />
        </SettingsSubCard>
      </form>

      <form action={popupForm.dispatch} encType="multipart/form-data">
        <SettingsSubCard
          title="Homepage Popup"
          description="A modal shown over the public homepage, with configurable frequency."
          right={
            <Switch
              checked={popupActive}
              onChange={setPopupActive}
              name="popupActive"
              id="popup-active"
            />
          }
        >
          <label htmlFor="popup-active" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bluegray-800 dark:text-redgray-200 -mt-2 cursor-pointer">
            <MonitorPlay className="h-3.5 w-3.5" />
            Active Homepage Popup
          </label>

          {popupActive && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <label className="text-[10px] text-bluegray-800 dark:text-redgray-200 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-bold">
                    Popup Image
                  </label>
                  <ImageDropInput
                    name="popupImage"
                    inputRef={popupImage.inputRef}
                    previewUrl={popupImage.previewUrl}
                    currentUrl={removePopupImage ? null : initialSettings.popupImageUrl}
                    isCompressing={popupImage.isCompressing}
                    onSelect={(e) => {
                      setRemovePopupImage(false);
                      popupImage.onSelect(e);
                    }}
                    onRemove={() => {
                      if (popupImage.previewUrl) popupImage.clear();
                      else setRemovePopupImage(true);
                    }}
                    label="Upload popup image"
                    helperText="Recommended 1200×800"
                    containerClassName="aspect-[4/3] rounded-xl w-full"
                  />
                  <input type="hidden" name="removePopupImage" value={removePopupImage ? "true" : "false"} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <Input
                    name="popupHeadline"
                    label="Popup Headline"
                    placeholder="e.g. 20% off all annual licenses"
                    value={popupHeadline}
                    onChange={setPopupHeadline}
                  />
                  <Input
                    as="textarea"
                    rows={3}
                    name="popupMessage"
                    label="Popup Message"
                    placeholder="Short supporting copy shown below the headline"
                    value={popupMessage}
                    onChange={setPopupMessage}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      name="popupCtaLabel"
                      label="CTA Button Label"
                      placeholder="e.g. Shop the sale"
                      value={ctaLabel}
                      onChange={setCtaLabel}
                    />
                    <Input
                      name="popupCtaLink"
                      label="CTA Button Link"
                      placeholder="/collections/sale"
                      value={ctaLink}
                      onChange={setCtaLink}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <Select
                  label="Display Frequency"
                  options={FREQUENCY_OPTIONS}
                  value={frequency}
                  onChange={(v) => setFrequency(v as PopupFrequency)}
                />
                {frequency === "periodic" && (
                  <Input
                    type="number"
                    min={1}
                    name="popupFrequencyDays"
                    label="Repeat Every (days)"
                    value={frequencyDays}
                    onChange={setFrequencyDays}
                  />
                )}
              </div>
              <input type="hidden" name="popupFrequency" value={frequency} />

              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-blue-500/10 dark:bg-red-500/10 text-bluegray-800 dark:text-redgray-200">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs font-haas leading-relaxed">
                  Frequency is enforced client-side with a browser cookie that records when the popup was last shown to a visitor.
                  {frequency === "first_visit" && " It fires once per browser, then never again."}
                  {frequency === "every_visit" && " It fires on every visit, with no cookie suppressing it."}
                  {frequency === "periodic" && ` It fires again once ${frequencyDays || "N"} day(s) have passed since it was last shown.`}
                </p>
              </div>
            </div>
          )}

          <SaveBar {...popupForm} label="Save Popup Settings" />
        </SettingsSubCard>
      </form>
    </SettingsSection>
  );
}
