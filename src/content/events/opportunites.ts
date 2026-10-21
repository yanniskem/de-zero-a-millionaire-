// Opportunités inattendues.

import type { GameEvent } from '../../engine/eventTypes';
import { hasBiz, hasJob, liquid, roll } from './helpers';

export const OPPORTUNITE_EVENTS: GameEvent[] = [
  {
    id: 'opp_jeu_tele',
    category: 'opportunite',
    title: 'Le jeu télévisé',
    text: 'Tu as été sélectionné{|e} pour participer à un jeu de culture générale à la télévision. Le grand gagnant repart avec 50 000 €.',
    rare: true,
    choices: [
      {
        id: 'jouer',
        label: 'Jouer prudemment',
        outcome: roll(0.6,
          { text: 'Tu t’arrêtes au bon moment avec 8 000 € en poche. Ta famille est fière.', fx: { money: 8000, happiness: 6, family: 3 } },
          { text: 'Une question sur la géographie de l’Océanie te fait trébucher. Tu repars avec 1 000 €.', fx: { money: 1000, happiness: 2 } }),
      },
      {
        id: 'risquer',
        label: 'Tout risquer pour le gros lot',
        outcome: roll(0.18,
          { text: 'INCROYABLE ! Tu remportes les 50 000 € ! Le public est debout.', fx: { money: 50000, happiness: 12, network: 6, highlight: { kind: 'success', text: 'Gagner 50 000 € à un jeu télévisé' } } },
          { text: 'Tu tentes le tout pour le tout… et repars avec un lot de consolation.', fx: { money: 300, happiness: -3 } }),
      },
    ],
  },
  {
    id: 'opp_mentor',
    category: 'opportunite',
    title: 'Le vieux monsieur du café',
    text: 'Chaque matin au café, tu croises un vieil homme qui lit les pages économiques. Un jour, il engage la conversation : il a bâti et revendu trois entreprises.',
    minAge: 20, maxAge: 45,
    rare: true,
    choices: [
      {
        id: 'ecouter',
        label: 'Lui demander conseil chaque semaine',
        outcome: { text: 'Pendant un an, il devient ton mentor. Gestion, négociation, patience : ses leçons valent de l’or.', fx: { skills: { finance: 8, manage: 6, social: 3 }, network: 10, flags: { mentor: true }, delayed: [{ years: 3, eventId: 'suite_mentor' }] } },
      },
      {
        id: 'poli',
        label: 'Rester poli mais distant',
        outcome: { text: 'Vous échangez des banalités sur la météo. Une occasion manquée, peut-être.', fx: {} },
      },
    ],
  },
  {
    id: 'opp_benevolat',
    category: 'opportunite',
    title: 'L’association du quartier',
    text: 'L’association d’aide aux devoirs de ton quartier cherche des bénévoles le samedi matin.',
    cooldown: 10,
    choices: [
      {
        id: 'oui',
        label: 'S’engager chaque semaine',
        outcome: { text: 'Tu aides des collégiens à reprendre confiance. Tu rencontres aussi des gens formidables.', fx: { happiness: 6, network: 6, friends: 4, skills: { social: 3, care: 3 }, energy: -3, moral: 'good' } },
      },
      {
        id: 'ponctuel',
        label: 'Aider ponctuellement',
        outcome: { text: 'Tu donnes un coup de main lors des grands événements.', fx: { happiness: 2, network: 2 } },
      },
      {
        id: 'non',
        label: 'Pas le temps',
        outcome: { text: 'Peut-être plus tard.', fx: {} },
      },
    ],
  },
  {
    id: 'opp_concours_innovation',
    category: 'opportunite',
    title: 'Le concours d’innovation',
    text: 'Une région organise un concours d’innovation doté de 20 000 €. Il faut présenter un projet en cinq minutes devant un jury.',
    minAge: 20, maxAge: 50,
    when: (s) => s.skills.tech >= 45 || s.skills.creative >= 45 || hasBiz(s),
    cooldown: 10,
    choices: [
      {
        id: 'participer',
        label: 'Préparer un pitch percutant',
        outcome: roll((s) => 0.2 + (s.skills.social + Math.max(s.skills.tech, s.skills.creative)) / 400,
          { text: 'Premier prix ! 20 000 € et un article dans la presse régionale.', fx: { money: 20000, network: 12, happiness: 8, highlight: { kind: 'success', text: 'Lauréat{|e} d’un concours d’innovation' } } },
          { text: 'Pas de prix, mais un juré te laisse sa carte de visite.', fx: { network: 6, skills: { social: 3 } } }),
      },
      {
        id: 'non',
        label: 'Ne pas participer',
        outcome: { text: 'Tu n’es pas à l’aise sur scène.', fx: {} },
      },
    ],
  },
  {
    id: 'opp_mission_freelance',
    category: 'opportunite',
    title: 'La mission du week-end',
    text: 'Une connaissance cherche quelqu’un pour une mission ponctuelle dans ton domaine : trois week-ends de travail, 2 500 €.',
    minAge: 20,
    when: (s) => hasJob(s) && Math.max(s.skills.tech, s.skills.craft, s.skills.creative, s.skills.finance, s.skills.manage) >= 40,
    cooldown: 4,
    choices: [
      {
        id: 'accepter',
        label: 'Accepter la mission',
        outcome: { text: 'Mission accomplie : 2 500 € de plus et un client satisfait qui parlera de toi.', fx: { money: 2500, energy: -8, network: 4 } },
      },
      {
        id: 'refuser',
        label: 'Refuser pour garder ses week-ends',
        outcome: { text: 'Tes week-ends restent à toi.', fx: { happiness: 1 } },
      },
    ],
  },
  {
    id: 'opp_vide_grenier',
    category: 'opportunite',
    title: 'Le grand tri',
    text: 'Ton logement déborde d’objets inutilisés. Une plateforme de revente en ligne te tend les bras.',
    cooldown: 12,
    choices: [
      {
        id: 'vendre',
        label: 'Tout vendre en ligne',
        outcome: { text: 'Vêtements, console, livres : tu récupères 650 € et de la place.', fx: { money: 650, happiness: 3 } },
      },
      {
        id: 'donner',
        label: 'Donner à une association',
        outcome: { text: 'Tu offres tout à une ressourcerie. Ça fait du bien.', fx: { happiness: 4, moral: 'good' } },
      },
    ],
  },
  {
    id: 'opp_collab_influenceur',
    category: 'opportunite',
    title: 'La collaboration en ligne',
    text: 'Une amie influenceuse propose de mettre en avant ton activité ou ton talent auprès de ses 400 000 abonnés.',
    when: (s) => hasBiz(s) || s.skills.creative >= 40,
    rare: true,
    choices: [
      {
        id: 'oui',
        label: 'Accepter la collaboration',
        outcome: (s) => (s.business
          ? { text: 'Les commandes affluent pendant des semaines !', fx: { biz: { reputation: 12, cash: 7000 }, network: 6 } }
          : { text: 'Tes créations font le tour des réseaux. On te commande des illustrations.', fx: { money: 3000, network: 8, skills: { creative: 3 } } }),
      },
      {
        id: 'non',
        label: 'Rester discret',
        outcome: { text: 'Tu préfères grandir à ton rythme.', fx: {} },
      },
    ],
  },
  {
    id: 'opp_terrain_famille',
    category: 'opportunite',
    title: 'Le terrain de l’oncle',
    text: 'Ton oncle veut se débarrasser d’un terrain constructible en périphérie. Il te le propose à 15 000 €, bien en dessous du marché.',
    minAge: 25, maxAge: 60,
    rare: true,
    when: (s) => s.relations.family >= 45 && liquid(s) >= 15000,
    choices: [
      {
        id: 'acheter',
        label: 'Acheter le terrain',
        cost: 15000,
        outcome: { text: 'Le terrain est à toi. Les promoteurs commencent à s’intéresser à la zone.', fx: { family: 4, delayed: [{ years: 6, title: 'Le terrain prend de la valeur', text: 'La zone a été rendue constructible pour un lotissement. Un promoteur rachète ton terrain 48 000 €.', fx: { money: 48000, highlight: { kind: 'success', text: 'Revente d’un terrain avec une belle plus-value' } } }] } },
      },
      {
        id: 'refuser',
        label: 'Décliner',
        outcome: { text: 'Ton oncle le vend à un voisin.', fx: {} },
      },
    ],
  },
  {
    id: 'opp_cagnotte_entreprise',
    category: 'opportunite',
    title: 'L’intéressement',
    text: 'Ton entreprise a fait une excellente année : chaque salarié reçoit une prime d’intéressement. Tu peux la toucher ou la placer sur le plan d’épargne entreprise, abondé par l’employeur.',
    when: (s) => hasJob(s) && s.job!.years >= 1 && (s.job!.jobId !== 'fonctionnaire' && s.job!.jobId !== 'attache' && s.job!.jobId !== 'artiste'),
    cooldown: 4,
    choices: [
      {
        id: 'toucher',
        label: 'Toucher la prime',
        outcome: (s) => ({ text: 'La prime arrive sur ton compte.', fx: { money: Math.round((s.job?.salary ?? 2000) * 0.8) } }),
      },
      {
        id: 'placer',
        label: 'La placer avec l’abondement de l’employeur',
        outcome: (s) => ({ text: 'Ton employeur ajoute 50 % à ta prime. Le tout est investi en fonds diversifiés.', fx: { money: Math.round((s.job?.salary ?? 2000) * 0.8), stocks: Math.round((s.job?.salary ?? 2000) * 1.2), skills: { finance: 2 } } }),
      },
    ],
  },
];
