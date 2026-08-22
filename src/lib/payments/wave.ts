import crypto from "crypto";
import type { PaymentInitResult, PaymentWebhookPayload } from "./types";

const WAVE_API_URL = process.env.WAVE_API_URL || "https://api.wave.com/v1";
const WAVE_API_KEY = process.env.WAVE_API_KEY || "";
const WAVE_MERCHANT_ID = process.env.WAVE_MERCHANT_ID || "";
const WAVE_RETURN_URL = process.env.WAVE_RETURN_URL || "";
const WAVE_CANCEL_URL = process.env.WAVE_CANCEL_URL || "";
const WAVE_WEBHOOK_SECRET = process.env.WAVE_WEBHOOK_SECRET || "";

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
    const response = await fetch(`${WAVE_API_URL}/merchant/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WAVE_API_KEY}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        merchant_id: WAVE_MERCHANT_ID,
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        description: params.description,
        reference: params.orderId,
        return_url: WAVE_RETURN_URL,
        cancel_url: WAVE_CANCEL_URL,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        paymentId: data.id ?? "",
        error: data.message || "Erreur Wave",
      };
    }

    return {
      success: true,
      paymentId: data.id,
      redirectUrl: data.payment_url,
      reference: data.reference,
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

  const status = payload.status as string;
  const mappedStatus =
    status === "SUCCESSFUL"
      ? "SUCCESS"
      : status === "FAILED"
        ? "FAILED"
        : "PENDING";

  return {
    provider: "WAVE",
    reference: (payload.reference as string) ?? "",
    status: mappedStatus as "SUCCESS" | "FAILED" | "PENDING",
    amount: Number(payload.amount ?? 0),
    transactionId: payload.id as string | undefined,
  };
}
