// ============================================================
// DONNÉES DE DÉPART
// ============================================================
const STORAGE_KEYS = {
    panier: 'thiesMarketPanierZero',
    produits: 'thiesMarketProduitsZero',
    commandes: 'thiesMarketCommandesZero',
    clients: 'thiesMarketClientsZero',
    catalogueVersion: 'thiesMarketCatalogueVersionZero'
};

const ADMIN_EMAIL = 'admin@votreboutique.sn';
const ADMIN_PASSWORD = 'admin123'; // Démo seulement : à remplacer par une authentification serveur.
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ADMIN_PAGES = ['admin_dashboard', 'admin_produits', 'admin_commandes', 'admin_ajouter'];
const WHATSAPP_NUMBER = '22177000000'; // Remplacez par votre numéro WhatsApp
const CATALOGUE_VERSION = '2026-06-23-image-catalogue-v1';
const SOCIAL_NETWORKS = [
    { id: 'facebook', label: 'Facebook', icon: 'fab fa-facebook-f' },
    { id: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
    { id: 'tiktok', label: 'TikTok', icon: 'fab fa-tiktok' },
    { id: 'whatsapp', label: 'Statut WhatsApp', icon: 'fab fa-whatsapp' }
];

const categories = [
    { id: 1, nom: 'Catégorie 1', icon: 'fa-tag' },
    { id: 2, nom: 'Catégorie 2', icon: 'fa-tag' },
    { id: 3, nom: 'Catégorie 3', icon: 'fa-tag' }
];

// Ajoutez ici vos produits par défaut (optionnel)
const DEFAULT_PRODUITS = [];

const DEFAULT_COMMANDES = [];

const DEFAULT_CLIENTS = [];

function synchroniserCatalogueInitial(listeStockee) {
    const liste = Array.isArray(listeStockee) ? listeStockee : [];
    let versionCatalogue = '';
    try {
        versionCatalogue = localStorage.getItem(STORAGE_KEYS.catalogueVersion) || '';
    } catch (e) {
        console.warn('Impossible de lire la version du catalogue.', e);
    }

    if (versionCatalogue === CATALOGUE_VERSION) return liste;

    const imagesExistantes = new Set(liste.map(p => String(p.image || '')));
    const idsExistants = new Set(liste.map(p => Number(p.id)).filter(Number.isFinite));
    let prochainId = liste.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
    const ajouts = DEFAULT_PRODUITS
        .filter(p => !imagesExistantes.has(String(p.image || '')))
        .map(p => {
            const produit = copierValeur(p);
            if (idsExistants.has(Number(produit.id))) {
                while (idsExistants.has(prochainId)) prochainId += 1;
                produit.id = prochainId;
            }
            idsExistants.add(Number(produit.id));
            return produit;
        });

    const resultat = liste.concat(ajouts);
    sauvegarderDansStockage(STORAGE_KEYS.produits, resultat);
    try {
        localStorage.setItem(STORAGE_KEYS.catalogueVersion, CATALOGUE_VERSION);
    } catch (e) {
        console.warn('Impossible de sauvegarder la version du catalogue.', e);
    }
    return resultat;
}

let produits = synchroniserCatalogueInitial(chargerDepuisStockage(STORAGE_KEYS.produits, DEFAULT_PRODUITS));
let commandes = chargerDepuisStockage(STORAGE_KEYS.commandes, DEFAULT_COMMANDES);
let clients = chargerDepuisStockage(STORAGE_KEYS.clients, DEFAULT_CLIENTS);

// ============================================================
// ÉTAT
// ============================================================
let panier = chargerDepuisStockage(STORAGE_KEYS.panier, {});
let utilisateurConnecte = null; // {id, nom, email, role}
let formulaireAdminEnEdition = false;

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================
function copierValeur(valeur) {
    return JSON.parse(JSON.stringify(valeur));
}

function chargerDepuisStockage(cle, valeurParDefaut) {
    try {
        const valeur = localStorage.getItem(cle);
        return valeur ? JSON.parse(valeur) : copierValeur(valeurParDefaut);
    } catch (e) {
        console.warn(`Impossible de charger ${cle}.`, e);
        return copierValeur(valeurParDefaut);
    }
}

function sauvegarderDansStockage(cle, valeur) {
    try {
        localStorage.setItem(cle, JSON.stringify(valeur));
    } catch (e) {
        console.warn(`Impossible de sauvegarder ${cle}.`, e);
        afficherNotification('Sauvegarde locale impossible.');
    }
}

function escapeHTML(valeur) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(valeur ?? '').replace(/[&<>"']/g, caractere => map[caractere]);
}

function getImageSrc(image) {
    if (!image) return '';
    const valeur = String(image);
    if (valeur.startsWith('data:image/')) return valeur;
    return 'image/' + encodeURI(valeur.replace(/^image[s]?[\\/]/, ''));
}

function formatPrix(montant) {
    return Number(montant || 0).toLocaleString();
}

function getLibellePaiement(mode) {
    if (mode === 'wave') return 'Wave';
    if (mode === 'orange_money') return 'Orange Money';
    if (mode === 'livraison') return 'Paiement à la livraison';
    return 'A confirmer';
}

function getValeurChamp(id) {
    const champ = document.getElementById(id);
    return champ ? champ.value.trim() : '';
}

function getDetailsPanier() {
    const lignes = [];
    let total = 0;
    Object.keys(panier).forEach(id => {
        const produit = getProduitById(parseInt(id, 10));
        if (!produit) return;
        const quantite = Number(panier[id] || 0);
        const sousTotal = Number(produit.prix || 0) * quantite;
        total += sousTotal;
        lignes.push(`${produit.nom} x${quantite} - ${formatPrix(sousTotal)} FCFA`);
    });
    return { lignes, total };
}

function construireMessageWhatsApp() {
    const details = getDetailsPanier();
    const mode = document.querySelector('input[name="mode_paiement"]:checked');
    const nom = getValeurChamp('nomPrenom') || (utilisateurConnecte ? utilisateurConnecte.nom : 'Client');
    const adresse = getValeurChamp('adresseLivraison') || 'Adresse à confirmer';
    const telephone = getValeurChamp('numeroTelephone') || 'Téléphone à confirmer';
    const lignesProduits = details.lignes.length ? details.lignes.map(ligne => `- ${ligne}`) : ['- Aucun produit'];

    return [
        'Bonjour, je veux passer une commande.',
        '',
        `Client : ${nom}`,
        `Adresse de livraison : ${adresse}`,
        `Téléphone : ${telephone}`,
        '',
        'Produits :',
        ...lignesProduits,
        '',
        `Total : ${formatPrix(details.total)} FCFA`,
        `Paiement souhaité : ${getLibellePaiement(mode ? mode.value : '')}`
    ].join('\n');
}

function ouvrirCommandeWhatsApp(e) {
    if (e) e.preventDefault();
    if (Object.keys(panier).length === 0) {
        showFlash('flashPaiement', 'Panier vide. Ajoutez un produit avant de commander sur WhatsApp.', 'error');
        return false;
    }

    const message = encodeURIComponent(construireMessageWhatsApp());
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener');
    return false;
}

function getUrlBoutique() {
    return window.location.href.split('#')[0];
}

function construireTextePublicationProduit(produit) {
    return [
        `Nouveau produit : ${produit.nom}`,
        `${formatPrix(produit.prix)} FCFA`,
        produit.description || '',
        '',
        `Commander : ${getUrlBoutique()}`
    ].filter(Boolean).join('\n');
}

function copierTextePublication(texte) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texte).catch(() => {});
        return;
    }

    const zone = document.createElement('textarea');
    zone.value = texte;
    zone.setAttribute('readonly', '');
    zone.style.position = 'fixed';
    zone.style.left = '-9999px';
    document.body.appendChild(zone);
    zone.select();
    try {
        document.execCommand('copy');
    } catch (e) {
        console.warn('Copie automatique impossible.', e);
    }
    document.body.removeChild(zone);
}

function getUrlPublicationReseau(reseauId, produit) {
    const texte = construireTextePublicationProduit(produit);
    const texteEncode = encodeURIComponent(texte);
    const urlEncode = encodeURIComponent(getUrlBoutique());

    switch (reseauId) {
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${urlEncode}&quote=${texteEncode}`;
        case 'instagram':
            return 'https://www.instagram.com/';
        case 'tiktok':
            return 'https://www.tiktok.com/upload?lang=fr';
        case 'whatsapp':
            return `https://wa.me/?text=${texteEncode}`;
        default:
            return getUrlBoutique();
    }
}

function ouvrirPublicationProduit(reseauId, produitOuId) {
    const produit = typeof produitOuId === 'object' ? produitOuId : getProduitById(produitOuId);
    if (!produit) return false;
    copierTextePublication(construireTextePublicationProduit(produit));
    window.open(getUrlPublicationReseau(reseauId, produit), '_blank', 'noopener');
    return false;
}

function afficherPublicationSocialeProduit(produit) {
    const panel = document.getElementById('socialSharePanel');
    if (!panel || !produit) return;
    const texte = construireTextePublicationProduit(produit);
    const boutons = SOCIAL_NETWORKS.map(reseau => `
        <button type="button" class="btn btn-social btn-social-${escapeHTML(reseau.id)}" onclick="return ouvrirPublicationProduit('${escapeHTML(reseau.id)}', ${Number(produit.id)})">
            <i class="${escapeHTML(reseau.icon)}"></i> ${escapeHTML(reseau.label)}
        </button>
    `).join('');

    panel.innerHTML = `
        <h3>Publication du nouveau produit</h3>
        <p>${escapeHTML(produit.nom)}</p>
        <div class="social-share-actions">
            ${boutons}
            <button type="button" class="btn btn-outline" onclick="copierTextePublication(construireTextePublicationProduit(getProduitById(${Number(produit.id)}))); afficherNotification('Texte de publication copié'); return false;">
                <i class="fas fa-copy"></i> Copier le texte
            </button>
        </div>
        <div class="social-share-message">${escapeHTML(texte)}</div>
    `;
    panel.style.display = 'block';
}

function publierProduitSurTousReseaux(produit) {
    afficherPublicationSocialeProduit(produit);
    copierTextePublication(construireTextePublicationProduit(produit));
    if (!confirm('Ouvrir Facebook, Instagram, TikTok et WhatsApp pour publier ce nouveau produit ?')) return;
    SOCIAL_NETWORKS.forEach((reseau, index) => {
        setTimeout(() => ouvrirPublicationProduit(reseau.id, produit), index * 300);
    });
}

function genererCommandeId() {
    return commandes.reduce((max, cmd) => Math.max(max, Number(cmd.id) || 0), 0) + 1;
}

function sauvegarderProduits() {
    sauvegarderDansStockage(STORAGE_KEYS.produits, produits);
}

function sauvegarderCommandes() {
    sauvegarderDansStockage(STORAGE_KEYS.commandes, commandes);
}

function sauvegarderClients() {
    sauvegarderDansStockage(STORAGE_KEYS.clients, clients);
}

function getCategorieName(id) {
    const cat = categories.find(c => c.id === Number(id));
    return cat ? cat.nom : 'Non catégorisé';
}

function getProduitById(id) {
    return produits.find(p => Number(p.id) === Number(id));
}

function sauvegarderPanier() {
    sauvegarderDansStockage(STORAGE_KEYS.panier, panier);
    mettreAJourNbPanier();
}

function mettreAJourNbPanier() {
    const total = Object.values(panier).reduce((acc, qte) => acc + qte, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = total);
}

function afficherNotification(msg) {
    const notif = document.getElementById('notification');
    document.getElementById('notifMsg').textContent = msg;
    notif.classList.add('show');
    clearTimeout(notif._timeout);
    notif._timeout = setTimeout(() => notif.classList.remove('show'), 3000);
}

function showFlash(id, msg, type = 'info') {
    const el = document.getElementById(id);
    if (!el) return;
    if (msg) {
        el.textContent = msg;
        el.style.display = 'block';
        el.className = 'flash';
        if (type === 'error') {
            el.style.background = '#fee2e2';
            el.style.color = '#b91c1c';
        } else {
            el.style.background = '#dbeafe';
            el.style.color = '#1e40af';
        }
    } else {
        el.style.display = 'none';
    }
}

// ============================================================
// NAVIGATION
// ============================================================
function showPage(page) {
    if (ADMIN_PAGES.includes(page) && (!utilisateurConnecte || utilisateurConnecte.role !== 'admin')) {
        page = 'accueil';
        setTimeout(() => showFlash('flashAdmin', 'Connectez-vous avec un compte admin pour accéder à cette page.', 'error'), 0);
    }

    if (page === 'compte' && !utilisateurConnecte) {
        page = 'accueil';
        setTimeout(() => showFlash('flashPanier', 'Connectez-vous pour accéder à votre compte.', 'error'), 0);
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-main a').forEach(a => {
        a.classList.remove('active');
        if (a.dataset.page === page) a.classList.add('active');
    });

    switch (page) {
        case 'panier': afficherPanier(); break;
        case 'produits': afficherTousProduits(); break;
        case 'paiement': afficherPaiement(); break;
        case 'admin_produits': afficherAdminProduits(); break;
        case 'admin_commandes': afficherAdminCommandes(); break;
        case 'admin_dashboard': afficherAdminDashboard(); break;
        case 'compte': afficherHistorique(); break;
        case 'admin_ajouter':
            if (!formulaireAdminEnEdition) preparerFormulaireAdmin();
            formulaireAdminEnEdition = false;
            break;
    }

    document.getElementById('navMain').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('menuToggle').addEventListener('click', function() {
    document.getElementById('navMain').classList.toggle('open');
});

// ============================================================
// PAGE ACCUEIL
// ============================================================
function afficherCategories() {
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = categories.map(c => `
        <div class="category-card">
            <div class="category-icon"><i class="fas ${escapeHTML(c.icon)}"></i></div>
            <h3>${escapeHTML(c.nom)}</h3>
        </div>
    `).join('');
}

function afficherProduitsVedettes() {
    const grid = document.getElementById('featuredProducts');
    const vedettes = produits.slice(0, 4);
    grid.innerHTML = vedettes.map(p => genererCarteProduit(p)).join('');
    document.getElementById('statTotalProduits').textContent = produits.length;
}

function genererCarteProduit(p) {
    const id = Number(p.id);
    const imgSrc = getImageSrc(p.image);
    const nom = escapeHTML(p.nom);
    const categorie = escapeHTML(getCategorieName(p.categorie_id));
    return `
        <div class="product-card">
            <div class="product-image">
                ${imgSrc ? `<img src="${escapeHTML(imgSrc)}" alt="${nom}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
                <div class="fallback" style="${imgSrc ? 'display:none' : 'display:flex'}"><i class="fas fa-image"></i></div>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="ajouterAuPanier(${id})"><i class="fas fa-shopping-cart"></i></button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${categorie}</span>
                <h3>${nom}</h3>
                <div class="product-price">${formatPrix(p.prix)} FCFA</div>
                <a href="#" onclick="voirProduit(${id})" class="btn btn-sm btn-outline">Voir détails</a>
            </div>
        </div>
    `;
}

// ============================================================
// PAGE PRODUITS
// ============================================================
function afficherTousProduits(filtre = '') {
    const grid = document.getElementById('allProducts');
    let liste = produits;
    if (filtre) {
        const recherche = filtre.toLowerCase().trim();
        liste = produits.filter(p =>
            String(p.nom || '').toLowerCase().includes(recherche) ||
            String(p.description || '').toLowerCase().includes(recherche)
        );
    }
    if (liste.length === 0) {
        grid.innerHTML = '<p>Aucun produit trouvé.</p>';
        return;
    }
    grid.innerHTML = liste.map(p => genererCarteProduit(p)).join('');
}

function filterProducts() {
    const search = document.getElementById('searchInput').value;
    afficherTousProduits(search);
}

// ============================================================
// PAGE DÉTAIL PRODUIT
// ============================================================
function voirProduit(id) {
    const p = getProduitById(id);
    if (!p) return;
    const produitId = Number(p.id);
    const imgSrc = getImageSrc(p.image);
    const nom = escapeHTML(p.nom);
    const description = escapeHTML(p.description);
    const categorie = escapeHTML(getCategorieName(p.categorie_id));
    const stock = Math.max(0, Number(p.stock || 0));
    const container = document.getElementById('productDetail');
    container.innerHTML = `
        <div class="product-detail-image">
            ${imgSrc ? `<img src="${escapeHTML(imgSrc)}" alt="${nom}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
            <div class="fallback" style="${imgSrc ? 'display:none' : 'display:flex;justify-content:center;align-items:center;height:100%;font-size:4rem;color:#94a3b8;'}"><i class="fas fa-image"></i></div>
        </div>
        <div class="product-detail-info">
            <span class="product-category">${categorie}</span>
            <h1>${nom}</h1>
            <div class="product-price">${formatPrix(p.prix)} FCFA</div>
            <p class="product-desc">${description}</p>
            <p><strong>Stock :</strong> ${stock > 0 ? stock + ' disponible(s)' : 'Rupture'}</p>
            ${stock > 0 ? `
                <form onsubmit="ajouterAuPanier(${produitId}, parseInt(document.getElementById('qteDetail').value)); return false;">
                    <div class="qty-selector">
                        <label>Quantité :</label>
                        <input type="number" id="qteDetail" value="1" min="1" max="${stock}">
                    </div>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-cart-plus"></i> Ajouter au panier</button>
                </form>
            ` : ''}
        </div>
    `;
    showPage('produit');
}

// ============================================================
// PANIER
// ============================================================
function ajouterAuPanier(id, qte = 1) {
    const p = getProduitById(id);
    if (!p) return;
    qte = parseInt(qte, 10);
    if (isNaN(qte) || qte < 1) qte = 1;
    if (p.stock <= 0) {
        afficherNotification('Stock épuisé !');
        return;
    }
    if (!panier[id]) panier[id] = 0;
    const nouvelleQte = panier[id] + qte;
    if (nouvelleQte > p.stock) {
        afficherNotification('Quantité demandée dépasse le stock disponible !');
        return;
    }
    panier[id] = nouvelleQte;
    sauvegarderPanier();
    afficherNotification(`${p.nom} ajouté au panier (${nouvelleQte})`);
    if (document.getElementById('page-produit').classList.contains('active')) {
        voirProduit(id);
    }
    if (document.getElementById('page-panier').classList.contains('active')) {
        afficherPanier();
    }
}

function afficherPanier() {
    const container = document.getElementById('panierContent');
    showFlash('flashPanier', '');
    const items = Object.keys(panier);
    if (items.length === 0) {
        container.innerHTML = '<p>Votre panier est vide. <a href="#" onclick="showPage(\'produits\')">Continuer vos achats</a></p>';
        return;
    }
    let html = `<table class="panier-table"><thead><tr><th>Produit</th><th>Prix unit.</th><th>Quantité</th><th>Sous-total</th><th>Action</th></tr></thead><tbody>`;
    let total = 0;
    items.forEach(id => {
        const p = getProduitById(parseInt(id));
        if (!p) return;
        const qte = panier[id];
        const sousTotal = p.prix * qte;
        total += sousTotal;
        html += `
            <tr>
                <td>${escapeHTML(p.nom)}</td>
                <td>${formatPrix(p.prix)} FCFA</td>
                <td>
                    <form onsubmit="modifierQuantite(${p.id}, this.querySelector('input').value); return false;" style="display:inline;">
                        <input type="number" value="${qte}" min="1" max="${p.stock}" style="width:60px;">
                        <button type="submit" class="btn btn-sm btn-primary"><i class="fas fa-sync-alt"></i></button>
                    </form>
                </td>
                <td>${formatPrix(sousTotal)} FCFA</td>
                <td><button class="btn btn-sm btn-danger" onclick="supprimerDuPanier(${p.id})"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    });
    html += `</tbody><tfoot><tr><td colspan="3"><strong>Total</strong></td><td><strong>${formatPrix(total)} FCFA</strong></td>
        <td><button class="btn btn-danger" onclick="viderPanier()">Vider</button></td>
    </tr></tfoot></table>
    <div class="panier-actions">
        <a href="#" onclick="showPage('produits')" class="btn btn-outline">Continuer les achats</a>
        <a href="#" onclick="showPage('paiement')" class="btn btn-primary">Passer à la caisse</a>
    </div>`;
    container.innerHTML = html;
}

function modifierQuantite(id, qte) {
    qte = parseInt(qte);
    if (isNaN(qte) || qte < 1) qte = 1;
    const p = getProduitById(id);
    if (!p) return;
    if (qte > p.stock) {
        afficherNotification('Stock insuffisant !');
        return;
    }
    panier[id] = qte;
    sauvegarderPanier();
    afficherPanier();
}

function supprimerDuPanier(id) {
    delete panier[id];
    sauvegarderPanier();
    afficherPanier();
}

function viderPanier() {
    if (confirm('Vider le panier ?')) {
        panier = {};
        sauvegarderPanier();
        afficherPanier();
    }
}

// ============================================================
// PAIEMENT
// ============================================================
function afficherPaiement() {
    const resume = document.getElementById('paiementResume');
    const items = Object.keys(panier);
    if (items.length === 0) {
        showFlash('flashPaiement', 'Panier vide. Retournez au panier.', 'error');
        resume.innerHTML = '<p>Panier vide.</p>';
        return;
    }
    let html = '<h2>Récapitulatif</h2>';
    let total = 0;
    items.forEach(id => {
        const p = getProduitById(parseInt(id));
        if (!p) return;
        const qte = panier[id];
        const st = p.prix * qte;
        total += st;
        html += `<div class="ligne-produit"><span>${escapeHTML(p.nom)} x${qte}</span><span>${formatPrix(st)} FCFA</span></div>`;
    });
    html += `<div class="total">Total : ${formatPrix(total)} FCFA</div>`;
    resume.innerHTML = html;
    showFlash('flashPaiement', '');
    mettreAJourAffichagePaiement();
}

function mettreAJourAffichagePaiement() {
    const mode = document.querySelector('input[name="mode_paiement"]:checked');
    const qrs = document.querySelector('.checkout-qrs');
    if (!qrs) return;
    qrs.style.display = mode && mode.value === 'livraison' ? 'none' : 'grid';
}

function confirmerPaiement(e) {
    e.preventDefault();
    const mode = document.querySelector('input[name="mode_paiement"]:checked');
    if (!mode) {
        showFlash('flashPaiement', 'Veuillez choisir un mode de paiement.', 'error');
        return false;
    }
    const nomPrenom = getValeurChamp('nomPrenom');
    if (!nomPrenom) {
        showFlash('flashPaiement', 'Veuillez saisir votre nom et prénom.', 'error');
        return false;
    }
    const adresse = getValeurChamp('adresseLivraison');
    if (!adresse) {
        showFlash('flashPaiement', 'Veuillez saisir une adresse de livraison.', 'error');
        return false;
    }
    const numeroTelephone = getValeurChamp('numeroTelephone');
    if (!numeroTelephone) {
        showFlash('flashPaiement', 'Veuillez saisir votre numéro de téléphone.', 'error');
        return false;
    }
    const items = Object.keys(panier);
    if (items.length === 0) {
        showFlash('flashPaiement', 'Panier vide.', 'error');
        return false;
    }
    const total = items.reduce((acc, id) => {
        const p = getProduitById(parseInt(id));
        return acc + (p ? p.prix * panier[id] : 0);
    }, 0);
    const commandeId = genererCommandeId();
    const newCmd = {
        id: commandeId,
        client: utilisateurConnecte ? utilisateurConnecte.nom : nomPrenom,
        nom_prenom: nomPrenom,
        date: new Date().toLocaleString(),
        total: total,
        statut: 'confirmée',
        mode_paiement: mode.value,
        adresse: adresse,
        telephone: numeroTelephone
    };
    commandes.unshift(newCmd);
    items.forEach(id => {
        const p = getProduitById(parseInt(id));
        if (p) p.stock = Math.max(0, Number(p.stock || 0) - Number(panier[id] || 0));
    });
    sauvegarderCommandes();
    sauvegarderProduits();
    panier = {};
    sauvegarderPanier();
    document.getElementById('confirmationId').textContent = String(commandeId).padStart(6, '0');
    document.getElementById('confirmationTotal').textContent = formatPrix(total);
    document.getElementById('confirmationMode').textContent = getLibellePaiement(mode.value);
    document.getElementById('confirmationAdresse').textContent = adresse;
    document.getElementById('confirmationStatut').textContent = 'confirmée';
    showPage('confirmation');
    return false;
}

// ============================================================
// CONNEXION / INSCRIPTION / DÉCONNEXION
// ============================================================
// Fonctions de connexion/inscription supprimées — gérées par la plateforme
function connexionSubmit(e) { e.preventDefault(); return false; }
function inscriptionSubmit(e) { e.preventDefault(); return false; }

function deconnexion() {
    utilisateurConnecte = null;
    mettreAJourHeader();
    showPage('accueil');
}

// ============================================================
// COMPTE
// ============================================================
function afficherHistorique() {
    const container = document.getElementById('historiqueCommandes');
    document.getElementById('userName').textContent = utilisateurConnecte ? utilisateurConnecte.nom : 'Client';
    const mesCommandes = commandes.filter(c => c.client === (utilisateurConnecte ? utilisateurConnecte.nom : ''));
    if (mesCommandes.length === 0) {
        container.innerHTML = '<p>Vous n\'avez pas encore passé de commande.</p>';
        return;
    }
    let html = `<table class="panier-table"><thead><tr><th>#Commande</th><th>Date</th><th>Total</th><th>Statut</th><th>Paiement</th></tr></thead><tbody>`;
    mesCommandes.forEach(cmd => {
        html += `<tr><td>#${String(cmd.id).padStart(6, '0')}</td><td>${escapeHTML(cmd.date)}</td><td>${formatPrix(cmd.total)} FCFA</td><td>${escapeHTML(cmd.statut)}</td><td>${getLibellePaiement(cmd.mode_paiement)}</td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ============================================================
// ADMIN
// ============================================================
function afficherAdminDashboard() {
    document.getElementById('statProduits').textContent = produits.length;
    document.getElementById('statCommandes').textContent = commandes.length;
    document.getElementById('statClients').textContent = clients.length;
    showFlash('flashAdmin', '');
}

function afficherAdminProduits() {
    const tbody = document.getElementById('adminProduitsTable');
    if (produits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Aucun produit enregistré.</td></tr>';
        showFlash('flashAdminProduits', '');
        return;
    }

    tbody.innerHTML = produits.map(p => {
        const id = Number(p.id);
        return `
            <tr>
                <td>${id}</td>
                <td>${escapeHTML(p.nom)}</td>
                <td>${formatPrix(p.prix)} FCFA</td>
                <td>${Number(p.stock || 0)}</td>
                <td>${escapeHTML(getCategorieName(p.categorie_id))}</td>
                <td>
                    <a href="#" onclick="editerProduit(${id})" class="btn btn-sm btn-primary">Modifier</a>
                    <a href="#" onclick="supprimerProduit(${id})" class="btn btn-sm btn-danger">Supprimer</a>
                </td>
            </tr>
        `;
    }).join('');
    showFlash('flashAdminProduits', '');
}

function preparerFormulaireAdmin() {
    // Remplir le select des catégories (déjà fait dans l'init)
    // Réinitialiser le formulaire
    document.getElementById('editProduitId').value = '';
    document.getElementById('adminAjouterTitle').textContent = 'Ajouter un produit';
    document.getElementById('adminProduitSubmitBtn').textContent = 'Ajouter';
    document.getElementById('adminProduitForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    const socialPanel = document.getElementById('socialSharePanel');
    if (socialPanel) socialPanel.style.display = 'none';
    showFlash('flashAdminAjouter', '');
}

function editerProduit(id) {
    const p = getProduitById(id);
    if (!p) return;
    formulaireAdminEnEdition = true;
    document.getElementById('editProduitId').value = p.id;
    document.getElementById('prodNom').value = p.nom;
    document.getElementById('prodDescription').value = p.description;
    document.getElementById('prodPrix').value = p.prix;
    document.getElementById('prodStock').value = p.stock;
    document.getElementById('prodCategorie').value = p.categorie_id;
    document.getElementById('adminAjouterTitle').textContent = 'Modifier le produit';
    document.getElementById('adminProduitSubmitBtn').textContent = 'Mettre à jour';
    // Afficher l'image actuelle si disponible
    const imgSrc = getImageSrc(p.image);
    if (imgSrc) {
        document.getElementById('previewImg').src = imgSrc;
        document.getElementById('imagePreview').style.display = 'block';
    } else {
        document.getElementById('imagePreview').style.display = 'none';
    }
    showPage('admin_ajouter');
}

function adminSubmitProduit(e) {
    e.preventDefault();
    const id = document.getElementById('editProduitId').value;
    const nom = document.getElementById('prodNom').value.trim();
    const description = document.getElementById('prodDescription').value.trim();
    const prix = parseFloat(document.getElementById('prodPrix').value);
    const categorie_id = parseInt(document.getElementById('prodCategorie').value);
    const stock = parseInt(document.getElementById('prodStock').value, 10);
    const fileInput = document.getElementById('prodImageFile');
    const file = fileInput.files[0];

    if (!nom || isNaN(prix) || prix <= 0 || isNaN(stock) || stock < 0) {
        showFlash('flashAdminAjouter', 'Veuillez remplir tous les champs obligatoires.', 'error');
        return false;
    }

    if (file && file.size > MAX_IMAGE_SIZE) {
        showFlash('flashAdminAjouter', 'Image trop lourde. Maximum autorisé : 2 Mo.', 'error');
        return false;
    }

    // Fonction pour traiter l'upload de l'image
    const traiterImage = (imageData) => {
        let produitAPublier = null;
        if (id) {
            // Modification
            const idx = produits.findIndex(p => Number(p.id) === Number(id));
            if (idx !== -1) {
                produits[idx] = { ...produits[idx], nom, description, prix, categorie_id, stock, image: imageData || produits[idx].image };
            }
            showFlash('flashAdminAjouter', 'Produit modifié.');
        } else {
            // Ajout
            const newId = produits.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
            produitAPublier = { id: newId, nom, description, prix, categorie_id, stock, image: imageData || 'default.jpg' };
            produits.push(produitAPublier);
            showFlash('flashAdminAjouter', 'Produit ajouté.');
        }
        sauvegarderProduits();
        // Réinitialiser le formulaire
        document.getElementById('editProduitId').value = '';
        document.getElementById('adminAjouterTitle').textContent = 'Ajouter un produit';
        document.getElementById('adminProduitSubmitBtn').textContent = 'Ajouter';
        document.getElementById('adminProduitForm').reset();
        document.getElementById('imagePreview').style.display = 'none';
        // Recharger les listes
        afficherAdminProduits();
        afficherProduitsVedettes();
        afficherTousProduits();
        showPage('admin_produits');
        if (produitAPublier) publierProduitSurTousReseaux(produitAPublier);
    };

    if (file) {
        // Lire le fichier et le convertir en base64
        const reader = new FileReader();
        reader.onload = function(e) {
            traiterImage(e.target.result);
        };
        reader.onerror = function() {
            showFlash('flashAdminAjouter', 'Erreur lors de la lecture de l\'image.', 'error');
        };
        reader.readAsDataURL(file);
    } else {
        // Pas de nouvelle image, conserver l'ancienne
        traiterImage(null);
    }
    return false;
}

function supprimerProduit(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    produits = produits.filter(p => Number(p.id) !== Number(id));
    sauvegarderProduits();
    afficherAdminProduits();
    afficherProduitsVedettes();
    afficherTousProduits();
    showFlash('flashAdminProduits', 'Produit supprimé.');
}

function afficherAdminCommandes() {
    const tbody = document.getElementById('adminCommandesTable');
    if (commandes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10">Aucune commande enregistrée.</td></tr>';
        showFlash('flashAdminCommandes', '');
        return;
    }

    tbody.innerHTML = commandes.map(cmd => {
        const id = Number(cmd.id);
        const client = cmd.client || cmd.nom_prenom || 'Client';
        const nomPrenom = cmd.nom_prenom || cmd.client || 'Non renseigné';
        const adresse = cmd.adresse || 'Non renseignée';
        const telephone = cmd.telephone || cmd.numero || 'Non renseigné';
        return `
            <tr>
                <td>#${String(id).padStart(6, '0')}</td>
                <td>${escapeHTML(client)}</td>
                <td>${escapeHTML(nomPrenom)}</td>
                <td class="admin-client-info">${escapeHTML(adresse)}</td>
                <td>${escapeHTML(telephone)}</td>
                <td>${escapeHTML(cmd.date)}</td>
                <td>${formatPrix(cmd.total)} FCFA</td>
                <td>${escapeHTML(cmd.statut)}</td>
                <td>${getLibellePaiement(cmd.mode_paiement)}</td>
                <td>
                    <form onsubmit="return updateStatut(${id}, this.querySelector('select').value)">
                        <select>
                            <option value="en attente" ${cmd.statut === 'en attente' ? 'selected' : ''}>En attente</option>
                            <option value="confirmée" ${cmd.statut === 'confirmée' ? 'selected' : ''}>Confirmée</option>
                            <option value="expédiée" ${cmd.statut === 'expédiée' ? 'selected' : ''}>Expédiée</option>
                            <option value="livrée" ${cmd.statut === 'livrée' ? 'selected' : ''}>Livrée</option>
                        </select>
                        <button type="submit" class="btn btn-sm btn-primary">Mettre à jour</button>
                    </form>
                </td>
            </tr>
        `;
    }).join('');
    showFlash('flashAdminCommandes', '');
}

function updateStatut(id, nouveauStatut) {
    const cmd = commandes.find(c => Number(c.id) === Number(id));
    if (cmd) {
        cmd.statut = nouveauStatut;
        sauvegarderCommandes();
        showFlash('flashAdminCommandes', 'Statut mis à jour.');
        afficherAdminCommandes();
    }
    return false;
}

// ============================================================
// HEADER DYNAMIQUE
// ============================================================
function mettreAJourHeader() {
    const nav = document.querySelector('.nav-main ul');
    while (nav.children.length > 3) {
        nav.removeChild(nav.lastChild);
    }
    if (utilisateurConnecte) {
        const liCompte = document.createElement('li');
        liCompte.innerHTML = `<a href="#" onclick="showPage('compte')"><i class="fas fa-user"></i> Mon compte</a>`;
        nav.appendChild(liCompte);
        if (utilisateurConnecte.role === 'admin') {
            const liAdmin = document.createElement('li');
            liAdmin.innerHTML = `<a href="#" onclick="showPage('admin_dashboard')"><i class="fas fa-cog"></i> Admin</a>`;
            nav.appendChild(liAdmin);
        }
        const liDecon = document.createElement('li');
        liDecon.innerHTML = `<a href="#" onclick="deconnexion()"><i class="fas fa-sign-out-alt"></i> Déconnexion</a>`;
        nav.appendChild(liDecon);
    }
    mettreAJourNbPanier();
}

// ============================================================
// APERÇU DE L'IMAGE LORS DU TÉLÉCHARGEMENT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('prodImageFile');
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (!fileInput || !preview || !previewImg) return;

    fileInput.addEventListener('change', function(e) {
        const file = this.files[0];
        if (file) {
            if (file.size > MAX_IMAGE_SIZE) {
                this.value = '';
                preview.style.display = 'none';
                showFlash('flashAdminAjouter', 'Image trop lourde. Maximum autorisé : 2 Mo.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(ev) {
                previewImg.src = ev.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    });

    document.querySelectorAll('input[name="mode_paiement"]').forEach(input => {
        input.addEventListener('change', mettreAJourAffichagePaiement);
    });
});

// ============================================================
// INITIALISATION
// ============================================================
function init() {
    afficherCategories();
    afficherProduitsVedettes();
    afficherTousProduits();
    mettreAJourNbPanier();
    mettreAJourHeader();
    // Remplir le select des catégories dans admin
    const select = document.getElementById('prodCategorie');
    select.innerHTML = categories.map(c => `<option value="${c.id}">${escapeHTML(c.nom)}</option>`).join('');
    // Connexion automatique pour démo (optionnel)
    // utilisateurConnecte = { id: 1, nom: 'Client Test', email: 'client@test.com', role: 'client' };
    // mettreAJourHeader();
}

document.addEventListener('DOMContentLoaded', init);

