# AperoSplit - Guide d'installation

## 🚀 Lancer l'application

### Option 1 : Serveur local (recommandé)

```bash
cd "aperosplit flutter"
serve.bat
```

Ou manuellement :
```bash
cd "aperosplit flutter/app/build/web"
python -m http.server 8080
```

### Option 2 : Node.js (si installé)
```bash
cd "aperosplit flutter/app/build/web"
npx serve -s . -l 8080
```

---

## 📱 Installer sur Samsung S22 Ultra (Android)

1. Connectez le PC et le téléphone au **même WiFi**
2. Trouvez l'IP du PC : `ipconfig` dans CMD
3. Sur le téléphone, ouvrez **Chrome**
4. Allez à : `http://192.168.x.x:8080`
5. Menu ⋮ → **"Ajouter à l'écran d'accueil"**
6. Nommez l'app → **"Ajouter"**

L'app est maintenant installée comme une app native !

---

## 🍎 Installer sur iPhone

1. Connectez le PC et le téléphone au **même WiFi**
2. Trouvez l'IP du PC : `ipconfig` dans CMD
3. Sur le téléphone, ouvrez **Safari**
4. Allez à : `http://192.168.x.x:8080`
5. Tapez sur l'icône **Partager** ( carré avec flèche )
6. **"Ajouter à l'écran d'accueil"**
7. Nommez l'app → **"Ajouter"**

L'app est maintenant installée comme une app native !

---

## 🌐 Héberger en ligne (pour accès permanent)

### Netlify (gratuit)
1. Allez sur https://app.netlify.com
2. Glissez-déposez le dossier `app/build/web`
3. C'est fait ! Vous avez une URL publique

### Vercel (gratuit)
```bash
cd "aperosplit flutter/app/build/web"
npx vercel --prod
```

---

## 📋 Contenu du dossier

```
aperosplit flutter/
├── app/                    # Application Flutter
│   ├── lib/                # Code source Dart
│   ├── build/web/          # Version web prête à déployer
│   ├── android/            # Fichiers Android (APK)
│   ├── ios/                # Fichiers iOS (Xcode)
│   └── pubspec.yaml
├── backend/                # Backend Dart (Shelf)
├── serve.bat               # Script de lancement rapide
└── GUIDE.md                # Ce fichier
```

---

## 🔧 Configuration Backend

Éditez `backend/.env` pour connecter la base de données :

```
DATABASE_URL=postgresql://user:password@host:5432/equilibra
GROUP_ACCESS_PIN=123456
```
