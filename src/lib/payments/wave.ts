import crypto from "crypto";
import type { PaymentInitResult, PaymentWebhookPayload } from "./types";

const WAVE_API_URL = process.env.WAVE_API_URL || "https://api.wave.com/v1";
const WAVE_API_KEY = process.env.WAVE_API_KEY || "";
const WAVE_MERCHANT_ID = process.env.WAVE_MERCHANT_ID || "";
const WAVE_WEBHOOK_SECRET = process.env.WAVE_WEBHOOK_SECRET || "";
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function initWavePayment(params: {
  amount: number;
  currency: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  description: string;
}): Promise<PaymentInitResult> {
  if (!WAVE_API_KEY) {
    return {
      success: false,
      paymentId: "",
      error: "Wave non configuré (WAVE_API_KEY manquant)",
    };
  }

  try {
    const response = await fetch(`${WAVE_API_URL}/checkout/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WAVE_API_KEY}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        reference: params.orderId,
        success_url: `${BASE_URL}/checkout/confirmation/${params.orderId}`,
        error_url: `${BASE_URL}/cart`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        paymentId: data.id ?? "",
        error: data.message || data.code || "Erreur Wave",
      };
    }

    return {
      success: true,
      paymentId: data.id,
      redirectUrl: data.payment_url,
      reference: data.reference ?? params.orderId,
    };
  } catch (error) {
    return {
      success: false,
      paymentId: "",
      error: `Erreur réseau Wave: ${error instanceof Error ? error.message : "inconnue"}`,
    };
  }
}

export function verifyWaveWebhook(
  payload: Record<string, unknown>,
  signature: string | null,
  rawBody: string
): PaymentWebhookPayload | null {
  if (!WAVE_API_KEY) return null;

  if (!WAVE_WEBHOOK_SECRET) {
    console.error("WAVE_WEBHOOK_SECRET non configuré — webhook rejeté");
    return null;
  }
  if (!signature) return null;
  const expected = crypto
    .createHmac("sha256", WAVE_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  // Nouveau format Checkout API : payload.data.id, payload.data.reference, payload.data.payment_status
  const data = (payload.data as Record<string, unknown>) ?? payload;
  const status = (data.payment_status as string) ?? (payload.status as string);
  const mappedStatus =
    status === "SUCCESSFUL" || status === "COMPLETED"
      ? "SUCCESS"
      : status === "FAILED" || status === "EXPIRED" || status === "CANCELLED"
        ? "FAILED"
        : "PENDING";

  return {
    provider: "WAVE",
    reference: (data.reference as string) ?? (payload.reference as string) ?? "",
    status: mappedStatus as "SUCCESS" | "FAILED" | "PENDING",
    amount: Number((data.amount as { total?: number })?.total ?? (data.amount as number) ?? 0),
    transactionId: (data.id as string) ?? (payload.id as string) ?? undefined,
  };
}
