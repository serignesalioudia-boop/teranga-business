export type PlanLimits = {
  maxOrdersPerMonth: number;
  maxProducts: number;
  maxPhotosPerProduct: number;
  maxStoreUsers: number;
  canSellDigital: boolean;
};

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    maxOrdersPerMonth: 5,
    maxProducts: 20,
    maxPhotosPerProduct: 1,
    maxStoreUsers: 1,
    canSellDigital: false,
  },
  ESSENTIAL: {
    maxOrdersPerMonth: 50,
    maxProducts: Infinity,
    maxPhotosPerProduct: 5,
    maxStoreUsers: 1,
    canSellDigital: false,
  },
  PRO: {
    maxOrdersPerMonth: Infinity,
    maxProducts: Infinity,
    maxPhotosPerProduct: 15,
    maxStoreUsers: 3,
    canSellDigital: false,
  },
  CREATOR: {
    maxOrdersPerMonth: Infinity,
    maxProducts: Infinity,
    maxPhotosPerProduct: 15,
    maxStoreUsers: 3,
    canSellDigital: true,
  },
};

export const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  ESSENTIAL: 5000,
  PRO: 10000,
  CREATOR: 20000,
};

export const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratuit",
  ESSENTIAL: "Essentiel",
  PRO: "Pro",
  CREATOR: "Créateur",
};
