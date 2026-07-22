# Guide de publication sur les stores

## 📱 Google Play Store

### Prérequis
1. Compte développeur Google Play ($25 une fois) : https://play.google.com/console
2. Fichier AAB : `build/app/outputs/bundle/release/app-release.aab`

### Étapes
1. Connectez-vous à Google Play Console
2. Cliquez "Créer une application"
3. Remplissez le nom : "AperoSplit - Groupe"
4. Catégorie : Finance
5. Téléchargez le fichier `app-release.aab`
6. Remplissez la description (voir `store_metadata/google_play/listing.md`)
7. Ajoutez des captures d'écran (faites-les depuis l'app)
8. Définissez la politique de confidentialité
9. Soumettez pour révision

### Keystore (IMPORTANT !)
Le keystore de signing est dans : `android/app/keystore.jks`
- Mot de passe : `aperosplit123`
- Alias : `aperosplit`
- Mot de passe clé : `aperosplit123`

⚠️ **GARDEZ CE KEYSTORE EN SÉCURITÉ** - Vous en aurez besoin pour toutes les mises à jour !

---

## 🍎 Apple App Store

### Prérequis
1. Mac avec Xcode installé
2. Compte Apple Developer ($99/an) : https://developer.apple.com
3. App Store Connect : https://appstoreconnect.apple.com

### Étapes sur Mac
```bash
# 1. Copiez le projet sur le Mac
scp -r "aperosplit flutter/" user@mac:/Users/user/

# 2. Sur le Mac, installez Flutter
flutter doctor

# 3. Build iOS
cd "aperosplit flutter/app"
flutter build ios --release

# 4. Ouvrez Xcode
open ios/Runner.xcworkspace
```

5. Dans Xcode :
   - Sélectionnez "Runner" dans la sidebar
   - Onglet "Signing & Capabilities"
   - Connectez votre compte Apple Developer
   - Sélectionnez votre "Team"
   - Changez le Bundle Identifier si nécessaire

6. Menu Product → Archive
7. Cliquez "Distribute App" → "App Store Connect"
8. Suivez les étapes de publication

### Bundle ID
`com.aperosplit.app`

---

## 📸 Captures d'écran nécessaires

Faites ces captures depuis l'app :
1. Écran d'accueil (balance)
2. Liste des dépenses
3. Graphiques/statistiques
4. Profil
5. Thème sombre

Tailles requises :
- Android : 16:9 ou 9:16, min 320px, max 3840px
- iOS : 6.7" (1290x2796), 6.5" (1242x2688), 5.5" (1242x2208)
