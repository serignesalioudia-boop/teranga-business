"use client";

import { Banknote, QrCode, Upload, X } from "lucide-react";
import { useState, useRef } from "react";

const METHODS = [
  {
    value: "WAVE",
    label: "Wave",
    desc: "Paiement mobile via Wave",
    color: "bg-[#1DC3F0]",
    logo: (
      <svg viewBox="0 0 120 40" className="h-8 w-auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="40" rx="6" fill="#1DC3F0" />
        <text x="60" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">Wave</text>
      </svg>
    ),
  },
  {
    value: "ORANGE_MONEY",
    label: "Orange Money",
    desc: "Paiement mobile via Orange Money",
    color: "bg-[#FF6600]",
    logo: (
      <svg viewBox="0 0 120 40" className="h-8 w-auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="40" rx="6" fill="#FF6600" />
        <text x="60" y="26" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">Orange Money</text>
      </svg>
    ),
  },
  {
    value: "COD",
    label: "Paiement à la livraison",
    desc: "Payez en espèces à la réception",
    color: "bg-green-600",
    logo: null,
  },
] as const;

export function PaymentSelect({
  selected,
  onSelect,
  qrCodeUrl,
}: {
  selected: string;
  onSelect: (method: string) => void;
  qrCodeUrl?: string | null;
}) {
  const [showQrUpload, setShowQrUpload] = useState(false);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Mode de paiement</h3>
      <div className="space-y-2">
        {METHODS.map((m) => {
          return (
            <label
              key={m.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                selected === m.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m.value}
                checked={selected === m.value}
                onChange={() => onSelect(m.value)}
                className="h-4 w-4"
              />
              {m.logo ? (
                m.logo
              ) : (
                <Banknote className="h-8 w-8 text-green-600" />
              )}
              <div>
                <p className="font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </label>
          );
        })}
      </div>

      {/* QR Code section for Wave/OM */}
      {selected !== "COD" && (
        <div className="mt-4 rounded-xl border border-dashed p-4">
          <div className="flex items-center gap-2 mb-2">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">QR Code de paiement</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Affichez votre QR Code Wave/Orange Money pour que le client puisse scanner et payer.
          </p>
          {qrCodeUrl ? (
            <div className="relative inline-block">
              <img
                src={qrCodeUrl}
                alt="QR Code de paiement"
                className="h-48 w-48 rounded-lg border object-contain"
              />
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Scannez pour payer
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/50 p-6 text-center">
              <QrCode className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                Le vendeur n&apos;a pas encore configuré de QR Code.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
