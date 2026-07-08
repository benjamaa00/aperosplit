# Déploiement Backend sur Render

## Instructions pour déployer le backend sur Render

### 1. Prérequis
- Compte Render (gratuit)
- Repository GitHub connecté

### 2. Configuration via Dashboard Render

1. **Connectez-vous** sur https://dashboard.render.com
2. **Cliquez sur "New +"** → "Web Service"
3. **Connectez votre repository GitHub** (ItsJustmE00/DentalPro)
4. **Configurez le service** :

#### Build & Deploy
- **Name**: equilibra-backend
- **Region**: Frankfurt (ou la plus proche)
- **Branch**: main
- **Runtime**: Node
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `node dist/index.js`

#### Environment Variables
- **NODE_ENV**: `production`

### 3. Variables d'environnement optionnelles
- **OAUTH_SERVER_URL**: (optionnel, pour OAuth)
- **DATABASE_URL**: (optionnel, pour base de données externe)

### 4. Après le déploiement
- Render va vous donner une URL comme : `https://equilibra-backend.onrender.com`
- Notez cette URL pour configurer le frontend

### 5. Configuration Frontend
Dans `client/src/main.tsx`, modifiez l'URL tRPC :
```typescript
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "https://equilibra-backend.onrender.com/api/trpc", // Remplacez par votre URL Render
      transformer: superjson,
      // ...
    }),
  ],
});
```

### 6. Déploiement Frontend sur Netlify
Une fois le backend déployé, déployez le frontend :
```bash
netlify deploy --prod --dir=dist/public
```

### 7. Test
- Ouvrez l'application Netlify
- Testez la synchronisation entre utilisateurs
- Vérifiez que les remboursements fonctionnent
