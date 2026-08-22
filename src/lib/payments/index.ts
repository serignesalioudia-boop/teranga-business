import { initWavePayment } from "./wave";
import { initOrangeMoneyPayment } from "./orange-money";
import type { PaymentProvider, PaymentInitResult } from "./types";

export type { PaymentProvider, PaymentInitResult, PaymentWebhookPayload } from "./types";

export async function initPayment(
  provider: PaymentProvider,
  params: {
    amount: number;
    currency: string;
    orderId: string;
    customerName: string;
    customerPhone: string;
    description: string;
  }
): Promise<PaymentInitResult> {
  switch (provider) {
    case "WAVE":
      return initWavePayment(params);
    case "ORANGE_MONEY":
      return initOrangeMoneyPayment(params);
    case "COD":
      return {
        success: true,
        paymentId: `cod_${params.orderId}`,
        reference: `COD-${params.orderId}`,
      };
    default:
      return {
        success: false,
        paymentId: "",
        error: `Fournisseur inconnu: ${provider}`,
      };
  }
}
