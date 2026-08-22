"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { trackShare } from "@/server/actions/shares";
import { useState } from "react";
import type { ShareTargetType } from "@/generated/prisma/enums";

type Props = {
  targetType: ShareTargetType;
  targetId: string;
  targetSlug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  url: string;
};

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", color: "bg-green-600 hover:bg-green-700 text-white" },
  { id: "facebook", label: "Facebook", color: "bg-blue-600 hover:bg-blue-700 text-white" },
  { id: "messenger", label: "Messenger", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { id: "sms", label: "SMS", color: "bg-gray-600 hover:bg-gray-700 text-white" },
] as const;

function buildShareHref(channel: string, url: string, title: string): string {
  const text = encodeURIComponent(`${title}\n${url}`);
  const encodedUrl = encodeURIComponent(url);

  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${text}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "messenger":
      return `https://www.messenger.com/share/link?link=${encodedUrl}`;
    case "sms":
      return `sms:?body=${text}`;
    default:
      return "";
  }
}

export function SharePage({
  targetType,
  targetId,
  targetSlug,
  title,
  description,
  imageUrl,
  url,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleChannelClick(channel: string) {
    try {
      await trackShare(targetType, targetId, targetSlug, channel);
    } catch {}

    if (channel === "copy") {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const href = buildShareHref(channel, url, title);
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer,width=600,height=400");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Partager</h1>
        <p className="text-muted-foreground">{title}</p>
      </div>

      {imageUrl && (
        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt={title}
            className="h-40 w-40 rounded-xl object-cover shadow-md"
          />
        </div>
      )}

      {description && (
        <p className="text-center text-sm text-muted-foreground">{description}</p>
      )}

      <div className="flex justify-center">
        <QRCodeSVG
          value={url}
          size={200}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin
        />
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleChannelClick("copy")}
        >
          {copied ? "✓ Lien copié !" : "Copier le lien"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          {CHANNELS.map((ch) => (
            <Button
              key={ch.id}
              className={ch.color}
              onClick={() => handleChannelClick(ch.id)}
            >
              {ch.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-3">
        <p className="break-all text-xs text-muted-foreground">{url}</p>
      </div>
    </div>
  );
}
