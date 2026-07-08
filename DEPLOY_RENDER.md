# Déploiement Rapide sur Render

## Méthode 1: Dashboard Web (Recommandé)

1. **Allez sur** https://dashboard.render.com
2. **Connectez-vous** avec GitHub
3. **Cliquez sur "New +"** → "Web Service"
4. **Sélectionnez** le repository `benjamaa00/aperosplit`
5. **Configurez** :
   - **Name**: `aperosplit-backend`
   - **Branch**: `master`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/index.js`
6. **Cliquez sur "Create Web Service"**

## Méthode 2: Via CLI (Problèmes Windows connus)

Le CLI Render a des problèmes sur Windows. Utilisez le dashboard web.

## Après Déploiement

1. **Notez l'URL** : `https://aperosplit-backend-xxxx.onrender.com`
2. **Dites-moi l'URL** pour configurer le frontend
3. **Je déploierai** le frontend sur Netlify avec la bonne URL backend
