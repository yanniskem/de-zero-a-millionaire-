// Entrepreneuriat.

import { SECTOR_BY_ID } from '../../engine/catalog';
import { businessValuation } from '../../engine/economy';
import type { GameEvent } from '../../engine/eventTypes';
import { eur, hasBiz, liquid, roll } from './helpers';

export const ENTREPRISE_EVENTS: GameEvent[] = [
  {
    id: 'ent_idee_ami',
    category: 'entreprise',
    title: 'L’associé idéal ?',
    text: 'Ton ami Mehdi a une idée de food truck de cuisine du monde. Il cuisine divinement, mais n’a ni capital ni sens de la gestion. Il te propose de vous associer.',
    minAge: 21, maxAge: 50,
    when: (s) => !hasBiz(s) && s.relations.friends >= 40,
    choices: [
      {
        id: 'associer',
        label: 'S’associer et apporter 12 000 €',
        hint: 'Ton capital, son talent.',
        cost: 12000,
        outcome: { text: 'Vous achetez un camion d’occasion et le relookez. Mehdi en cuisine, toi à la gestion : le food truck est né.', fx: { startBusiness: { sector: 'food_truck', capital: 0, name: 'Le Camion de Mehdi' }, biz: { cash: 12000 }, flags: { associe: true }, friends: 8, delayed: [{ years: 3, eventId: 'suite_associe' }] } },
      },
      {
        id: 'conseil',
        label: 'L’aider à monter son projet sans investir',
        outcome: { text: 'Tu l’aides à écrire son business plan et à trouver un prêt d’honneur. Il ne l’oubliera pas.', fx: { friends: 6, skills: { manage: 4, finance: 3 }, network: 4 } },
      },
      {
        id: 'non',
        label: 'Décliner',
        outcome: { text: 'L’amitié et les affaires ne font pas bon ménage, dit-on. Tu restes prudent{|e}.', fx: { friends: -2 } },
      },
    ],
  },
  {
    id: 'ent_side_project',
    category: 'entreprise',
    title: 'Le projet du week-end',
    text: 'Le petit outil que tu as créé pour toi intéresse d’autres personnes. Trois inconnus t’ont déjà proposé de payer pour l’utiliser.',
    minAge: 20, maxAge: 55,
    when: (s) => !hasBiz(s) && (s.skills.tech >= 45 || s.skills.creative >= 45),
    choices: [
      {
        id: 'lancer',
        label: 'En faire une vraie entreprise',
        hint: 'Démarrer avec 3 000 € de ta poche.',
        cost: 3000,
        outcome: (s) => ({
          text: 'Tu immatricules ta société. Tu développes le produit le soir et le week-end.',
          fx: { startBusiness: { sector: s.skills.tech >= s.skills.creative ? (s.skills.tech >= 55 ? 'startup' : 'ecommerce') : 'agence', capital: 0, name: s.skills.tech >= s.skills.creative ? 'Outilio' : 'Atelier Pixel' }, biz: { cash: 3000 }, happiness: 5 },
        }),
      },
      {
        id: 'vendre',
        label: 'Vendre l’outil à une entreprise',
        outcome: roll(0.5,
          { text: 'Une PME rachète ton outil 6 000 €. Un joli bonus pour quelques week-ends de travail.', fx: { money: 6000, network: 4 } },
          { text: 'Les entreprises contactées ne sont pas intéressées. Tu gardes ton outil pour toi.', fx: { skills: { social: 2 } } }),
      },
      {
        id: 'libre',
        label: 'Le publier gratuitement',
        outcome: { text: 'Ton outil gratuit est partagé des milliers de fois. Ta réputation explose dans ton milieu.', fx: { network: 12, skills: { tech: 2, creative: 2 } } },
      },
    ],
  },
  {
    id: 'ent_mauvais_payeur',
    category: 'entreprise',
    title: 'Le client qui ne paie pas',
    text: 'Ton plus gros client te doit 9 000 € depuis quatre mois. Il répond de moins en moins à tes relances.',
    when: (s) => hasBiz(s) && s.business!.years >= 1,
    cooldown: 6,
    choices: [
      {
        id: 'justice',
        label: 'Lancer une procédure en justice',
        outcome: roll(0.6,
          { text: 'Le tribunal te donne raison : tu récupères ton dû, moins les frais d’avocat.', fx: { biz: { cash: 7500 }, energy: -4 } },
          { text: 'Ton client est placé en liquidation. Tu ne récupéreras jamais l’argent, et tu as payé l’avocat.', fx: { biz: { cash: -1500 }, happiness: -5 } }),
      },
      {
        id: 'negocier',
        label: 'Négocier un échéancier',
        outcome: { text: 'Il accepte de payer en douze mensualités. Ça soulage ta trésorerie petit à petit.', fx: { biz: { cash: 4000, reputation: 2 }, delayed: [{ years: 1, title: 'Fin de l’échéancier', text: 'Ton client a fini de payer ce qu’il te devait.', fx: { biz: { cash: 5000 } } }] } },
      },
      {
        id: 'oublier',
        label: 'Passer l’éponge',
        outcome: { text: 'Tu tires un trait dessus. Leçon apprise : désormais, acompte obligatoire.', fx: { biz: { cash: -2000 }, skills: { finance: 4 } } },
      },
    ],
  },
  {
    id: 'ent_levee_fonds',
    category: 'entreprise',
    title: 'Les investisseurs frappent à la porte',
    text: (s) => `Un fonds d’investissement s’intéresse à ${s.business?.name}. Il propose 300 000 € contre 25 % du capital. De quoi accélérer… et perdre un peu le contrôle.`,
    when: (s) => hasBiz(s) && s.business!.sector === 'startup' && s.business!.reputation >= 45 && !s.flags.leveeFonds,
    choices: [
      {
        id: 'accepter',
        label: 'Accepter la levée de fonds',
        outcome: { text: 'Champagne ! La levée est bouclée. Tu recrutes une équipe et accélères.', fx: { biz: { cash: 300000, scale: 1, valuationBonus: 1.6, reputation: 10, dilution: 25 }, flags: { leveeFonds: true }, energy: -8, highlight: { kind: 'success', text: 'Levée de fonds de 300 000 €' } } },
      },
      {
        id: 'negocier',
        label: 'Négocier une meilleure valorisation',
        outcome: roll((s) => 0.3 + s.skills.finance / 200,
          { text: 'Ils cèdent : 300 000 € pour 15 % seulement. Tu gardes la main.', fx: { biz: { cash: 300000, scale: 1, valuationBonus: 1.9, reputation: 12, dilution: 15 }, flags: { leveeFonds: true }, highlight: { kind: 'success', text: 'Levée de fonds négociée de main de maître' } } },
          { text: 'Le fonds se retire, vexé. Il faudra grandir par toi-même.', fx: { happiness: -4, flags: { leveeFonds: true } } }),
      },
      {
        id: 'refuser',
        label: 'Rester indépendant{|e}',
        outcome: { text: 'Tu préfères grandir lentement mais rester maître à bord.', fx: { flags: { leveeFonds: true }, happiness: 2 } },
      },
    ],
  },
  {
    id: 'ent_concurrent',
    category: 'entreprise',
    title: 'Le concurrent agressif',
    text: (s) => `Un concurrent bien financé s’installe sur le marché de ${s.business?.name} et casse les prix.`,
    when: hasBiz,
    cooldown: 8,
    choices: [
      {
        id: 'prix',
        label: 'Baisser tes prix',
        outcome: { text: 'Tu gardes tes clients, mais tes marges fondent.', fx: { biz: { cash: -6000, reputation: 2 } } },
      },
      {
        id: 'qualite',
        label: 'Miser sur la qualité et le service',
        outcome: roll((s) => 0.35 + s.skills.social / 200 + (s.business?.reputation ?? 0) / 300,
          { text: 'Tes clients restent fidèles : ils viennent pour toi, pas pour le prix.', fx: { biz: { reputation: 8 } } },
          { text: 'Une partie de ta clientèle part chez le concurrent.', fx: { biz: { reputation: -6, cash: -4000 } } }),
      },
      {
        id: 'ignorer',
        label: 'Ignorer le concurrent',
        outcome: roll(0.4,
          { text: 'Le concurrent fait faillite au bout d’un an. Tu avais raison de garder ton calme.', fx: { biz: { reputation: 3 } } },
          { text: 'Le concurrent grignote ton marché mois après mois.', fx: { biz: { reputation: -8, cash: -5000 } } }),
      },
    ],
  },
  {
    id: 'ent_premier_salarie',
    category: 'entreprise',
    title: 'Le premier salarié',
    text: (s) => `${s.business?.name} croule sous le travail. Tu pourrais embaucher ton premier salarié… ou continuer à tout faire toi-même.`,
    when: (s) => hasBiz(s) && s.business!.scale === 1 && s.business!.lastProfit > 0,
    choices: [
      {
        id: 'embaucher',
        label: 'Embaucher',
        hint: 'Plus de capacité, plus de charges.',
        outcome: { text: 'Ton premier salarié arrive. Tu deviens patron{|ne} pour de vrai.', fx: { biz: { scale: 1, cash: -4000 }, energy: 6, skills: { manage: 5 }, highlight: { kind: 'key', text: 'Embauche de son premier salarié' } } },
      },
      {
        id: 'freelance',
        label: 'Sous-traiter à des indépendants',
        outcome: { text: 'Tu fais appel à des indépendants au cas par cas. Souple, mais moins fiable.', fx: { biz: { reputation: -2, cash: -1000 }, energy: 3 } },
      },
      {
        id: 'seul',
        label: 'Continuer seul{|e}',
        outcome: { text: 'Tu refuses des clients et tu travailles tard. Ta santé en pâtit.', fx: { energy: -8, health: -3 } },
      },
    ],
  },
  {
    id: 'ent_controle_fiscal',
    category: 'entreprise',
    title: 'Le contrôle fiscal',
    text: (s) => `Un courrier recommandé : ${s.business?.name} fait l’objet d’un contrôle fiscal. Il va falloir montrer chaque facture.`,
    when: (s) => hasBiz(s) && s.business!.years >= 2,
    cooldown: 10,
    choices: [
      {
        id: 'comptable',
        label: 'Faire appel à un expert-comptable',
        outcome: { text: 'Ton comptable défend ton dossier pied à pied. Quelques redressements mineurs seulement.', fx: { biz: { cash: -2500 } } },
      },
      {
        id: 'seul',
        label: 'Gérer seul{|e} le contrôle',
        outcome: roll((s) => 0.2 + s.skills.finance / 120,
          { text: 'Tes comptes sont impeccables. Le contrôleur repart sans rien relever.', fx: { skills: { finance: 4 }, happiness: 4 } },
          { text: 'Des erreurs de TVA sont relevées : redressement et pénalités de 9 000 €.', fx: { biz: { cash: -9000 }, happiness: -6, highlight: { kind: 'mistake', text: 'Redressement fiscal de l’entreprise' } } }),
      },
    ],
  },
  {
    id: 'ent_offre_rachat',
    category: 'entreprise',
    title: 'L’offre de rachat',
    text: (s) => `Un groupe propose de racheter ${s.business?.name} pour ${eur(Math.round(businessValuation(s.business) * 1.3))}. C’est 30 % au-dessus de sa valeur estimée.`,
    when: (s) => hasBiz(s) && s.business!.profitableYears >= 2 && businessValuation(s.business) >= 50000,
    cooldown: 6,
    choices: [
      {
        id: 'vendre',
        label: 'Vendre',
        hint: 'Encaisser le fruit de ton travail.',
        outcome: (s) => {
          const price = Math.round(businessValuation(s.business) * 1.3);
          const tax = Math.round(Math.max(0, price - s.business!.invested) * 0.2);
          return { text: `Tu signes la vente pour ${eur(price)}. Après impôt (${eur(tax)}), une nouvelle vie commence.`, fx: { money: price - tax, biz: { close: 'fermeture', cash: -s.business!.treasury }, recordSale: price, highlight: { kind: 'success', text: `Vente de ${s.business!.name} pour ${eur(price)}` } } };
        },
      },
      {
        id: 'contre',
        label: 'Faire une contre-offre à +60 %',
        outcome: roll(0.35,
          { text: 'Le groupe accepte ta contre-offre !', fx: { flags: { contreOffre: true }, delayed: [{ years: 1, eventId: 'suite_rachat' }] } },
          { text: 'Le groupe trouve ta demande excessive et se retire.', fx: { happiness: -3 } }),
      },
      {
        id: 'garder',
        label: 'Garder ton bébé',
        outcome: { text: 'Ce n’est pas qu’une question d’argent. Tu continues l’aventure.', fx: { happiness: 3, biz: { reputation: 2 } } },
      },
    ],
  },
  {
    id: 'ent_buzz',
    category: 'entreprise',
    title: 'Le buzz',
    text: (s) => `Une vidéo d’un client enthousiaste à propos de ${s.business?.name} fait trois millions de vues. Le téléphone sonne sans arrêt.`,
    when: hasBiz,
    rare: true,
    choices: [
      {
        id: 'capitaliser',
        label: 'Investir 8 000 € en marketing pour surfer sur la vague',
        outcome: roll(0.65,
          { text: 'La vague devient une marée : les ventes s’envolent durablement.', fx: { biz: { cash: -8000, reputation: 20, valuationBonus: 1.2 } } },
          { text: 'Le soufflé retombe vite. Tu as dépensé beaucoup pour un effet passager.', fx: { biz: { cash: -8000, reputation: 5 } } }),
      },
      {
        id: 'servir',
        label: 'Servir correctement les nouveaux clients',
        outcome: { text: 'Pas de folie : tu traites chaque commande avec soin. La réputation grimpe.', fx: { biz: { reputation: 12, cash: 6000 } } },
      },
    ],
  },
  {
    id: 'ent_pret_pro',
    category: 'entreprise',
    title: 'Le banquier entreprenant',
    text: (s) => `Ton banquier trouve que ${s.business?.name} se porte bien. Il propose un prêt professionnel de 40 000 € pour financer un développement.`,
    when: (s) => hasBiz(s) && s.business!.lastProfit > 0 && s.business!.scale < 4,
    cooldown: 6,
    choices: [
      {
        id: 'accepter',
        label: 'Emprunter et grandir',
        hint: 'Un prêt à ton nom, remboursé chaque mois sur tes revenus.',
        outcome: { text: 'Avec 40 000 €, tu ouvres un nouveau local et recrutes. Le défi : rembourser.', fx: { addDebt: { kind: 'pro', label: 'Prêt de développement', amount: 40000, rate: 0.055, years: 7 }, money: -40000, biz: { cash: 40000, scale: 1 }, flags: { pretDev: true } } },
      },
      {
        id: 'refuser',
        label: 'Grandir sur fonds propres',
        outcome: { text: 'Tu préfères ne pas t’endetter. Croissance plus lente, sommeil plus serein.', fx: { happiness: 1 } },
      },
    ],
  },
  {
    id: 'ent_epuisement',
    category: 'entreprise',
    title: 'Le patron épuisé',
    text: 'Soixante-dix heures par semaine depuis des mois. Tu oublies de manger, tu dors mal, et ton entourage s’inquiète.',
    when: (s) => hasBiz(s) && s.energy < 40,
    choices: [
      {
        id: 'deleguer',
        label: 'Déléguer et recruter un bras droit',
        outcome: { text: 'Ton bras droit prend en charge le quotidien. Ça coûte cher, mais tu revis.', fx: { biz: { cash: -15000 }, energy: 15, health: 5, happiness: 5 } },
      },
      {
        id: 'forcer',
        label: 'Tenir encore un peu',
        outcome: roll(0.5,
          { text: 'Tu passes le cap difficile. Le rythme finit par ralentir.', fx: { energy: -5, biz: { reputation: 3 } } },
          { text: 'Ton corps dit stop : malaise, hôpital, trois semaines d’arrêt.', fx: { health: -15, energy: -10, biz: { reputation: -5, cash: -5000 }, highlight: { kind: 'mistake', text: 'S’effondrer d’épuisement en dirigeant son entreprise' } } }),
      },
      {
        id: 'pause',
        label: 'Prendre deux semaines de vacances',
        outcome: { text: 'Tu coupes ton téléphone. À ton retour, tout tient encore debout.', fx: { energy: 12, happiness: 4, money: -1200 } },
      },
    ],
  },
  {
    id: 'ent_franchise',
    category: 'entreprise',
    title: 'La franchise de boulangerie',
    text: 'Une enseigne de boulangerie-café cherche des franchisés dans ta région. Concept éprouvé, mais droit d’entrée de 35 000 € et redevance mensuelle.',
    minAge: 25, maxAge: 55,
    when: (s) => !hasBiz(s) && liquid(s) >= 25000,
    choices: [
      {
        id: 'franchise',
        label: 'Signer la franchise',
        hint: '35 000 € d’apport, l’enseigne t’accompagne.',
        cost: 35000,
        outcome: { text: 'Formation, travaux, inauguration : ta boulangerie-café ouvre sous l’enseigne. Le concept est rodé.', fx: { startBusiness: { sector: 'restaurant', capital: 0, name: 'Le Fournil franchisé' }, biz: { cash: 35000, reputation: 15 }, highlight: { kind: 'key', text: 'Ouverture d’une franchise de boulangerie-café' } } },
      },
      {
        id: 'non',
        label: 'Passer son tour',
        outcome: { text: 'Tu n’es pas prêt{|e} à t’engager pour dix ans.' },
      },
    ],
  },
  {
    id: 'ent_marche_public',
    category: 'entreprise',
    title: 'L’appel d’offres',
    text: (s) => `La mairie lance un appel d’offres qui correspond parfaitement à ${s.business?.name}. Le dossier est long et la concurrence rude.`,
    when: (s) => hasBiz(s) && SECTOR_BY_ID[s.business!.sector]?.id !== 'restaurant',
    cooldown: 6,
    choices: [
      {
        id: 'repondre',
        label: 'Répondre avec soin',
        outcome: roll((s) => 0.3 + (s.business?.reputation ?? 0) / 200 + s.skills.manage / 300,
          { text: 'Marché remporté ! Trois ans de commandes publiques assurées.', fx: { biz: { cash: 18000, reputation: 8 }, energy: -5, highlight: { kind: 'success', text: 'Marché public remporté' } } },
          { text: 'Ton dossier arrive deuxième. Beaucoup de travail pour rien… cette fois.', fx: { energy: -5, skills: { manage: 3 } } }),
      },
      {
        id: 'non',
        label: 'Ne pas répondre',
        outcome: { text: 'Trop de paperasse. Tu te concentres sur tes clients actuels.' },
      },
    ],
  },
  {
    id: 'ent_reprise_artisan',
    category: 'entreprise',
    title: 'Le vieil artisan part à la retraite',
    text: 'L’artisan chez qui tu as appris le métier part à la retraite. Il te propose de reprendre son entreprise et sa clientèle pour 20 000 €.',
    minAge: 24, maxAge: 55,
    when: (s) => !hasBiz(s) && s.skills.craft >= 40 && (!!s.flags.repriseArtisan || s.diplomas.includes('cap_elec')),
    choices: [
      {
        id: 'reprendre',
        label: 'Reprendre l’affaire (prêt de 15 000 €)',
        hint: '5 000 € d’apport et un prêt bancaire.',
        cost: 5000,
        outcome: { text: 'Pour 20 000 € (5 000 € d’apport et un prêt de 15 000 €), tu reprends l’entreprise et son carnet d’adresses. Les clients te connaissent déjà.', fx: { startBusiness: { sector: 'artisan', capital: 0, name: 'Électricité du Village' }, biz: { cash: 2000, reputation: 25 }, addDebt: { kind: 'pro', label: 'Prêt de reprise', amount: 15000, rate: 0.045, years: 7 }, money: -15000, loseJob: 'demission', highlight: { kind: 'key', text: 'Reprise de l’entreprise de son ancien maître d’apprentissage' } } },
      },
      {
        id: 'refuser',
        label: 'Rester salarié{|e}',
        outcome: { text: 'Tu remercies le vieil artisan. Il vend à un inconnu, un peu déçu.', fx: { network: -2 } },
      },
    ],
  },
];
