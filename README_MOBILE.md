# AperoSplit - App Mobile de Gestion de Dépenses

AperoSplit est une application mobile qui permet à un groupe d'amis de suivre facilement les dépenses partagées et de gérer les remboursements.

## 🌟 Fonctionnalités Principales

### Synchronisation en Temps Réel
- **Synchronisation automatique** toutes les 5 secondes
- Quand un ami ajoute une dépense, tous les téléphones sont mis à jour instantanément
- Les demandes de remboursement apparaissent en temps réel sur tous les appareils
- Les confirmations de paiement sont synchronisées immédiatement

### Gestion des Dépenses
- ✅ Ajouter des dépenses avec photo de reçu
- ✅ Catégoriser les dépenses (nourriture, transport, loisirs, etc.)
- ✅ Sélectionner les participants concernés
- ✅ Calcul automatique des soldes

### Demandes de Remboursement
- ✅ Demander un remboursement après avoir payé pour le groupe
- ✅ Accepter ou refuser les demandes
- ✅ Notifications des nouvelles demandes
- ✅ Historique complet des paiements

### Authentification
- ✅ Code confidentiel pour sécuriser l'accès au groupe
- ✅ Authentification biométrique (empreinte digitale)
- ✅ Sélection de profil utilisateur

## 📱 Installation de l'App Mobile

### Prérequis
- Android Studio (pour Android) ou Xcode (pour iOS)
- Node.js et pnpm installés
- Un serveur backend déployé

### Étapes d'Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/benjamaa00/aperosplit.git
   cd aperosplit
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Configurer l'URL du backend**
   
   Créez un fichier `.env` à la racine du projet:
   ```
   VITE_API_URL=https://votre-backend-url.com
   ```
   
   Pour le développement local:
   ```
   VITE_API_URL=http://VOTRE_IP_LOCALE:3000
   ```

4. **Construire l'application**
   ```bash
   pnpm build
   ```

5. **Synchroniser avec Capacitor**
   ```bash
   npx cap sync
   ```

6. **Ouvrir Android Studio**
   ```bash
   npx cap open android
   ```

7. **Lancer l'app sur votre téléphone**
   - Connectez votre téléphone via USB
   - Activez le mode développeur et le débogage USB
   - Cliquez sur le bouton "Run" dans Android Studio

## 🔧 Configuration du Backend

### Variables d'Environnement Requises

Dans le dashboard Render ou votre fichier `.env`:

```env
DATABASE_URL=postgresql://votre-connexion-neon
GROUP_ACCESS_PIN=123456
OAUTH_SERVER_URL=https://votre-oauth-server.com (optionnel)
```

### Déploiement du Backend

1. **Pousser le code sur GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin master
   ```

2. **Configurer Render**
   - Connectez votre repository GitHub
   - Ajoutez les variables d'environnement
   - Déployez

## 🚀 Utilisation

### Première Utilisation

1. **Entrez le code confidentiel** (par défaut: `123456`)
2. **Sélectionnez votre profil** parmi les membres du groupe
3. **L'application se synchronise** avec le serveur

### Ajouter une Dépense

1. Cliquez sur le bouton `+` dans l'onglet "Dépenses"
2. Entrez la description et le montant
3. Sélectionnez la catégorie
4. Choisissez qui a payé et qui participe
5. Optionnel: ajoutez une photo du reçu
6. Cliquez sur "Confirmer"

### Demander un Remboursement

1. Allez dans l'onglet "Soldes"
2. Cliquez sur "Demander" à côté d'un solde
3. Confirmez le montant
4. La demande apparaît sur le téléphone de la personne concernée

### Accepter/Refuser un Paiement

1. Allez dans l'onglet "Accueil"
2. Dans la section "Paiements en attente"
3. Cliquez sur "Accepter" ou "Refuser"

## 🔄 Comment la Synchronisation Fonctionne

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Téléphone 1│────▶│   Backend   │◀────│  Téléphone 2│
│   (Alice)   │     │  (Render)   │     │   (Bob)     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       └───────────────────┴───────────────────┘
                   Synchronisation
                   toutes les 5s
```

### Flux de Données

1. **Alice ajoute une dépense** sur son téléphone
2. **L'envoie au backend** via API tRPC
3. **Le backend sauvegarde** dans PostgreSQL
4. **Bob téléphone vérifie** toutes les 5 secondes
5. **Bob voit la nouvelle dépense** automatiquement

### Pas de "Bruit" dans les Données

- **Validation côté serveur**: Toutes les données sont validées avant sauvegarde
- **Transactions atomiques**: Les écritures sont soit complètes, soit annulées
- **Détection de conflits**: Si deux personnes modifient la même dépense, le dernier gagne
- **Historique complet**: Toutes les actions sont tracées dans `activity_history`

## 🛠️ Dépannage

### "Connection refused"
- Vérifiez que le backend est en cours d'exécution
- Confirmez que `VITE_API_URL` est correct
- Pour le test local, utilisez votre IP locale au lieu de `localhost`

### L'app ne se synchronise pas
- Vérifiez votre connexion internet
- Confirmez que le backend est accessible
- Vérifiez les logs du backend pour les erreurs

### Le code confidentiel ne fonctionne pas
- Vérifiez que `GROUP_ACCESS_PIN` est configuré dans le backend
- Assurez-vous que tous les téléphones utilisent le même code

## 📝 Notes de Développement

### Structure du Projet

```
aperosplit/
├── client/              # Application React/TypeScript
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useRealtimeSync.ts  # Hook de synchronisation
│   │   ├── config.ts                # Configuration de l'app
│   │   └── App.tsx                 # Composant principal
├── server/              # Backend Node.js/Express
│   ├── db.ts            # Base de données avec fallback JSON
│   └── routers/         # API tRPC
├── android/             # Projet Android (Capacitor)
└── capacitor.config.ts  # Configuration Capacitor
```

### Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, tRPC, PostgreSQL
- **Mobile**: Capacitor (wrapping the web app)
- **Sync**: Polling toutes les 5 secondes + tRPC subscriptions

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues! Ouvrez une issue ou un pull request.
