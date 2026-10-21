# De zéro à millionnaire

Simulateur de vie narratif, gratuit et jouable dans le navigateur (mobile et ordinateur), sans inscription.
Le joueur commence à 18 ans en France et prend, année après année, des décisions sur ses études, son travail, son argent, son logement, ses relations, sa santé et ses entreprises. Les conséquences sont immédiates ou différées de plusieurs années.

> Jeu de fiction. Les règles économiques et fiscales sont simplifiées : ce n’est ni un simulateur financier professionnel ni un conseil en investissement.

## Contenu

- **13 profils de départ** (cocon familial, étudiant fauché, bac pro, sans diplôme, héritier, pilier de la famille, rêveur passionné, débrouillard, nouvel arrivant en métropole, entrepreneur en herbe, prodige du code, jeune de la campagne, départ avec un crédit), chacun avec un événement d’ouverture propre et une variation aléatoire contrôlée (graine).
- **174 événements narratifs** : 152 événements tirés au sort selon des conditions et des poids explicites, 13 introductions, 9 événements de suite déclenchés par des conséquences différées. **446 choix** au total (2,6 par événement), répartis en 13 catégories (études 13, carrière 17, budget 13, investissements 12, entrepreneuriat 14, logement 12, relations 17, santé 10, opportunités 9, difficultés 10, réussites 8, dilemmes moraux 8, changements de vie 9).
- **18 fins** déterminées par le patrimoine, la carrière, les relations, la santé et l’histoire vécue (phénix après une faillite, entrepreneur à succès, millionnaire autodidacte, investisseur, fortune envolée, ruine, prisonnier des dettes, vie d’artiste, reconversion réussie, belle carrière sans patrimoine, bonheur en famille, parti de rien, vie confortable, simple et heureux, libre avant l’heure, au sommet mais seul, millionnaire, parcours inclassable).
- **42 métiers** dans 12 secteurs avec niveaux, prérequis (diplôme, compétences, expérience), stress, pénibilité, risque de licenciement, plafond de salaire et évolutions ; **20 formations** (temps plein, cours du soir, alternance rémunérée, financement par prêt).
- **Économie mensuelle** : salaire brut→net, impôt progressif simplifié (quotient familial), loyers, charges, alimentation, transport, loisirs, « vie courante » proportionnelle au revenu, enfants, aides (APL, RSA, chômage, bourse), crédits amortissables, découvert à 16 %, plan de surendettement, livret, fonds indiciels, cryptomonnaies, immobilier (crédit, taux d’endettement 35 %, location, plus-values), retraite.
- **Entreprises** : 7 secteurs, montée en puissance, réputation, demande aléatoire, rémunération du dirigeant, prêt pro avec caution, développement, dividendes, levée de fonds (dilution), cession, liquidation.
- **Relations** : couple (rencontre, emménagement, PACS/mariage, enfants, crises, rupture), famille, amis, réseau professionnel — qui conditionnent des événements et les fins.
- **Tableau de bord** et **graphiques SVG** (patrimoine, revenus/dépenses, compétences/carrière/satisfaction) calculés à partir des données réelles de la partie, bilan annuel détaillé expliquant chaque variation.
- **Bilan final** partageable : carte de résultat, texte calculé, Web Share API avec repli presse-papiers, lien de défi `?r=…` qui ne contient **aucune donnée personnelle** (fin, âge, profil et deux montants arrondis uniquement).
- **Sauvegarde automatique** locale (localStorage), versionnée, validée au chargement, avec gestion des erreurs et confirmation avant écrasement. Pas de synchronisation entre appareils.
- Accessibilité : contrastes, focus visible, navigation clavier, fenêtres modales piégeant le focus, libellés ARIA, options « texte plus grand » et « réduire les animations ».

Tous les montants sont exprimés en **euros constants** (hors inflation) ; les rendements sont donc des rendements réels.

## Lancer le jeu

Prérequis : Node.js 20 ou plus récent.

```bash
npm install          # installe les dépendances (le fichier .npmrc active legacy-peer-deps)
npm run dev          # serveur de développement : http://localhost:5173
npm test             # tests automatisés (Vitest)
npm run typecheck    # vérification TypeScript
npm run build        # compilation de production dans dist/
npm run build:single # page autonome en un seul fichier (dist-single/), pour les Artifacts Claude ou un usage hors ligne
npm run preview      # sert le build localement : http://localhost:4173
npm run e2e          # parcours de bout en bout dans Chromium (nécessite Playwright et un build)
npm run balance      # rapport d'équilibrage (156 parties simulées par des bots)
```

Aucune variable d’environnement, clé d’API ou service externe n’est nécessaire.

## Structure

```
src/
  engine/            Moteur de simulation (pur TypeScript, sans interface)
    types.ts           état de partie sérialisable
    rng.ts             générateur pseudo-aléatoire à graine (mulberry32)
    catalog.ts         métiers, formations, logements, biens, secteurs, trains de vie
    economy.ts         budget mensuel, impôts, dettes, patrimoine
    career.ts          prérequis, embauche, départ, formations
    business.ts        simulation des entreprises
    effects.ts         application des effets des choix et des conséquences différées
    events.ts          éligibilité, tirage et disponibilité des choix
    simulation.ts      création, choix, avancement d'une année, surendettement, fin
    actions.ts         actions volontaires du joueur
    endings.ts         détermination de la fin
    summary.ts         bilan final et texte de partage
    validate.ts        contrôles d'invariants
  content/           Contenu narratif (profils, 174 événements, 18 fins)
  save/storage.ts    Sauvegarde versionnée
  share/share.ts     Partage et liens de défi
  monetization/      Module publicitaire isolé et DÉSACTIVÉ
  ui/                Interface React (écrans, onglets, composants, graphiques)
  styles/app.css     Identité visuelle
tests/               Tests unitaires, parcours complets, rendu, équilibrage
scripts/e2e.mjs      Test de bout en bout dans un vrai navigateur
docs/TEST_MANUEL.md  Procédure de test manuel mobile / ordinateur
```

## Déploiement

Le build est un site statique (`dist/`) qui fonctionne à la racine d’un domaine comme dans un sous-dossier (`base: './'`).

### Option 1 — Vercel (recommandé)
1. Créez un compte gratuit sur vercel.com et choisissez « Add New → Project ».
2. Importez le dépôt GitHub `de-zero-a-millionaire-`.
3. Vercel détecte Vite grâce à `vercel.json` : cliquez « Deploy ». L’URL publique `https://….vercel.app` est fournie en une minute.

### Option 2 — Netlify
« Add new site → Import an existing project », choisissez le dépôt : `netlify.toml` fournit la commande (`npm ci && npm run build`) et le dossier (`dist`).

### Option 3 — GitHub Pages
Le workflow `.github/workflows/deploy-pages.yml` teste, compile et publie à chaque push sur `main`.
Activez-le une fois : dépôt → **Settings → Pages → Source : GitHub Actions**. (Sur un dépôt privé, GitHub Pages nécessite une offre payante.)

### Option 4 — Manuel
`npm run build` puis déposez le contenu de `dist/` sur n’importe quel hébergement statique (ou glissez-déposez le dossier sur app.netlify.com/drop).

### Option 5 — Artifact Claude ou fichier unique
`npm run build:single` produit `dist-single/index.html` (page complète, jouable même ouverte en local) et `dist-single/artifact.html` (même contenu au format Artifact : CSS et JavaScript intégrés, sans fichier séparé, comme l’exige la plateforme).

## Diagnostic en cas de problème

Ajoute `#diagnostic` à la fin de l’adresse du jeu, ou active **Paramètres → Afficher le diagnostic**. Un panneau affiche la version chargée (aussi visible en bas de l’accueil), l’environnement (cadre, stockage, navigateur) et le journal des clics, écrans et erreurs. Le bouton « Copier » permet de transmettre ce journal.

## Monétisation (future)

Aucune publicité, aucun cookie de suivi, aucun script tiers. Le module `src/monetization/` est séparé du moteur et désactivé (`adsEnabled: false`) ; ses commentaires listent les prérequis (consentement RGPD/ePrivacy, mentions légales) avant toute activation. Le jeu reste entièrement jouable sans lui.

## Tests

- `tests/engine.test.ts` : revenus/dépenses, impôts, patrimoine, dettes et remboursements, découvert, surendettement, effets des choix, conséquences différées, conditions d’apparition, avancement du temps, fins, sauvegarde/chargement/corruption, redémarrage, ressources insuffisantes, événement sans choix disponible, partage.
- `tests/parcours.test.ts` : six parcours complets (stable, entrepreneur qui réussit, faillite, investisseur, relations, difficultés financières) + 26 parties variées avec vérification des invariants à chaque étape.
- `tests/content.test.ts` : volume et intégrité du contenu (références valides, catégories, fins).
- `tests/ui.test.tsx` : rendu de tous les écrans et onglets avec de vraies données.
- `tests/balance.test.ts` : rapport d’équilibrage par stratégie de jeu.
