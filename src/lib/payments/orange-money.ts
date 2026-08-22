import crypto from "crypto";
import type { PaymentInitResult, PaymentWebhookPayload } from "./types";

const ORANGE_API_URL = process.env.ORANGE_API_URL || "https://api.orange.com/orange-money-webpay/dev/v1";
const ORANGE_CLIENT_ID = process.env.ORANGE_CLIENT_ID || "";
const ORANGE_CLIENT_SECRET = process.env.ORANGE_CLIENT_SECRET || "";
const ORANGE_MERCHANT_KEY = process.env.ORANGE_MERCHANT_KEY || "";
const ORANGE_RETURN_URL = process.env.ORANGE_RETURN_URL || "";
const ORANGE_CANCEL_URL = process.env.ORANGE_CANCEL_URL || "";
const ORANGE_WEBHOOK_SECRET = process.env.ORANGE_WEBHOOK_SECRET || "";

async function getOrangeAccessToken(): Promise<string | null> {
  if (!ORANGE_CLIENT_ID || !ORANGE_CLIENT_SECRET) return null;

  const response = await fetch("https://api.orange.com/oauth/v3/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${ORANGE_CLIENT_ID}:${ORANGE_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token ?? null;
}

export async function initOrangeMoneyPayment(params: {
  amount: number;
  currency: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  description: string;
}): Promise<PaymentInitResult> {
  const token = await getOrangeAccessToken();
  if (!token) {
    return {
      success: false,
      paymentId: "",
      error: "Orange Money non configuré (identifiants manquants)",
    };
  }

  try {
    const response = await fetch(`${ORANGE_API_URL}/webpayment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        merchant_key: ORANGE_MERCHANT_KEY,
        currency: params.currency === "XOF" ? "OUV" : params.currency,
        amount: params.amount,
        return_url: ORANGE_RETURN_URL,
        cancel_url: ORANGE_CANCEL_URL,
        notif_url: `${process.env.NEXTAUTH_URL}/api/webhooks/orange-money`,
        reference: params.orderId,
        description: params.description,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status === "ERROR") {
      return {
        success: false,
        paymentId: "",
        error: data.message || "Erreur Orange Money",
      };
    }

    return {
      success: true,
      paymentId: data.pay_token,
      redirectUrl: data.payment_url,
      reference: data.notif_token,
    };
  } catch (error) {
    return {
      success: false,
      paymentId: "",
      error: `Erreur réseau Orange Money: ${error instanceof Error ? error.message : "inconnue"}`,
    };
  }
}

export function verifyOrangeMoneyWebhook(
  payload: Record<string, unknown>,
  rawBody: string,
  signature: string | null,
): PaymentWebhookPayload | null {
  if (!ORANGE_WEBHOOK_SECRET) {
    console.error("ORANGE_WEBHOOK_SECRET non configuré — webhook rejeté");
    return null;
  }
  if (!signature) return null;
  const expected = crypto
    .createHmac("sha256", ORANGE_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  const status = payload.status as string;
  const mappedStatus =
    status === "SUCCESS"
      ? "SUCCESS"
      : status === "FAILED"
        ? "FAILED"
        : "PENDING";

  return {
    provider: "ORANGE_MONEY",
    reference: (payload.order_id as string) ?? "",
    status: mappedStatus as "SUCCESS" | "FAILED" | "PENDING",
    amount: Number(payload.amount ?? 0),
    transactionId: payload.txnid as string | undefined,
  };
}
