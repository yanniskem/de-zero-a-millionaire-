# Procédure de test manuel

À dérouler sur **un téléphone** (Safari iOS ou Chrome Android) **et un ordinateur** (Chrome, Firefox, Safari ou Edge).
Une version automatisée de ce parcours existe : `npm run build && npm run e2e` (Chromium, 390×844 et 1366×900, captures dans `e2e-screenshots/`).

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Ouvrir l’URL du jeu | L’accueil s’affiche en moins de 3 s, sans défilement horizontal. |
| 2 | « Commencer ma vie » | Écran de création : prénom, accords, durée, 13 profils. |
| 3 | Changer de profil, cliquer « Nouveau tirage » | L’aperçu (argent, compétences, jauges) change. |
| 4 | Vider le prénom | Le bouton « Commencer ma vie » est désactivé avec un message. |
| 5 | Commencer la partie | L’événement d’introduction propre au profil s’affiche. |
| 6 | Choisir une option | Le texte de conséquence et les variations (€ / points) s’affichent. |
| 7 | « Continuer » | Le tableau de bord montre les nouvelles valeurs. |
| 8 | Onglet Argent : placer 100 € sur le livret | Argent disponible −100 €, épargne +100 €. |
| 9 | Onglet Carrière : postuler à un poste inaccessible | Le bouton est désactivé et les conditions manquantes sont listées. |
| 10 | « Vivre mes 18 ans » | Bilan annuel détaillé (revenus, dépenses, placements, évolution). L’âge passe à 19. |
| 11 | Recharger la page | L’accueil propose « Reprendre — prénom, âge ». La partie reprend à l’identique. |
| 12 | Jouer jusqu’à 30 ans, Menu → « Clore mon histoire » | Bilan final : fin, patrimoine, record, parcours, réussites, erreurs, décisions, relations. |
| 13 | « Partager mon histoire » | Mobile : la feuille de partage native s’ouvre. Ordinateur : texte + lien copiés (message de confirmation). |
| 14 | Ouvrir le lien partagé dans un autre navigateur | L’accueil affiche « Un ami te défie » avec la fin et le patrimoine, sans prénom. |
| 15 | « Rejouer une vie » puis « Commencer » | Une confirmation demande d’écraser la partie terminée seulement si elle est en cours. |
| 16 | Paramètres : « Texte plus grand », « Réduire les animations » | Effet immédiat, conservé après rechargement. |
| 17 | Navigation au clavier (ordinateur) | Tab parcourt tous les boutons avec un contour visible ; Échap ferme les fenêtres non bloquantes. |
| 18 | Navigation privée stricte (Safari) | Message clair si la sauvegarde est impossible ; le jeu reste jouable. |
