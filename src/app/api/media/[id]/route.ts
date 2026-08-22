import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { deleteMedia } from "@/lib/cloudinary";
import { isMediaOwnerOrAdmin, requireMediaActor } from "@/lib/media-access";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const actor = await requireMediaActor(session);
  if (!actor) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  }

  const allowed = await isMediaOwnerOrAdmin(actor, id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Accès refusé à cette ressource." },
      { status: 403 },
    );
  }

  if (media.publicId) {
    try {
      await deleteMedia(media.publicId);
    } catch (error) {
      console.error("[media/delete] Cloudinary", error);
    }
  }

  await prisma.mediaAsset.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
