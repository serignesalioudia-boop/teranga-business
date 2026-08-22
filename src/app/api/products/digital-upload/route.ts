import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { isCloudinaryConfigured, uploadMedia } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

const MAX_FILE_BYTES = 100 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary n'est pas configuré sur le serveur." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const productId = String(formData.get("productId") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }

  if (!productId) {
    return NextResponse.json(
      { error: "Identifiant de produit manquant." },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: { select: { sellerProfileId: true } } },
  });
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!seller || product.store.sellerProfileId !== seller.id) {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  }

  if (seller) {
    const planExpiresAt = seller.planExpiresAt;
    const effectivePlan =
      planExpiresAt && planExpiresAt < new Date() ? "FREE" : seller.plan;
    if (effectivePlan !== "CREATOR" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Les produits digitaux sont réservés au plan Créateur. Veuillez mettre à jour votre abonnement.",
        },
        { status: 403 },
      );
    }
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Fichier vide." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (100 Mo maximum)." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const uploaded = await uploadMedia({
      buffer,
      folder: "teranga-business/digital-products",
    });

    return NextResponse.json(
      {
        ok: true,
        file: {
          url: uploaded.secureUrl,
          publicId: uploaded.publicId,
          size: file.size,
          name: file.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[digital-upload]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier." },
      { status: 500 },
    );
  }
}
