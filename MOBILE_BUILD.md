# ==========================================================
#  Teranga Business — Build des apps mobiles
#  Android (.apk) + iOS (.ipa)
# ==========================================================
#  Prérequis :
#   - Node.js 18+
#   - Java 21 (JDK)  ->  https://adoptium.net
#   - Android SDK (Android Studio ou cmdline-tools)
#   - macOS + Xcode (SEULEMENT pour iOS / .ipa)
# ==========================================================

# ---- 1. Installer Capacitor (déjà dans package.json si fait) ----
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# ---- 2. Ajouter les plateformes (une seule fois) ----
npx cap add android
npx cap add ios

# ---- 3. Synchroniser le web (public/) vers les plateformes ----
npx cap sync

# ==========================================================
#  ANDROID  ->  produit un APK
# ==========================================================
# Windows/Linux/macOS :
cd android
#    Si Kotlin/Capacitor 8 exige Java 21, définir JAVA_HOME :
#    export JAVA_HOME=/chemin/vers/jdk-21
#    (Windows: set JAVA_HOME=C:\chemin\vers\jdk-21)
./gradlew assembleDebug          # APK debug (rapide, pour tester)
./gradlew assembleRelease        # APK release (pour publier, signé)
cd ..

# Le fichier généré :
#   android/app/build/outputs/apk/debug/app-debug.apk
#   android/app/build/outputs/apk/release/app-release.apk

# ---- Signer la Release (requis pour Play Store) ----
# 1. Créer un keystore : 
#    keytool -genkey -v -keystore teranga-release.jks -keyalg RSA \
#      -keysize 2048 -validity 10000 -alias teranga
# 2. Ajouter dans android/app/build.gradle (dans android{ release{} }):
#    signingConfigs {
#        release {
#            storeFile file("../../teranga-release.jks")
#            storePassword "TON_MDP"
#            keyAlias "teranga"
#            keyPassword "TON_MDP"
#        }
#    }
#    buildTypes.release.signingConfig = signingConfigs.release
# 3. Relancer ./gradlew assembleRelease

# ==========================================================
#  iOS  ->  produit un .ipa (MAC UNIQUEMENT)
# ==========================================================
# 1. Ouvrir Xcode :
open ios/App/App.xcworkspace
# 2. Sélectionner "Teranga Business" -> Signing & Capabilities
# 3. Choisir ton équipe (compte Apple Developer, 99$/an)
# 4. Product > Archive  ->  crée un .xcarchive
# 5. Fenêtre Organizer > Distribute App > App Store Connect

# ==========================================================
#  DÉPLOIEMENT SUR LES STORES
# ==========================================================
# GOOGLE PLAY STORE (Android) :
#   - Compte Google Play Developer (~25$ one-time)
#   - Console Google Play > Créer une app
#   - Uploader android/app/build/outputs/apk/release/app-release.apk
#   - (ou un .aab via: ./gradlew bundleRelease -> /outputs/bundle/release/app-release.aab)
#   - Remplir fiche : icône 512px, captures, description
#   - Vérification interne puis Production

# APP STORE (iOS) :
#   - Compte Apple Developer (99$/an)
#   - Signer l'app dans Xcode avec ton équipe
#   - Product > Archive > Distribute > App Store Connect
#   - Configurer App Store Connect (captures, icônes, descriptions)
#   - Soumettre à revue (approbation 24-48h)

# ==========================================================
#  NOTE : L'app charge la version EN LIGNE du site
#  (voir capacitor.config.ts -> server.url).
#  Toute modification du site se reflète sans rebuild de l'app.
# ==========================================================
