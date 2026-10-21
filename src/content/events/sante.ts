// Santé et bien-être (sans prétention médicale : les statistiques représentent des tendances générales).

import { JOB_BY_ID } from '../../engine/catalog';
import type { GameEvent } from '../../engine/eventTypes';
import { roll } from './helpers';

export const SANTE_EVENTS: GameEvent[] = [
  {
    id: 'san_sport',
    category: 'sante',
    title: 'Se remettre au sport',
    text: 'Monter trois étages te laisse essoufflé{|e}. Une salle de sport ouvre en bas de chez toi, et un collègue cherche un partenaire de course.',
    when: (s) => !s.flags.sportif,
    cooldown: 8,
    choices: [
      {
        id: 'salle',
        label: 'S’abonner à la salle (40 € par mois)',
        outcome: roll((s) => 0.4 + s.energy / 200,
          { text: 'Trois séances par semaine, et tu tiens ! Tu dors mieux et tu te sens plus fort{|e}.', fx: { money: -480, flags: { sportif: true }, health: 6, energy: 6, happiness: 4 } },
          { text: 'Tu y vas assidûment… pendant trois semaines. L’abonnement, lui, continue.', fx: { money: -480, health: 1 } }),
      },
      {
        id: 'course',
        label: 'Courir avec ton collègue',
        outcome: { text: 'Deux sorties par semaine, gratuites. Tu prépares même un 10 km.', fx: { flags: { sportif: true }, health: 5, energy: 4, friends: 3, network: 2 } },
      },
      {
        id: 'canape',
        label: 'Le canapé, c’est bien aussi',
        outcome: { text: 'Peut-être l’année prochaine.', fx: { health: -1 } },
      },
    ],
  },
  {
    id: 'san_dos',
    category: 'sante',
    title: 'Le mal de dos',
    text: 'Depuis des semaines, une douleur dans le bas du dos te gâche les journées. Le médecin conseille de la kinésithérapie et de ménager tes efforts.',
    when: (s) => (s.job ? JOB_BY_ID[s.job.jobId].physical >= 40 : false) || s.age >= 38,
    cooldown: 10,
    choices: [
      {
        id: 'kine',
        label: 'Suivre sérieusement la kinésithérapie',
        outcome: { text: 'Exercices quotidiens, séances régulières : ton dos va mieux. Tu as appris à te protéger.', fx: { health: 6, money: -200, energy: -2 } },
      },
      {
        id: 'ignorer',
        label: 'Serrer les dents et continuer',
        outcome: { text: 'La douleur devient chronique. Certains jours sont un calvaire.', fx: { health: -8, happiness: -4, delayed: [{ years: 3, title: 'Le dos lâche', text: 'Ton dos lâche pour de bon : arrêt de travail de deux mois et rééducation.', fx: { health: -8, money: -800, performance: -10 } }] } },
      },
      {
        id: 'amenagement',
        label: 'Demander un aménagement de poste',
        requires: (s) => !!s.job,
        requiresText: 'Il faut un emploi.',
        outcome: roll(0.6,
          { text: 'Ton employeur adapte ton poste. Ton dos te remercie.', fx: { health: 5, performance: -2 } },
          { text: 'Ton employeur fait la sourde oreille. Tu tiens bon, difficilement.', fx: { health: -3 } }),
      },
    ],
  },
  {
    id: 'san_bilan',
    category: 'sante',
    title: 'Le bilan de santé',
    text: 'Ta mutuelle t’offre un bilan de santé complet. Le médecin fronce les sourcils devant tes résultats : tension et cholestérol un peu élevés.',
    minAge: 38,
    cooldown: 12,
    choices: [
      {
        id: 'changer',
        label: 'Changer radicalement d’hygiène de vie',
        outcome: { text: 'Moins de sel, plus de légumes, marche quotidienne : six mois plus tard, tes résultats sont bons.', fx: { health: 10, happiness: 2, flags: { sportif: true } } },
      },
      {
        id: 'medicaments',
        label: 'Prendre le traitement sans changer le reste',
        outcome: { text: 'Le traitement stabilise les chiffres. Le reste ne change pas.', fx: { health: 2 } },
      },
      {
        id: 'ignorer',
        label: 'Ignorer les conseils',
        outcome: { text: 'Tu te sens bien, alors à quoi bon ?', fx: { delayed: [{ years: 5, title: 'L’alerte cardiaque', text: 'Une douleur dans la poitrine, une nuit aux urgences. Plus de peur que de mal, mais il faut tout changer.', fx: { health: -15, happiness: -6, money: -500 } }] } },
      },
    ],
  },
  {
    id: 'san_tabac',
    category: 'sante',
    title: 'Arrêter de fumer ?',
    text: 'Le paquet a encore augmenté. Tu fumes depuis des années et tu sens que ton souffle n’est plus le même.',
    when: (s) => !!s.flags.fumeur,
    choices: [
      {
        id: 'arreter',
        label: 'Arrêter, avec un accompagnement',
        outcome: roll(0.6,
          { text: 'Les premières semaines sont terribles. Puis, un jour, l’envie disparaît. Tu économises plus de 3 000 € par an.', fx: { flags: { fumeur: false }, health: 8, money: 500, happiness: 4, highlight: { kind: 'success', text: 'Arrêt définitif du tabac' } } },
          { text: 'Rechute au bout de deux mois. Tu réessaieras.', fx: { happiness: -2 } }),
      },
      {
        id: 'continuer',
        label: 'Continuer',
        outcome: { text: 'Tu allumes une cigarette pour réfléchir à la question.', fx: { health: -2, money: -300 } },
      },
    ],
  },
  {
    id: 'san_tentation_tabac',
    category: 'sante',
    title: 'La cigarette du soir',
    text: 'Après une journée stressante, un collègue te tend une cigarette sur le parking. « Juste une, ça détend. »',
    maxAge: 35,
    when: (s) => !s.flags.fumeur && !s.flags.antiTabac && s.energy < 55,
    choices: [
      {
        id: 'accepter',
        label: 'Accepter',
        outcome: roll(0.5,
          { text: 'Une cigarette, puis une autre le lendemain. L’habitude s’installe.', fx: { flags: { fumeur: true }, happiness: 1 } },
          { text: 'Tu tousses à t’en arracher les poumons. Plus jamais.', fx: { flags: { antiTabac: true } } }),
      },
      {
        id: 'refuser',
        label: 'Refuser poliment',
        outcome: { text: 'Tu préfères une marche autour du pâté de maisons.', fx: { flags: { antiTabac: true }, health: 1 } },
      },
    ],
  },
  {
    id: 'san_meditation',
    category: 'sante',
    title: 'Respirer',
    text: 'Ton esprit tourne en boucle le soir. Une amie te recommande la méditation, une autre la sophrologie, une troisième… un bon verre de vin.',
    cooldown: 10,
    choices: [
      {
        id: 'mediter',
        label: 'Essayer la méditation dix minutes par jour',
        outcome: { text: 'Au début, c’est frustrant. Puis tu remarques que tu t’énerves moins vite.', fx: { energy: 5, happiness: 5, health: 2 } },
      },
      {
        id: 'sophro',
        label: 'Consulter un sophrologue',
        outcome: { text: 'Quelques séances qui t’apprennent à mieux gérer ton stress.', fx: { money: -350, energy: 6, happiness: 4 } },
      },
      {
        id: 'vin',
        label: 'Le verre de vin du soir',
        outcome: { text: 'Ça détend… sur le moment. L’habitude s’installe insidieusement.', fx: { happiness: 2, health: -3 } },
      },
    ],
  },
  {
    id: 'san_accident_sport',
    category: 'sante',
    title: 'La blessure',
    text: 'Une mauvaise réception au sport : ligaments du genou touchés. Le chirurgien propose une opération.',
    when: (s) => !!s.flags.sportif,
    cooldown: 12,
    choices: [
      {
        id: 'operer',
        label: 'Se faire opérer et suivre la rééducation',
        outcome: { text: 'Six mois de rééducation patiente. Ton genou est comme neuf.', fx: { health: -4, energy: -6, money: -300, performance: -4 } },
      },
      {
        id: 'repos',
        label: 'Laisser guérir seul',
        outcome: roll(0.5,
          { text: 'Avec du repos, le genou se stabilise.', fx: { health: -3 } },
          { text: 'Le genou reste fragile. Tu dois renoncer à ton sport favori.', fx: { health: -8, flags: { sportif: false }, happiness: -5 } }),
      },
    ],
  },
  {
    id: 'san_insomnie',
    category: 'sante',
    title: 'Les nuits blanches',
    text: 'Depuis des semaines, tu te réveilles à 3 heures du matin en pensant au travail ou à l’argent. La fatigue s’accumule.',
    when: (s) => s.energy < 50,
    cooldown: 6,
    choices: [
      {
        id: 'medecin',
        label: 'Consulter ton médecin',
        outcome: { text: 'Il t’aide à identifier les sources de stress et te donne des conseils concrets.', fx: { energy: 8, health: 3 } },
      },
      {
        id: 'ecrans',
        label: 'Couper les écrans le soir',
        outcome: { text: 'Livres papier et tisane : tes nuits s’améliorent nettement.', fx: { energy: 6, happiness: 2 } },
      },
      {
        id: 'cafe',
        label: 'Compenser avec du café',
        outcome: { text: 'Quatre cafés par jour. Tu tiens, mais tu es à cran.', fx: { energy: -4, health: -3, happiness: -2 } },
      },
    ],
  },
  {
    id: 'san_cuisine',
    category: 'sante',
    title: 'Fast-food ou fourneaux ?',
    text: 'Tu remarques que tu commandes à manger quatre soirs par semaine. Ton corps et ton compte en banque protestent.',
    maxAge: 50,
    cooldown: 12,
    choices: [
      {
        id: 'cuisiner',
        label: 'Apprendre à cuisiner',
        outcome: { text: 'Quelques tutoriels, un bon couteau, des recettes simples : tu manges mieux pour moins cher.', fx: { health: 5, money: 800, skills: { craft: 3, creative: 2 } } },
      },
      {
        id: 'continuer',
        label: 'Continuer, tu n’as pas le temps',
        outcome: { text: 'Les livreurs connaissent ton prénom.', fx: { health: -3, money: -600 } },
      },
    ],
  },
  {
    id: 'san_vacances_forcees',
    category: 'sante',
    title: 'Le corps dit stop',
    text: 'Un matin, impossible de te lever. Ton médecin parle de surmenage et te prescrit du repos.',
    when: (s) => s.energy < 30 && s.health < 60,
    cooldown: 5,
    choices: [
      {
        id: 'repos',
        label: 'Accepter l’arrêt et se reposer vraiment',
        outcome: { text: 'Trois semaines de vrai repos. Tu reviens plus lucide sur tes priorités.', fx: { energy: 18, health: 6, performance: -4, flags: { alerteSante: true } } },
      },
      {
        id: 'refuser',
        label: 'Refuser l’arrêt et retourner travailler',
        outcome: { text: 'Tu reprends le lendemain, les traits tirés.', fx: { energy: -6, health: -8, performance: 2, highlight: { kind: 'mistake', text: 'Ignorer les signaux d’épuisement' } } },
      },
    ],
  },
];
