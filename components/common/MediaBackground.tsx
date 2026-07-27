import React from "react";
import Image from "next/image";

export interface LoopSettings {
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  preload?: "auto" | "metadata" | "none";
}

export const defaultLoopSettings: Required<LoopSettings> = {
  autoPlay: true,
  loop: true,
  muted: true,
  playsInline: true,
  controls: false,
  preload: "auto",
};

const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "ogg", "ogv", "m4v"];
const GIF_EXTENSIONS = ["gif"];

export type MediaKind = "video" | "gif" | "image";

export function getMediaKind(src?: string): MediaKind {
  if (!src) return "image";
  const ext = src.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase();
  if (ext && VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (ext && GIF_EXTENSIONS.includes(ext)) return "gif";
  return "image";
}

interface MediaBackgroundProps {
  src: string;
  alt: string;
  opacity?: number;
  className: string;
  loopSettings?: LoopSettings;
  priority?: boolean;
}

export const MediaBackground: React.FC<MediaBackgroundProps> = ({
  src,
  alt,
  opacity = 1,
  className,
  loopSettings,
  priority = true,
}) => {
  const kind = getMediaKind(src);
  const settings = { ...defaultLoopSettings, ...loopSettings };

  if (kind === "video") {
    return (
      <video
        src={src}
        autoPlay={settings.autoPlay}
        loop={settings.loop}
        muted={settings.muted}
        playsInline={settings.playsInline}
        controls={settings.controls}
        preload={settings.preload}
        className={className}
        style={{ opacity }}
      />
    );
  }

  if (kind === "gif") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} style={{ opacity }} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={className}
      style={{ opacity }}
    />
  );
};
