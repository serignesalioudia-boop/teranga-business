export type PaymentProvider = "WAVE" | "ORANGE_MONEY" | "COD";

export type PaymentInitResult = {
  success: boolean;
  paymentId: string;
  redirectUrl?: string;
  reference?: string;
  error?: string;
};

export type PaymentWebhookPayload = {
  provider: PaymentProvider;
  reference: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  amount: number;
  transactionId?: string;
  metadata?: Record<string, string>;
};
