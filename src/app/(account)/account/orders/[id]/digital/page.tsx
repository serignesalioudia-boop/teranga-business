import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}


export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Produits digitaux — Commande ${id.slice(0, 8)}... — Teranga Business` };
}

export default async function DigitalDownloadPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      subOrders: {
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  isDigital: true,
                  digitalFileUrl: true,
                  digitalFileSize: true,
                },
              },
            },
          },
        },
      },
      payment: true,
    },
  });

  if (!order || order.userId !== user.id) {
    notFound();
  }

  const isPaid =
    order.payment?.status === "SUCCESS" ||
    order.status === "CONFIRMED" ||
    order.status === "PROCESSING" ||
    order.status === "SHIPPED" ||
    order.status === "DELIVERED";

  if (!isPaid) {
    return (
      <div className="space-y-6">
        <Link
          href={`/account/orders/${order.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la commande
        </Link>
        <div className="rounded-xl border p-8 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Commande non payée
          </p>
        </div>
      </div>
    );
  }

  const digitalItems = order.subOrders.flatMap((so) =>
    so.items
      .filter((item) => item.product?.isDigital && item.product?.digitalFileUrl)
      .map((item) => ({
        id: item.id,
        productName: item.product!.name,
        digitalFileUrl: item.product!.digitalFileUrl!,
        digitalFileSize: item.product!.digitalFileSize,
      })),
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/account/orders/${order.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la commande
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Produits digitaux</h1>
        <p className="text-sm text-muted-foreground">
          Commande <span className="font-mono">{order.number}</span>
        </p>
      </div>

      {digitalItems.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Aucun produit digital dans cette commande
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {digitalItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="font-bold">{item.productName}</p>
                {formatFileSize(item.digitalFileSize) && (
                  <p className="text-sm text-muted-foreground">
                    Taille : {formatFileSize(item.digitalFileSize)}
                  </p>
                )}
              </div>
              <Button asChild>
                <a
                  href={item.digitalFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
