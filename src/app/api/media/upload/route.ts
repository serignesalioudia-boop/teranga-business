import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { MediaType } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/auth";
import { isCloudinaryConfigured, uploadMedia } from "@/lib/cloudinary";
import {
  assertCanManageTarget,
  requireMediaActor,
  type MediaTarget,
} from "@/lib/media-access";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const ALLOWED_MIME: Record<string, MediaType> = {
  "image/jpeg": MediaType.IMAGE,
  "image/png": MediaType.IMAGE,
  "image/webp": MediaType.IMAGE,
  "image/gif": MediaType.IMAGE,
  "image/avif": MediaType.IMAGE,
  "video/mp4": MediaType.VIDEO,
  "video/webm": MediaType.VIDEO,
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const actor = await requireMediaActor(session);
  if (!actor) {
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
  const target = formData.get("target");
  const targetId = String(formData.get("targetId") ?? "");
  const alt = String(formData.get("alt") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }

  if (target !== "product" && target !== "store") {
    return NextResponse.json(
      { error: "Cible invalide (product ou store)." },
      { status: 400 },
    );
  }

  if (!targetId) {
    return NextResponse.json(
      { error: "Identifiant de cible manquant." },
      { status: 400 },
    );
  }

  if (alt.length > 500) {
    return NextResponse.json(
      { error: "Le texte alternatif est trop long (500 caractères max)." },
      { status: 400 },
    );
  }

  const mediaType = ALLOWED_MIME[file.type];
  if (!mediaType) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé." },
      { status: 400 },
    );
  }

  const maxBytes =
    mediaType === MediaType.VIDEO ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size === 0) {
    return NextResponse.json({ error: "Fichier vide." }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: "Fichier trop volumineux." },
      { status: 400 },
    );
  }

  const allowed = await assertCanManageTarget(actor, target as MediaTarget, targetId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Accès refusé à cette ressource." },
      { status: 403 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const uploaded = await uploadMedia({
      buffer,
      folder:
        target === "product"
          ? "teranga-business/products"
          : "teranga-business/stores",
    });

    const position = await prisma.mediaAsset.count({
      where: target === "product" ? { productId: targetId } : { storeId: targetId },
    });

    const media = await prisma.mediaAsset.create({
      data: {
        ...(target === "product" ? { productId: targetId } : { storeId: targetId }),
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
        alt: alt || null,
        type: mediaType,
        position,
      },
    });

    return NextResponse.json({ ok: true, media }, { status: 201 });
  } catch (error) {
    console.error("[media/upload]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload Cloudinary." },
      { status: 500 },
    );
  }
}
