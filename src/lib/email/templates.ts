const COLORS = {
  primary: "#16a34a",
  bg: "#f9fafb",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
};

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:system-ui,-apple-system,sans-serif;color:${COLORS.text}">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
  <tr><td style="background:${COLORS.primary};color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px;font-weight:700">Teranga Business</h1>
  </td></tr>
  <tr><td style="background:#fff;padding:24px;border-radius:0 0 8px 8px;border:1px solid ${COLORS.border};border-top:none">
${content}
  </td></tr>
  <tr><td style="padding:16px 0;text-align:center;color:${COLORS.muted};font-size:12px">
    © ${new Date().getFullYear()} Teranga Business — La marketplace du Sénégal
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Bienvenue sur Teranga Business !",
    html: wrapper(`
      <h2 style="margin:0 0 12px">Bienvenue ${name} 👋</h2>
      <p style="margin:0 0 16px;color:${COLORS.muted}">
        Votre compte a été créé avec succès. Vous pouvez dès maintenant explorer nos produits et commencer vos achats.
      </p>
      <a href="${process.env.NEXTAUTH_URL ?? "https://terangabusiness.sn"}/products"
         style="display:inline-block;background:${COLORS.primary};color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        Découvrir les produits
      </a>
    `),
  };
}

export function orderConfirmationEmail(params: {
  name: string;
  orderNumber: string;
  total: string;
  items: string;
}): { subject: string; html: string } {
  return {
    subject: `Commande ${params.orderNumber} confirmée`,
    html: wrapper(`
      <h2 style="margin:0 0 12px">Commande confirmée ✓</h2>
      <p style="margin:0 0 4px;color:${COLORS.muted}">Bonjour ${params.name},</p>
      <p style="margin:0 0 16px;color:${COLORS.muted}">
        Votre commande <strong>${params.orderNumber}</strong> a été enregistrée avec succès.
      </p>
      <table width="100%" style="border-collapse:collapse;margin-bottom:16px">
        <tr style="border-bottom:1px solid ${COLORS.border}">
          <td style="padding:8px 0;font-weight:600">Articles</td>
          <td style="padding:8px 0;text-align:right">${params.items}</td>
        </tr>
        <tr style="border-bottom:1px solid ${COLORS.border}">
          <td style="padding:8px 0;font-weight:600">Total</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:${COLORS.primary}">${params.total} FCFA</td>
        </tr>
      </table>
      <a href="${process.env.NEXTAUTH_URL ?? "https://terangabusiness.sn"}/account/orders"
         style="display:inline-block;background:${COLORS.primary};color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        Suivre ma commande
      </a>
    `),
  };
}

export function orderStatusEmail(params: {
  name: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
}): { subject: string; html: string } {
  return {
    subject: `Commande ${params.orderNumber} — ${params.statusLabel}`,
    html: wrapper(`
      <h2 style="margin:0 0 12px">Mise à jour de commande</h2>
      <p style="margin:0 0 4px;color:${COLORS.muted}">Bonjour ${params.name},</p>
      <p style="margin:0 0 16px;color:${COLORS.muted}">
        La commande <strong>${params.orderNumber}</strong> est maintenant :
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;margin-bottom:16px;text-align:center">
        <span style="font-size:18px;font-weight:700;color:${COLORS.primary}">${params.statusLabel}</span>
      </div>
      <a href="${process.env.NEXTAUTH_URL ?? "https://terangabusiness.sn"}/account/orders"
         style="display:inline-block;background:${COLORS.primary};color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        Voir ma commande
      </a>
    `),
  };
}

export function sellerNewOrderEmail(params: {
  sellerName: string;
  orderNumber: string;
  items: string;
  total: string;
}): { subject: string; html: string } {
  return {
    subject: `Nouvelle commande ${params.orderNumber}`,
    html: wrapper(`
      <h2 style="margin:0 0 12px">Nouvelle commande reçue 🛒</h2>
      <p style="margin:0 0 4px;color:${COLORS.muted}">Bonjour ${params.sellerName},</p>
      <p style="margin:0 0 16px;color:${COLORS.muted}">
        Vous avez reçu une nouvelle commande <strong>${params.orderNumber}</strong>.
      </p>
      <table width="100%" style="border-collapse:collapse;margin-bottom:16px">
        <tr style="border-bottom:1px solid ${COLORS.border}">
          <td style="padding:8px 0;font-weight:600">Articles</td>
          <td style="padding:8px 0;text-align:right">${params.items}</td>
        </tr>
        <tr style="border-bottom:1px solid ${COLORS.border}">
          <td style="padding:8px 0;font-weight:600">Total</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:${COLORS.primary}">${params.total} FCFA</td>
        </tr>
      </table>
      <a href="${process.env.NEXTAUTH_URL ?? "https://terangabusiness.sn"}/seller/orders"
         style="display:inline-block;background:${COLORS.primary};color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        Gérer la commande
      </a>
    `),
  };
}

export function deliveryUpdateEmail(params: {
  name: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
}): { subject: string; html: string } {
  return {
    subject: `Livraison ${params.orderNumber} — ${params.statusLabel}`,
    html: wrapper(`
      <h2 style="margin:0 0 12px">Mise à jour de livraison</h2>
      <p style="margin:0 0 4px;color:${COLORS.muted}">Bonjour ${params.name},</p>
      <p style="margin:0 0 16px;color:${COLORS.muted}">
        La livraison de la commande <strong>${params.orderNumber}</strong> est maintenant :
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px 16px;margin-bottom:16px;text-align:center">
        <span style="font-size:18px;font-weight:700;color:#2563eb">${params.statusLabel}</span>
      </div>
      <a href="${process.env.NEXTAUTH_URL ?? "https://terangabusiness.sn"}/account/deliveries/${params.orderNumber}"
         style="display:inline-block;background:${COLORS.primary};color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        Suivre la livraison
      </a>
    `),
  };
}

export function digitalProductEmail(params: {
  name: string;
  productName: string;
  orderNumber: string;
  downloadUrl: string;
  fileSize: string;
}): { subject: string; html: string } {
  return {
    subject: `Votre produit digital « ${params.productName} » est prêt`,
    html: wrapper(`
      <h2 style="margin:0 0 12px">Produit digital prêt à télécharger 📥</h2>
      <p style="margin:0 0 4px;color:${COLORS.muted}">Bonjour ${params.name},</p>
      <p style="margin:0 0 16px;color:${COLORS.muted}">
        Votre produit digital <strong>« ${params.productName} »</strong> de la commande <strong>${params.orderNumber}</strong> est maintenant disponible.
      </p>
      <table width="100%" style="border-collapse:collapse;margin-bottom:16px">
        <tr style="border-bottom:1px solid ${COLORS.border}">
          <td style="padding:8px 0;font-weight:600">Produit</td>
          <td style="padding:8px 0;text-align:right">${params.productName}</td>
        </tr>
        <tr style="border-bottom:1px solid ${COLORS.border}">
          <td style="padding:8px 0;font-weight:600">Taille</td>
          <td style="padding:8px 0;text-align:right">${params.fileSize}</td>
        </tr>
      </table>
      <a href="${params.downloadUrl}"
         style="display:inline-block;background:${COLORS.primary};color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        Télécharger maintenant
      </a>
      <p style="margin:16px 0 0;color:${COLORS.muted};font-size:13px">
        Vous pouvez also accéder à vos téléchargements depuis votre espace client.
      </p>
    `),
  };
}
