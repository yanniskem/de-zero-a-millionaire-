// Réussites et paliers.

import type { GameEvent } from '../../engine/eventTypes';
import { hasBiz, hasJob, nw, roll } from './helpers';

export const REUSSITE_EVENTS: GameEvent[] = [
  {
    id: 'reu_prix_employe',
    category: 'reussite',
    title: 'La reconnaissance',
    text: 'Lors de la soirée annuelle de l’entreprise, ton nom est prononcé au micro : tu reçois le prix de la meilleure contribution de l’année.',
    when: (s) => hasJob(s) && s.job!.performance >= 70,
    cooldown: 8,
    choices: [
      {
        id: 'humble',
        label: 'Remercier ton équipe',
        outcome: { text: 'Ton discours humble touche tout le monde. Tes collègues t’adorent.', fx: { friends: 4, network: 6, happiness: 6, money: 1000, highlight: { kind: 'success', text: 'Prix de la meilleure contribution de l’année' } } },
      },
      {
        id: 'negocier',
        label: 'En profiter pour négocier une augmentation',
        outcome: roll(0.7,
          { text: 'Le moment est parfait : ta direction t’accorde 8 % d’augmentation.', fx: { salaryPct: 8, money: 1000, happiness: 6, highlight: { kind: 'success', text: 'Prix de l’année et augmentation de 8 %' } } },
          { text: 'Ta direction trouve la démarche un peu précipitée. Tu gardes le prix, pas l’augmentation.', fx: { money: 1000, happiness: 3 } }),
      },
    ],
  },
  {
    id: 'reu_presse',
    category: 'reussite',
    title: 'Ton portrait dans le journal',
    text: (s) => `Un journaliste du quotidien régional veut faire ton portrait : « ${s.business ? `Le succès de ${s.business.name}` : 'Un parcours inspirant'} ».`,
    when: (s) => (hasBiz(s) && s.business!.reputation >= 55) || s.relations.network >= 70,
    cooldown: 10,
    choices: [
      {
        id: 'oui',
        label: 'Accepter l’interview',
        outcome: (s) => ({ text: 'L’article est partagé des centaines de fois. Ta notoriété locale grimpe.', fx: { network: 8, happiness: 5, ...(s.business ? { biz: { reputation: 8 } } : {}) } }),
      },
      {
        id: 'non',
        label: 'Rester discret',
        outcome: { text: 'Tu préfères l’ombre à la lumière.', fx: {} },
      },
    ],
  },
  {
    id: 'reu_objectif_epargne',
    category: 'reussite',
    title: '10 000 € d’épargne !',
    text: 'Pour la première fois de ta vie, ton épargne dépasse 10 000 €. Un vrai filet de sécurité.',
    when: (s) => s.savings >= 10000 && !s.flags.epargne10k,
    choices: [
      {
        id: 'feter',
        label: 'Fêter ça raisonnablement',
        outcome: { text: 'Un bon restaurant pour marquer le coup. Tu l’as mérité.', fx: { money: -120, happiness: 5, flags: { epargne10k: true }, highlight: { kind: 'success', text: 'Première épargne de 10 000 €' } } },
      },
      {
        id: 'investir',
        label: 'Investir la moitié pour aller plus loin',
        outcome: { text: 'Tu places 5 000 € en fonds indiciels. Ton argent va travailler pour toi.', fx: { savings: -5000, stocks: 5000, flags: { epargne10k: true }, skills: { finance: 3 }, highlight: { kind: 'success', text: 'Première épargne de 10 000 €' } } },
      },
    ],
  },
  {
    id: 'reu_marathon',
    category: 'reussite',
    title: 'Le marathon',
    text: 'Des mois d’entraînement pour ce jour-là : 42,195 km. Au 30e kilomètre, tes jambes hurlent.',
    when: (s) => !!s.flags.sportif && s.health >= 65,
    cooldown: 20,
    choices: [
      {
        id: 'finir',
        label: 'Serrer les dents et finir',
        outcome: { text: 'Tu franchis la ligne en larmes. Une fierté immense.', fx: { happiness: 10, health: 3, highlight: { kind: 'success', text: 'Finir un marathon' } } },
      },
      {
        id: 'marcher',
        label: 'Finir en marchant',
        outcome: { text: 'Ce n’est pas le chrono qui compte. Tu as fini.', fx: { happiness: 6 } },
      },
    ],
  },
  {
    id: 'reu_cap_100k',
    category: 'reussite',
    title: 'Six chiffres',
    text: 'Tu fais tes comptes : en additionnant tout ce que tu possèdes et en retirant tes dettes, tu dépasses 100 000 €. Il y a quelques années, tu n’aurais jamais osé l’imaginer.',
    when: (s) => nw(s) >= 100000 && !s.flags.evt100k,
    choices: [
      {
        id: 'continuer',
        label: 'Garder le cap',
        outcome: { text: 'Tu ne changes rien. La discipline paie.', fx: { flags: { evt100k: true }, happiness: 4, skills: { finance: 2 } } },
      },
      {
        id: 'cadeau',
        label: 'Offrir un voyage à tes parents',
        outcome: { text: 'Tes parents découvrent le Japon grâce à toi. Leur gratitude n’a pas de prix.', fx: { money: -4000, family: 12, happiness: 6, flags: { evt100k: true } } },
      },
      {
        id: 'se_faire_plaisir',
        label: 'S’offrir quelque chose de spécial',
        outcome: { text: 'Une belle montre, un voyage, un objet rêvé depuis l’enfance.', fx: { money: -5000, happiness: 8, flags: { evt100k: true } } },
      },
    ],
  },
  {
    id: 'reu_conference',
    category: 'reussite',
    title: 'L’invitation à parler',
    text: 'Une conférence professionnelle t’invite à témoigner de ton expérience devant 500 personnes.',
    when: (s) => (hasJob(s) && s.job!.years >= 5 && s.job!.performance >= 60) || (hasBiz(s) && s.business!.years >= 3),
    cooldown: 10,
    choices: [
      {
        id: 'oui',
        label: 'Accepter et préparer soigneusement',
        outcome: roll((s) => 0.4 + s.skills.social / 150,
          { text: 'Ton intervention est applaudie. Trois entreprises te contactent ensuite.', fx: { network: 14, happiness: 6, skills: { social: 4 } } },
          { text: 'Le trac te paralyse un peu, mais tu t’en sors. Une expérience formatrice.', fx: { network: 5, skills: { social: 5 } } }),
      },
      {
        id: 'non',
        label: 'Décliner',
        outcome: { text: 'Parler en public, très peu pour toi.', fx: {} },
      },
    ],
  },
  {
    id: 'reu_dette_soldee',
    category: 'reussite',
    title: 'Libéré{|e} des dettes',
    text: 'Tu viens de rembourser ton dernier crédit à la consommation. Ton relevé bancaire n’a jamais été aussi léger.',
    when: (s) => s.counters.yearsInDebt >= 2 && !s.debts.some((d) => d.kind === 'conso' || d.kind === 'decouvert') && !s.flags.libereDettes,
    choices: [
      {
        id: 'promesse',
        label: 'Se promettre de ne plus jamais emprunter pour consommer',
        outcome: { text: 'Une promesse solennelle. Ta mensualité devient désormais ton épargne.', fx: { flags: { libereDettes: true, discipline: true }, happiness: 8, skills: { finance: 4 }, highlight: { kind: 'success', text: 'Toutes ses dettes de consommation remboursées' } } },
      },
      {
        id: 'feter',
        label: 'Fêter ça',
        outcome: { text: 'Un dîner avec tes amis pour célébrer ta liberté retrouvée.', fx: { flags: { libereDettes: true }, money: -150, friends: 4, happiness: 6 } },
      },
    ],
  },
  {
    id: 'reu_oeuvre',
    category: 'reussite',
    title: 'L’exposition',
    text: 'Une galerie remarque ton travail et te propose une exposition personnelle.',
    when: (s) => s.skills.creative >= 60 && !s.flags.artisteReconnu,
    choices: [
      {
        id: 'exposer',
        label: 'Exposer et tout donner',
        outcome: roll((s) => 0.3 + s.skills.creative / 200,
          { text: 'Vernissage bondé, critiques élogieuses, œuvres vendues. Ton nom circule dans le milieu.', fx: { money: 6000, network: 12, happiness: 10, flags: { artisteReconnu: true }, highlight: { kind: 'success', text: 'Exposition personnelle saluée par la critique' } } },
          { text: 'Quelques ventes, quelques belles rencontres. Le succès viendra peut-être plus tard.', fx: { money: 1200, network: 5, happiness: 3 } }),
      },
      {
        id: 'refuser',
        label: 'Refuser, tu ne te sens pas prêt{|e}',
        outcome: { text: 'Tu préfères attendre d’avoir une œuvre plus aboutie.', fx: { skills: { creative: 2 } } },
      },
    ],
  },
];
