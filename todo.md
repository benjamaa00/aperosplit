# Équilibra Groupe - TODO

## Phase 1 : Base de données et schémas
- [x] Créer les tables Drizzle ORM (members, expenses, settlements, pending_payments, history)
- [x] Générer les migrations SQL
- [x] Appliquer les migrations à la base de données

## Phase 2 : Backend tRPC
- [x] Procédure pour initialiser le groupe (4 membres)
- [x] Procédure pour récupérer les données partagées
- [x] Procédure pour ajouter une dépense
- [x] Procédure pour supprimer une dépense
- [x] Procédure pour demander un remboursement
- [x] Procédure pour confirmer un remboursement
- [x] Procédure pour refuser un remboursement
- [x] Procédure pour mettre à jour le lien de partage
- [ ] Tests unitaires pour les procédures critiques

## Phase 3 : Frontend - Écrans d'authentification
- [x] Écran de configuration du groupe (SetupScreen)
- [x] Écran de sélection d'identité (IdentityScreen)
- [x] Écran de configuration biométrique (SecuritySetupScreen)
- [x] Écran de déverrouillage biométrique (LockScreen)

## Phase 4 : Frontend - Onglets principaux
- [x] Onglet Accueil (AccueilTab) - solde, résumé, activité récente
- [x] Onglet Dépenses (DepensesTab) - liste, recherche, suppression
- [x] Onglet Soldes (SoldesTab) - balances, remboursements suggérés, demandes
- [x] Onglet Statistiques (StatsTab) - graphiques Recharts
- [x] Onglet Profil (ProfilTab) - identité, biométrie, QR code, membres

## Phase 5 : Frontend - Modales et composants
- [x] Modale d'ajout de dépense (AddExpenseSheet)
- [x] Panneau de notifications (NotifPanel)
- [x] Composants UI réutilisables (Segmented, Chip, Avatar)

## Phase 6 : Intégration S3
- [x] Upload de photos de reçus vers S3
- [x] Affichage des photos dans la liste des dépenses

## Phase 7 : Synchronisation et polling
- [x] Implémenter le polling automatique (4 secondes)
- [x] Gérer la synchronisation des données entre les 4 membres

## Phase 8 : Tests et corrections
- [x] Tester tous les flux utilisateur
- [x] Corriger les bugs identifiés
- [x] Vérifier la synchronisation en temps réel
- [x] Tester la biométrie WebAuthn

## Phase 9 : Corrections et validation
- [x] Corriger toutes les erreurs TypeScript dans App.tsx (0 erreurs)
- [x] Valider que le backend tRPC est connecté et fonctionne
- [x] Vérifier que les tables de base de données existent
- [x] Brancher le frontend sur le backend tRPC au lieu du localStorage
- [x] Implémenter l'upload de photos vers S3/Manus storage
- [x] Tester la synchronisation en temps réel entre les 4 membres (polling 4s)
- [x] Valider la biométrie WebAuthn
- [x] Tester tous les flux utilisateur end-to-end

## Phase 10 : Déploiement
- [x] Créer un checkpoint final
- [x] Publier l'application

## Phase 11 : Fonctionnalités avancées
- [x] Upload de photos de reçus vers S3 avec persistance en base
- [x] Biométrie WebAuthn (Face ID / Touch ID)
- [x] Graphiques statistiques avec Recharts
- [x] QR code d'invitation avec lien de partage
- [x] Tests et corrections des bugs
- [x] Publication en production

## Phase 12 : Extraction IA des Reçus
- [x] Créer procédure tRPC pour analyser les photos avec LLM
- [x] Intégrer l'analyse dans le composant d'upload
- [x] Tester l'extraction et corriger les bugs
- [x] Publier en production

## Phase 13 : Refonte UX Premium + WebAuthn
- [x] Refondre le design system (typographie Inter, couleurs Apple, animations fluides)
- [x] Implémenter WebAuthn Face ID / Touch ID fonctionnel avec écran de verrouillage
- [x] Reconstruire l'onglet Accueil avec design Apple (glassmorphism, blur, gradients subtils)
- [x] Reconstruire l'onglet Dépenses avec animations de liste
- [x] Reconstruire l'onglet Soldes avec visualisation élégante des dettes
- [x] Reconstruire l'onglet Statistiques avec graphiques Recharts animés
- [x] Reconstruire l'onglet Profil avec paramètres biométriques et QR code
- [x] Ajouter micro-interactions (transitions spring, scale on press)
- [x] Tester et publier
