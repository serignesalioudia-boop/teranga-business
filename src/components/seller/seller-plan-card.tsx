"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Star } from "lucide-react";
import {
  upgradeSellerPlan,
} from "@/server/actions/seller-plans";
import { PLAN_LIMITS, type PlanLimits } from "@/lib/plans";
import type { SellerPlan } from "@/generated/prisma/enums";

type Props = {
  currentPlan: SellerPlan;
  planExpiresAt: Date | null;
  storeId: string;
};

const PLANS: {
  key: SellerPlan;
  label: string;
  price: number;
  description: string;
  features: string[];
}[] = [
  {
    key: "FREE",
    label: "Gratuit",
    price: 0,
    description: "Pour commencer à vendre",
    features: [
      "5 commandes/mois",
      "20 produits max",
      "1 photo/produit",
    ],
  },
  {
    key: "ESSENTIAL",
    label: "Essentiel",
    price: 5000,
    description: "Pour les vendeurs en croissance",
    features: [
      "50 commandes/mois",
      "Produits illimités",
      "5 photos/produit",
    ],
  },
  {
    key: "PRO",
    label: "Pro",
    price: 10000,
    description: "Pour les boutiques établies",
    features: [
      "Commandes illimitées",
      "15 photos/produit",
      "3 utilisateurs boutique",
    ],
  },
  {
    key: "CREATOR",
    label: "Créateur",
    price: 20000,
    description: "Pour les créateurs de contenu",
    features: [],
  },
];

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency: "XOF",
  }).format(amount);
}

export function SellerPlanCard({ currentPlan, planExpiresAt, storeId }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<SellerPlan | null>(null);
  const [upgradeState, setUpgradeState] = useState<{
    success?: boolean;
    error?: string;
  }>({});
  const [upgrading, setUpgrading] = useState(false);

  const isExpired = planExpiresAt && new Date(planExpiresAt) < new Date();
  const effectivePlan = isExpired ? "FREE" : currentPlan;
  const limits = PLAN_LIMITS[effectivePlan];

  async function handleUpgrade(plan: SellerPlan) {
    if (plan === effectivePlan) return;
    setSelectedPlan(plan);
    setUpgrading(true);
    setUpgradeState({});
    try {
      await upgradeSellerPlan(plan);
      setUpgradeState({ success: true });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setUpgradeState({
        error: err instanceof Error ? err.message : "Erreur lors de la mise à jour.",
      });
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Plan actuel</h3>
            <p className="text-sm text-muted-foreground">
              {isExpired ? "Votre plan a expiré, vous êtes sur le plan Gratuit." : `Plan ${effectivePlan}`}
            </p>
          </div>
          <Badge variant="secondary" className="text-base">
            {PLANS.find((p) => p.key === effectivePlan)?.label ?? effectivePlan}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Commandes/mois</p>
            <p className="font-bold">
              {limits.maxOrdersPerMonth === Infinity
                ? "Illimité"
                : limits.maxOrdersPerMonth}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Produits</p>
            <p className="font-bold">
              {limits.maxProducts === Infinity ? "Illimité" : limits.maxProducts}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Photos/produit</p>
            <p className="font-bold">{limits.maxPhotosPerProduct}</p>
          </div>
        </div>

        {planExpiresAt && (
          <p className="mt-3 text-xs text-muted-foreground">
            Expire le{" "}
            {new Date(planExpiresAt).toLocaleDateString("fr-SN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {upgradeState.success && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-600">
          Plan mis à jour avec succès !
        </div>
      )}
      {upgradeState.error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {upgradeState.error}
        </div>
      )}

      <div>
        <h3 className="mb-4 text-lg font-bold">Changer de plan</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === effectivePlan;
            return (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-xl border p-5 transition ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                {isCurrent && (
                  <Badge className="absolute -top-2.5 left-4 text-xs">
                    Actuel
                  </Badge>
                )}
                {plan.key === "CREATOR" && (
                  <Badge variant="secondary" className="absolute -top-2.5 right-4 text-xs">
                    <Star className="mr-1 h-3 w-3" />
                    Populaire
                  </Badge>
                )}

                <div className="mb-3">
                  <h4 className="font-bold">{plan.label}</h4>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold">{formatPrice(plan.price)}</span>
                  <span className="text-xs text-muted-foreground">/mois</span>
                </div>

                <ul className="mb-4 flex-1 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-xs">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isCurrent ? "outline" : "default"}
                  size="sm"
                  disabled={isCurrent || upgrading}
                  onClick={() => handleUpgrade(plan.key)}
                  className="w-full"
                >
                  {upgrading && selectedPlan === plan.key ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isCurrent ? "Plan actuel" : "Choisir ce plan"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
