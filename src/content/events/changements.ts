// Changements de vie.

import type { GameEvent } from '../../engine/eventTypes';
import { coupled, hasJob, liquid, nw, roll } from './helpers';

export const CHANGEMENT_EVENTS: GameEvent[] = [
  {
    id: 'chg_demenager_region',
    category: 'changement',
    title: 'Le soleil du Sud',
    text: 'Une offre d’emploi équivalente à la tienne dans une ville du Sud, où les loyers sont 30 % moins chers et le soleil omniprésent.',
    minAge: 25, maxAge: 55,
    when: (s) => hasJob(s) && s.housingId !== 'parents' && !s.properties.some((p) => p.isMainHome),
    cooldown: 15,
    choices: [
      {
        id: 'partir',
        label: 'Tout quitter pour le Sud',
        outcome: { text: 'Nouvelle ville, nouvelle vie. Le marché, la mer, le soleil : tu respires.', fx: { housingId: 'maison_location', happiness: 8, friends: -10, family: -4, money: -1500, energy: 5, highlight: { kind: 'key', text: 'Déménagement dans le Sud' } } },
      },
      {
        id: 'rester',
        label: 'Rester près des siens',
        outcome: { text: 'Tes racines sont ici.', fx: { family: 2 } },
      },
    ],
  },
  {
    id: 'chg_sabbatique',
    category: 'changement',
    title: 'L’année sabbatique',
    text: 'Après des années sans vraie pause, tu rêves d’une année sabbatique : voyager, apprendre, respirer. Ton employeur pourrait l’accepter.',
    minAge: 26, maxAge: 55,
    when: (s) => hasJob(s) && s.job!.years >= 4 && liquid(s) >= 12000,
    choices: [
      {
        id: 'partir',
        label: 'Partir un an autour du monde',
        hint: 'Environ 15 000 €, sans salaire.',
        outcome: { text: 'Amérique du Sud, Asie, Océanie. Tu reviens transformé{|e}, avec un regard neuf sur ce qui compte.', fx: { money: -15000, loseJob: 'demission', happiness: 15, energy: 25, health: 6, skills: { social: 6, creative: 4 }, friends: -4, highlight: { kind: 'key', text: 'Une année sabbatique autour du monde' } } },
      },
      {
        id: 'court',
        label: 'Prendre seulement trois mois',
        outcome: { text: 'Trois mois de congé sans solde pour souffler. Ça suffit à recharger les batteries.', fx: { money: -5000, happiness: 8, energy: 15 } },
      },
      {
        id: 'non',
        label: 'Ce n’est pas le moment',
        outcome: { text: 'Un jour, peut-être.', fx: { happiness: -2 } },
      },
    ],
  },
  {
    id: 'chg_crise_quarantaine',
    category: 'changement',
    title: 'La crise de la quarantaine',
    text: 'Quarante ans passés. Tu te surprends à regarder des voitures de sport, des annonces de voilier, des formations de luthier.',
    minAge: 40, maxAge: 50,
    choices: [
      {
        id: 'voiture',
        label: 'S’offrir la voiture de sport',
        hint: '45 000 € à crédit.',
        outcome: { text: 'Le moteur rugit. Ton banquier aussi.', fx: { addDebt: { kind: 'conso', label: 'Crédit voiture de sport', amount: 45000, rate: 0.059, years: 6 }, money: -45000, happiness: 8, flags: { voiture: true }, highlight: { kind: 'mistake', text: 'Une voiture de sport à crédit' } } },
      },
      {
        id: 'passion',
        label: 'Se lancer dans une nouvelle passion',
        outcome: { text: 'Cours de musique, atelier de menuiserie : tu te découvres de nouveaux talents.', fx: { money: -1500, happiness: 8, skills: { creative: 6, craft: 4 } } },
      },
      {
        id: 'therapie',
        label: 'En parler à un professionnel',
        outcome: { text: 'Quelques séances t’aident à faire la paix avec le temps qui passe.', fx: { money: -800, happiness: 6, health: 2 } },
      },
    ],
  },
  {
    id: 'chg_retraite_anticipee',
    category: 'changement',
    title: 'Et si on s’arrêtait ?',
    text: 'Tes comptes sont solides. Un calcul rapide te montre que tu pourrais peut-être arrêter de travailler dès maintenant.',
    minAge: 45, maxAge: 62,
    when: (s) => nw(s) >= 600000 && (hasJob(s) || !!s.business),
    choices: [
      {
        id: 'arreter',
        label: 'Arrêter de travailler',
        outcome: { text: 'Tu poses ta démission avec un sourire. Une nouvelle vie commence, libre.', fx: { loseJob: 'demission', happiness: 12, energy: 20, flags: { retraiteAnticipee: true }, highlight: { kind: 'key', text: 'Retraite anticipée' } } },
      },
      {
        id: 'mi_temps',
        label: 'Passer à mi-temps',
        outcome: { text: 'Tu négocies un mi-temps. Le meilleur des deux mondes.', fx: { salaryPct: -50, energy: 12, happiness: 6 } },
      },
      {
        id: 'continuer',
        label: 'Continuer : tu aimes ce que tu fais',
        outcome: { text: 'Le travail, c’est aussi une source de sens et de lien.', fx: { happiness: 2 } },
      },
    ],
  },
  {
    id: 'chg_campagne',
    category: 'changement',
    title: 'Le retour à la terre',
    text: 'Le bruit de la ville te pèse. Une longère à rénover, au calme, se vend une bouchée de pain à deux heures de route.',
    minAge: 30, maxAge: 60,
    when: (s) => !s.flags.rural && s.housingId !== 'parents',
    cooldown: 20,
    choices: [
      {
        id: 'partir',
        label: 'Partir vivre à la campagne',
        outcome: { text: 'Potager, silence, ciel étoilé. Tu télétravailles ou tu changes de rythme.', fx: { housingId: 'maison_location', flags: { rural: true, voiture: true }, happiness: 8, network: -8, friends: -6, health: 4 } },
      },
      {
        id: 'week_end',
        label: 'Louer une maison les week-ends',
        outcome: { text: 'Le meilleur des deux mondes, pour un budget raisonnable.', fx: { money: -2000, happiness: 5, energy: 4 } },
      },
      {
        id: 'rester',
        label: 'Rester en ville',
        outcome: { text: 'Les cafés, les cinémas, les amis : la ville a ses charmes.', fx: {} },
      },
    ],
  },
  {
    id: 'chg_nouveau_depart',
    category: 'changement',
    title: 'Repartir à zéro',
    text: 'Depuis ta séparation, tout te rappelle l’ancienne vie. Tes amis te poussent à changer d’air.',
    when: (s) => s.relations.exPartners > 0 && !s.relations.partner && !s.flags.nouveauDepart,
    choices: [
      {
        id: 'voyage',
        label: 'Partir seul{|e} en voyage',
        outcome: { text: 'Deux semaines au bout du monde. Tu reviens apaisé{|e}.', fx: { money: -1800, happiness: 10, energy: 6, flags: { nouveauDepart: true } } },
      },
      {
        id: 'amis',
        label: 'S’entourer de tes amis',
        outcome: { text: 'Soirées, confidences, fous rires : tes amis sont là.', fx: { friends: 10, happiness: 6, flags: { nouveauDepart: true } } },
      },
      {
        id: 'travail',
        label: 'Te jeter dans le travail',
        outcome: { text: 'Tu travailles comme jamais. Ça occupe l’esprit… et ça repousse le chagrin.', fx: { performance: 10, energy: -6, happiness: -2, flags: { nouveauDepart: true } } },
      },
    ],
  },
  {
    id: 'chg_animal',
    category: 'changement',
    title: 'Un compagnon à quatre pattes',
    text: 'Le refuge du coin croule sous les abandons. Un chien aux grands yeux semble t’avoir choisi{|e}.',
    cooldown: 15,
    when: (s) => s.housingId !== 'parents' && s.housingId !== 'coloc',
    choices: [
      {
        id: 'adopter',
        label: 'L’adopter',
        outcome: { text: 'Promenades quotidiennes, câlins, vétérinaire : il change ta vie et ton budget (environ 900 € par an).', fx: { money: -900, happiness: 8, health: 3, flags: { chien: true } } },
      },
      {
        id: 'non',
        label: 'Pas le bon moment',
        outcome: { text: 'Tu caresses le chien une dernière fois et repars le cœur serré.', fx: {} },
      },
    ],
  },
  {
    id: 'chg_engagement_local',
    category: 'changement',
    title: 'Les élections municipales',
    text: 'Une liste citoyenne te propose de figurer en position éligible aux élections municipales.',
    minAge: 30,
    when: (s) => s.relations.network >= 40,
    cooldown: 25,
    choices: [
      {
        id: 'oui',
        label: 'Se présenter',
        outcome: roll(0.5,
          { text: 'Élu{|e} ! Conseils municipaux, projets locaux : tu t’impliques pour ta ville.', fx: { network: 15, energy: -8, happiness: 6, skills: { manage: 4, social: 4 }, highlight: { kind: 'key', text: 'Élu{|e} au conseil municipal' } } },
          { text: 'La liste perd de peu. Une belle aventure humaine malgré tout.', fx: { network: 8, friends: 4 } }),
      },
      {
        id: 'non',
        label: 'Décliner',
        outcome: { text: 'La politique, très peu pour toi.', fx: {} },
      },
    ],
  },
  {
    id: 'chg_famille_recomposee',
    category: 'changement',
    title: 'La famille recomposée',
    text: '{partner} a déjà un enfant d’une précédente union. Il viendra vivre avec vous une semaine sur deux.',
    when: (s) => coupled(s) && s.relations.partner!.cohabiting && s.relations.partner!.years <= 2 && !s.flags.recomposee,
    rare: true,
    choices: [
      {
        id: 'accueillir',
        label: 'L’accueillir à bras ouverts',
        outcome: { text: 'Il faut du temps, mais un lien sincère se crée. Ta famille s’agrandit autrement.', fx: { partner: 10, happiness: 4, energy: -4, money: -1200, flags: { recomposee: true } } },
      },
      {
        id: 'distance',
        label: 'Garder une certaine distance',
        outcome: { text: 'Tu restes cordial{|e}, sans plus. {partner} le remarque.', fx: { partner: -6, flags: { recomposee: true } } },
      },
    ],
  },
];
