# 🍎 Guide iOS — Publier Teranga Business sur l'App Store

## Prérequis

### 1. Compte Apple Developer (OBLIGATOIRE)
- Va sur https://developer.apple.com/programs/enroll/
- Crée un compte Apple (si tu n'en as pas)
- Inscris-toi au **Apple Developer Program** → **99$/an** (~60 000 FCFA/an)
- C'est OBLIGATOIRE pour publier sur l'App Store

### 2. Identifiants Apple à préparer
Une fois inscrit, tu auras besoin de :
- **Apple Team ID** : visible sur https://developer.apple.com/account → "Membership Details"
- **Bundle ID** : `sn.terangabusiness.app` (déjà configuré dans le projet)

---

## Méthode 1 — GitHub Actions (Recommandé, gratuit)

### Étape 1 : Créer un dépôt GitHub
1. Va sur https://github.com/new
2. Nomme le dépôt : `teranga-business`
3. Choisis **Private** (recommandé)
4. Ne coche PAS "Add a README" (on a déjà le code)
5. Clique "Create repository"

### Étape 2 : Pousser le code
Sur ton PC Windows, ouvre un terminal dans le dossier du projet :
```bash
git init
git add .
git commit -m "Version iOS pour App Store"
git branch -M main
git remote add origin https://github.com/TON_UTILISATEUR/teranga-business.git
git push -u origin main
```

### Étape 3 : Configurer les secrets GitHub
1. Va sur ton dépôt GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Ajoute ces secrets :

| Nom du secret | Valeur |
|---|---|
| `APP_STORE_CONNECT_API_KEY` | Ta clé API App Store Connect (voir ci-dessous) |
| `APP_STORE_CONNECT_ISSUER_ID` | L'issuer ID de ta clé API |
| `APP_STORE_CONNECT_KEY_ID` | L'ID de ta clé API |
| `APPLE_TEAM_ID` | Ton Team ID Apple |

### Étape 4 : Créer une clé API App Store Connect
1. Va sur https://appstoreconnect.apple.com/access/integrations/api
2. Clique "+" pour créer une nouvelle clé
3. Nomme-la : `GitHub Actions Build`
4. Coche **Admin** access
5. Télécharge le fichier `.p8` (tu ne pourras le télécharger qu'une seule fois !)
6. Note le **Key ID** et l'**Issuer ID**

### Étape 5 : Lancer le build
1. Va sur ton dépôt GitHub → **Actions**
2. Clique sur "Build iOS (Teranga Business)"
3. Clique "Run workflow"
4. Le build prend ~15-20 minutes
5. Une fois terminé, télécharge l'IPA depuis les **Artifacts**

### Étape 6 : Soumettre à l'App Store
1. Télécharge **Transporter** sur le Mac App Store (gratuit)
2. Ouvre Transporter et connecte-toi avec ton compte Apple Developer
3. Glisse-dépose l'IPA dans Transporter
4. Clique "Livrer" (Deliver)
5. Va sur https://appstoreconnect.apple.com → ton app → "Version"
6. Remplis les informations (description, captures d'écran, etc.)
7. Clique "Soumettre pour examen"

---

## Méthode 2 — EAS Build (Alternative)

### Étape 1 : Installer EAS CLI
```bash
npm install -g eas-cli
```

### Étape 2 : Se connecter à Expo
```bash
eas login
```
(Crée un compte gratuit sur https://expo.dev si nécessaire)

### Étape 3 : Configurer le projet
```bash
eas build:configure --platform ios
```

### Étape 4 : Lancer le build
```bash
eas build --platform ios --profile production
```

### Étape 5 : Soumettre à l'App Store
```bash
eas submit --platform ios --latest
```

---

## Méthode 3 — Mac Cloud (MacinCloud)

Si tu veux un accès complet à un Mac à distance :

1. Va sur https://www.macincloud.com/
2. Abonne-toi au plan **Pay-As-You-Go** (~$1/jour)
3. Connecte-toi au Mac via RDP
4. Clone le dépôt GitHub sur le Mac
5. Ouvre le projet dans Xcode
6. Build et soumets directement depuis Xcode

---

## ⚠️ Important

- **L'APK Android** que tu as déjà fonctionne sur Android (BlueStacks / téléphone Android)
- **La PWA** (version web) peut être installée sur iPhone directement depuis Safari :
  1. Ouvre `https://teranga-business-olive.vercel.app` dans Safari
  2. Appuie sur le bouton "Partager" (carré avec flèche)
  3. Choisis "Ajouter à l'écran d'accueil"
  4. L'app s'installe comme une vraie app !

- **Les deux** (PWA + App Store) peuvent coexister sur le même iPhone

---

## Coûts

| Élément | Coût |
|---|---|
| Apple Developer Program | 99$/an (~60 000 FCFA) |
| GitHub Actions (macOS) | Gratuit (2000 min/mois) |
| EAS Build | Gratuit (30 builds/mois) |
| Transporter | Gratuit |
| **Total** | **~60 000 FCFA/an** |
