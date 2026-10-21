// Budget et dépenses.

import type { GameEvent } from '../../engine/eventTypes';
import { eur, hasJob, liquid, roll } from './helpers';

export const BUDGET_EVENTS: GameEvent[] = [
  {
    id: 'bud_smartphone',
    category: 'budget',
    title: 'Le nouveau smartphone',
    text: 'Le dernier smartphone vient de sortir : 1 250 €. Le tien a quatre ans et sa batterie tient à peine la journée. Le vendeur propose un paiement en 24 fois « sans frais ».',
    cooldown: 8,
    choices: [
      {
        id: 'comptant',
        label: 'L’acheter comptant',
        cost: 1250,
        outcome: { text: 'Tu craques. Il est magnifique, et ton compte un peu moins garni.', fx: { happiness: 4 } },
      },
      {
        id: 'credit',
        label: 'Payer en 24 fois',
        hint: 'Indolore… en apparence.',
        outcome: { text: 'Paiement fractionné accepté. En lisant les petites lignes, tu découvres des frais de dossier.', fx: { addDebt: { kind: 'conso', label: 'Crédit smartphone', amount: 1250, rate: 0.12, years: 2 }, money: -1250, happiness: 4 } },
      },
      {
        id: 'batterie',
        label: 'Changer seulement la batterie (80 €)',
        outcome: { text: 'Ton vieux téléphone repart pour deux ans. Malin.', fx: { money: -80, skills: { finance: 2 } } },
      },
    ],
  },
  {
    id: 'bud_voiture_panne',
    category: 'budget',
    title: 'La voiture tombe en panne',
    text: 'Le garagiste est formel : le moteur est fatigué. Réparation : 1 400 €. Sinon, il connaît une occasion récente à 9 000 €.',
    when: (s) => !!s.flags.voiture,
    cooldown: 7,
    choices: [
      {
        id: 'reparer',
        label: 'Réparer',
        hint: '1 400 € (découvert si nécessaire).',
        outcome: { text: 'Ta vieille voiture repart. Jusqu’à la prochaine fois…', fx: { money: -1400 } },
      },
      {
        id: 'acheter',
        label: 'Acheter l’occasion à crédit',
        hint: 'Crédit auto de 9 000 € sur 5 ans.',
        outcome: { text: 'Tu roules dans une voiture presque neuve. La mensualité, elle, durera cinq ans.', fx: { addDebt: { kind: 'conso', label: 'Crédit auto', amount: 9000, rate: 0.065, years: 5 }, money: -9000, happiness: 5 } },
      },
      {
        id: 'velo',
        label: 'Se passer de voiture',
        hint: 'Vélo électrique et transports.',
        requires: (s) => s.housingId !== 'maison_location' && !s.flags.rural,
        requiresText: 'Impossible sans voiture là où tu vis.',
        outcome: { text: 'Tu revends l’épave 500 € et t’offres un vélo électrique. Tes mollets et ton budget te remercient.', fx: { money: -600, flags: { voiture: false }, health: 4 } },
      },
    ],
  },
  {
    id: 'bud_carte_magasin',
    category: 'budget',
    title: 'La carte du magasin',
    text: 'À la caisse, on te propose la carte de fidélité « avec réserve d’argent » : 3 000 € disponibles immédiatement et 10 % de remise aujourd’hui.',
    cooldown: 10,
    choices: [
      {
        id: 'prendre',
        label: 'Prendre la carte et se faire plaisir',
        hint: 'Crédit renouvelable à 21 %.',
        outcome: { text: 'Tu repars avec un nouvel écran et des vêtements. La facture arrive le mois suivant, avec un taux à 21 %.', fx: { addDebt: { kind: 'conso', label: 'Crédit renouvelable', amount: 3000, rate: 0.21, years: 3 }, money: -2700, happiness: 4, highlight: { kind: 'mistake', text: 'Un crédit renouvelable à 21 %' } } },
      },
      {
        id: 'refuser',
        label: 'Refuser poliment',
        outcome: { text: 'Tu as lu des choses sur ces crédits. Non merci.', fx: { skills: { finance: 2 } } },
      },
    ],
  },
  {
    id: 'bud_abonnements',
    category: 'budget',
    title: 'La chasse aux abonnements',
    text: 'En épluchant tes relevés bancaires, tu découvres six abonnements dont tu ne te sers presque plus : streaming, salle de sport, applications…',
    cooldown: 12,
    choices: [
      {
        id: 'resilier',
        label: 'Tout résilier sauf l’essentiel',
        outcome: { text: 'Une heure de démarches pour économiser près de 600 € par an. Tu récupères déjà deux mois remboursés.', fx: { money: 120, skills: { finance: 4 }, flags: { chasseAbos: true } } },
      },
      {
        id: 'garder',
        label: 'Laisser comme ça',
        outcome: { text: 'Trop de démarches. Les prélèvements continuent.', fx: { money: -300 } },
      },
    ],
  },
  {
    id: 'bud_mariage_ami',
    category: 'budget',
    title: 'Le mariage de ton meilleur ami',
    text: 'Ton meilleur ami se marie dans le sud de la France. Tu es témoin. Entre le costume, l’enterrement de vie de garçon, le cadeau et le voyage, la note grimpe.',
    minAge: 23, maxAge: 45,
    cooldown: 8,
    choices: [
      {
        id: 'tout',
        label: 'Assumer pleinement ton rôle de témoin',
        hint: 'Environ 1 300 €.',
        outcome: { text: 'Un week-end magique, un discours qui fait pleurer toute la salle. Ton ami ne l’oubliera jamais.', fx: { money: -1300, friends: 12, happiness: 6 } },
      },
      {
        id: 'simple',
        label: 'Participer avec un budget serré',
        outcome: { text: 'Covoiturage, costume loué, cadeau collectif : tu es présent{|e} sans te ruiner.', fx: { money: -450, friends: 5, skills: { finance: 2 } } },
      },
      {
        id: 'decliner',
        label: 'Décliner le rôle de témoin',
        outcome: { text: 'Ton ami comprend… officiellement. Quelque chose s’est un peu cassé.', fx: { friends: -10, happiness: -3 } },
      },
    ],
  },
  {
    id: 'bud_vacances',
    category: 'budget',
    title: 'Les vacances d’été',
    text: 'L’été approche. Tes amis parlent d’une villa en Grèce, ta famille d’un camping en Bretagne, et ton compte en banque d’une semaine sur le canapé.',
    cooldown: 4,
    choices: [
      {
        id: 'grece',
        label: 'La villa en Grèce',
        hint: 'Environ 1 600 €.',
        outcome: { text: 'Soleil, mer turquoise, fous rires : tu reviens rechargé{|e} à bloc.', fx: { money: -1600, happiness: 8, energy: 10, friends: 6 } },
      },
      {
        id: 'camping',
        label: 'Le camping familial',
        hint: 'Environ 400 €.',
        outcome: { text: 'Barbecue, pétanque et souvenirs d’enfance. Simple et réparateur.', fx: { money: -400, family: 6, energy: 6, happiness: 4 } },
      },
      {
        id: 'maison',
        label: 'Rester chez soi et économiser',
        outcome: { text: 'Tu profites de ta ville vidée de ses habitants. Reposant, mais un peu frustrant.', fx: { energy: 3, happiness: -2 } },
      },
    ],
  },
  {
    id: 'bud_amende',
    category: 'budget',
    title: 'L’amende',
    text: 'Un flash, un retard de paiement, une contravention mal comprise : tu reçois un avis d’amende de 135 €, majorable à 375 € si tu tardes.',
    cooldown: 8,
    choices: [
      {
        id: 'payer',
        label: 'Payer tout de suite',
        outcome: { text: 'Payé en ligne en deux minutes. Leçon retenue.', fx: { money: -135 } },
      },
      {
        id: 'contester',
        label: 'Contester',
        outcome: roll(0.3,
          { text: 'Ta contestation est acceptée : l’amende est annulée !', fx: { happiness: 3 } },
          { text: 'Contestation rejetée, et l’amende est désormais majorée.', fx: { money: -375, happiness: -2 } }),
      },
      {
        id: 'oublier',
        label: 'La glisser sous une pile de papiers',
        outcome: { text: 'Trois mois plus tard, l’amende majorée tombe directement sur ton compte.', fx: { money: -375 } },
      },
    ],
  },
  {
    id: 'bud_impots',
    category: 'budget',
    title: 'La régularisation d’impôts',
    text: (s) => `Mauvaise surprise : ton prélèvement à la source était mal calibré. L’administration fiscale te réclame ${eur(Math.max(400, (s.job?.salary ?? 1500) * 0.4))}.`,
    when: (s) => hasJob(s) && s.job!.salary >= 2200,
    cooldown: 10,
    choices: [
      {
        id: 'payer',
        label: 'Payer en une fois',
        outcome: (s) => ({ text: 'Tu règles la somme. Tu vérifieras ton taux à l’avenir.', fx: { money: -Math.round(Math.max(400, (s.job?.salary ?? 1500) * 0.4)), skills: { finance: 2 } } }),
      },
      {
        id: 'etaler',
        label: 'Demander un échelonnement',
        outcome: (s) => ({ text: 'L’administration accepte d’étaler le paiement sur l’année, sans frais.', fx: { money: -Math.round(Math.max(400, (s.job?.salary ?? 1500) * 0.4)), happiness: 1 } }),
      },
    ],
  },
  {
    id: 'bud_appli_budget',
    category: 'budget',
    title: 'L’application de budget',
    text: 'Une amie ne jure que par son application de gestion de budget. Elle a économisé 3 000 € en un an « sans s’en rendre compte ».',
    choices: [
      {
        id: 'essayer',
        label: 'L’essayer sérieusement',
        outcome: roll((s) => 0.5 + s.skills.finance / 200,
          { text: 'Tu catégorises tout. Les livraisons de repas représentaient 180 € par mois ! Tu changes tes habitudes.', fx: { skills: { finance: 7 }, money: 400, flags: { discipline: true } } },
          { text: 'Tu tiens trois semaines, puis tu oublies l’application. Un peu de prise de conscience, quand même.', fx: { skills: { finance: 2 } } }),
      },
      {
        id: 'non',
        label: 'Tu gères très bien sans',
        outcome: { text: 'Ta méthode, c’est de regarder ton solde de temps en temps. Ça marche… à peu près.' },
      },
    ],
  },
  {
    id: 'bud_banque_en_ligne',
    category: 'budget',
    title: 'Les frais bancaires',
    text: 'Ta banque traditionnelle t’a prélevé 240 € de frais cette année : tenue de compte, carte, commissions d’intervention…',
    cooldown: 15,
    choices: [
      {
        id: 'changer',
        label: 'Passer dans une banque en ligne',
        outcome: { text: 'Carte gratuite, application pratique, et une prime de bienvenue de 80 €.', fx: { money: 80, skills: { finance: 3 } } },
      },
      {
        id: 'negocier',
        label: 'Négocier avec ton conseiller',
        outcome: roll((s) => 0.3 + s.skills.social / 200,
          { text: 'Ton conseiller supprime une partie des frais et te rembourse 120 €.', fx: { money: 120 } },
          { text: 'Ton conseiller est désolé, mais « c’est la grille tarifaire ».', fx: {} }),
      },
      {
        id: 'rien',
        label: 'Ne rien changer',
        outcome: { text: 'Tu restes fidèle à ta banque. Fidélité coûteuse.', fx: { money: -100 } },
      },
    ],
  },
  {
    id: 'bud_electromenager',
    category: 'budget',
    title: 'La machine à laver rend l’âme',
    text: 'Une inondation dans la salle de bain : la machine à laver est morte. Il en faut une nouvelle, vite.',
    when: (s) => s.housingId !== 'parents' && s.housingId !== 'coloc',
    cooldown: 10,
    choices: [
      {
        id: 'neuve',
        label: 'Une machine neuve de qualité',
        outcome: { text: '650 € pour une machine qui durera quinze ans.', fx: { money: -650 } },
      },
      {
        id: 'occasion',
        label: 'Une occasion sur une plateforme de petites annonces',
        outcome: roll(0.7,
          { text: '150 € pour une machine qui tourne parfaitement. Bonne affaire !', fx: { money: -150, skills: { finance: 1 } } },
          { text: '150 € pour une machine qui rend l’âme deux mois plus tard. Il faut finalement en racheter une neuve.', fx: { money: -800 } }),
      },
      {
        id: 'laverie',
        label: 'Aller à la laverie',
        outcome: { text: 'Le samedi matin à la laverie, avec un livre. Ça coûte 30 € par mois, mais tu fais des rencontres.', fx: { money: -200, energy: -2, friends: 2 } },
      },
    ],
  },
  {
    id: 'bud_inflation',
    category: 'budget',
    title: 'L’inflation',
    text: 'Les prix de l’énergie et de l’alimentation flambent. En un an, ton panier de courses a pris 12 %. Tout le monde se serre la ceinture.',
    cooldown: 15,
    minAge: 20,
    choices: [
      {
        id: 'frugal',
        label: 'Passer en mode économie',
        hint: 'Réduire le train de vie.',
        outcome: { text: 'Marques distributeur, batch cooking, chauffage à 19 °C. Tu tiens ton budget.', fx: { lifestyle: 'frugal', skills: { finance: 3 }, happiness: -3 } },
      },
      {
        id: 'subir',
        label: 'Absorber la hausse',
        outcome: { text: 'Tu continues comme avant et tu puises dans tes réserves.', fx: { money: -900 } },
      },
      {
        id: 'augmentation',
        label: 'Réclamer une hausse de salaire',
        requires: hasJob,
        requiresText: 'Il faut un emploi.',
        outcome: roll(0.45,
          { text: 'Ton entreprise accorde une prime de partage de la valeur de 800 €.', fx: { money: 800 } },
          { text: 'Ta demande reste lettre morte.', fx: { money: -900, happiness: -2 } }),
      },
    ],
  },
  {
    id: 'bud_cadeau_noel',
    category: 'budget',
    title: 'Noël approche',
    text: 'Neveux, nièces, parents, amis : la liste des cadeaux de Noël s’allonge, et ton budget fond à vue d’œil.',
    cooldown: 6,
    when: (s) => liquid(s) > 300,
    choices: [
      {
        id: 'genereux',
        label: 'Gâter tout le monde',
        outcome: { text: 'Le sapin croule sous les paquets. Les yeux des enfants brillent.', fx: { money: -900, family: 8, happiness: 4 } },
      },
      {
        id: 'fait_main',
        label: 'Des cadeaux faits maison',
        outcome: { text: 'Confitures, dessins, bons pour un dîner : touchant et original.', fx: { money: -120, family: 5, skills: { creative: 3 } } },
      },
      {
        id: 'secret',
        label: 'Proposer un « secret Santa » familial',
        outcome: { text: 'Chacun offre un seul cadeau à une personne tirée au sort. Tout le monde est soulagé.', fx: { money: -60, family: 2, skills: { social: 2 } } },
      },
    ],
  },
];
