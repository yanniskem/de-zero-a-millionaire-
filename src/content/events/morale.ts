// Décisions morales. Aucun choix n'est présenté comme le « bon » : chacun a ses conséquences.

import { JOB_BY_ID } from '../../engine/catalog';
import type { GameEvent } from '../../engine/eventTypes';
import { hasBiz, hasJob, roll } from './helpers';

export const MORALE_EVENTS: GameEvent[] = [
  {
    id: 'mor_portefeuille',
    category: 'morale',
    title: 'Le portefeuille',
    text: 'Sur un banc, tu trouves un portefeuille contenant 480 € en liquide et une carte d’identité.',
    cooldown: 20,
    choices: [
      {
        id: 'rendre',
        label: 'Le rendre à son propriétaire',
        outcome: roll(0.4,
          { text: 'Le propriétaire, un chef d’entreprise ému, insiste pour te remercier et garde ton contact.', fx: { network: 8, happiness: 5, money: 100, moral: 'good' } },
          { text: 'Une vieille dame en larmes te remercie. Tu repars avec le sourire.', fx: { happiness: 5, moral: 'good' } }),
      },
      {
        id: 'garder',
        label: 'Garder l’argent, poster les papiers',
        outcome: { text: 'Tu gardes les 480 € et envoies les papiers par la poste. Ta conscience te chatouille.', fx: { money: 480, happiness: -3, moral: 'bad' } },
      },
      {
        id: 'commissariat',
        label: 'Le déposer au commissariat',
        outcome: { text: 'Tu déposes le portefeuille aux objets trouvés. Simple et juste.', fx: { happiness: 2, moral: 'good' } },
      },
    ],
  },
  {
    id: 'mor_fraude',
    category: 'morale',
    title: 'Les comptes truqués',
    text: 'En préparant un dossier, tu découvres que ta direction maquille les comptes pour obtenir des subventions publiques.',
    minAge: 24,
    when: (s) => hasJob(s) && JOB_BY_ID[s.job!.jobId].level >= 2,
    cooldown: 25,
    choices: [
      {
        id: 'alerter',
        label: 'Lancer l’alerte auprès des autorités',
        hint: 'Le statut de lanceur d’alerte te protège… en théorie.',
        outcome: { text: 'Tu transmets les preuves à l’autorité compétente. Les mois qui suivent sont éprouvants.', fx: { happiness: -6, energy: -8, moral: 'good', delayed: [{ years: 2, eventId: 'suite_alerte' }] } },
      },
      {
        id: 'confronter',
        label: 'En parler directement à ta direction',
        outcome: roll(0.4,
          { text: 'Ta direction, prise de court, corrige discrètement les comptes. Tu gagnes un respect inattendu.', fx: { network: 4, moral: 'good' } },
          { text: 'On te fait comprendre que ta carrière dans l’entreprise est terminée. Rupture conventionnelle « proposée ».', fx: { loseJob: 'rupture', money: 3000, happiness: -6, moral: 'good' } }),
      },
      {
        id: 'taire',
        label: 'Se taire',
        outcome: { text: 'Tu refermes le dossier. Ce n’est pas ton problème… officiellement.', fx: { happiness: -5, moral: 'bad', delayed: [{ years: 4, title: 'Le scandale éclate', text: 'Le scandale finit par éclater. Tu es entendu{|e} comme témoin, et ton silence t’est reproché.', fx: { network: -10, happiness: -6 } }] } },
      },
    ],
  },
  {
    id: 'mor_travail_noir',
    category: 'morale',
    title: 'Payé en liquide',
    text: 'Un voisin te propose des travaux payés en liquide, sans déclaration. 1 500 € pour trois week-ends.',
    cooldown: 10,
    choices: [
      {
        id: 'accepter',
        label: 'Accepter, personne n’en saura rien',
        outcome: roll(0.85,
          { text: 'Tu empoches 1 500 € non déclarés.', fx: { money: 1500, energy: -6, moral: 'bad' } },
          { text: 'Un contrôle tombe sur le chantier. Amende et redressement.', fx: { money: -1200, happiness: -6, moral: 'bad', highlight: { kind: 'mistake', text: 'Pris{|e} à travailler au noir' } } }),
      },
      {
        id: 'declarer',
        label: 'Accepter, mais avec une facture déclarée',
        outcome: { text: 'Tu proposes de facturer légalement. Ton voisin accepte, en grommelant.', fx: { money: 1050, energy: -6, moral: 'good' } },
      },
      {
        id: 'refuser',
        label: 'Refuser',
        outcome: { text: 'Pas question de prendre ce risque.', fx: {} },
      },
    ],
  },
  {
    id: 'mor_fausse_reference',
    category: 'morale',
    title: 'La fausse recommandation',
    text: 'Un ami te demande de mentir pour lui : se faire passer pour son ancien employeur lors d’un appel de vérification de références.',
    cooldown: 15,
    choices: [
      {
        id: 'mentir',
        label: 'Rendre service à ton ami',
        outcome: roll(0.75,
          { text: 'Ton ami décroche le poste. Il te doit une fière chandelle.', fx: { friends: 6, moral: 'bad' } },
          { text: 'Le recruteur découvre la supercherie. Ton ami perd l’offre, et ton nom circule.', fx: { friends: -4, network: -8, moral: 'bad' } }),
      },
      {
        id: 'aider',
        label: 'Refuser, mais l’aider à préparer son entretien',
        outcome: { text: 'Tu refuses de mentir, mais tu lui fais répéter ses réponses toute une soirée.', fx: { friends: 2, skills: { social: 2 }, moral: 'good' } },
      },
      {
        id: 'refuser',
        label: 'Refuser net',
        outcome: { text: 'Ton ami est vexé.', fx: { friends: -6 } },
      },
    ],
  },
  {
    id: 'mor_erreur_faveur',
    category: 'morale',
    title: 'L’erreur en ta faveur',
    text: 'Ton employeur t’a versé deux fois ta prime annuelle par erreur. Personne ne semble s’en être aperçu.',
    when: hasJob,
    cooldown: 20,
    choices: [
      {
        id: 'signaler',
        label: 'Signaler l’erreur',
        outcome: { text: 'Le service paie te remercie. Ta réputation d’intégrité est faite.', fx: { performance: 6, network: 2, moral: 'good' } },
      },
      {
        id: 'garder',
        label: 'Garder l’argent',
        outcome: (s, r) => (r.chance(0.5)
          ? { text: 'Personne ne s’en rend jamais compte.', fx: { money: Math.round((s.job?.salary ?? 2000) * 0.6), moral: 'bad' } }
          : { text: 'Le service paie s’en aperçoit trois mois plus tard et retient la somme sur ton salaire. Ta responsable est déçue.', fx: { performance: -8, moral: 'bad' } }),
      },
    ],
  },
  {
    id: 'mor_licencier_ami',
    category: 'morale',
    title: 'Licencier un ami',
    text: 'Pour sauver l’équipe, il faut supprimer un poste. Le plus faible, objectivement, c’est Julien… ton ami de longue date.',
    when: (s) => (hasBiz(s) && s.business!.scale >= 2) || (hasJob(s) && JOB_BY_ID[s.job!.jobId].level >= 3),
    cooldown: 20,
    choices: [
      {
        id: 'licencier',
        label: 'Prendre la décision difficile',
        outcome: (s) => ({ text: 'Tu annonces la nouvelle à Julien en personne. Il ne te parle plus depuis.', fx: { friends: -10, happiness: -6, skills: { manage: 5 }, ...(s.business ? { biz: { cash: 10000 } } : { performance: 6 }) } }),
      },
      {
        id: 'autre',
        label: 'Supprimer un autre poste',
        outcome: (s) => ({ text: 'Tu épargnes Julien, mais l’équipe n’est pas dupe.', fx: { friends: 2, network: -4, ...(s.business ? { biz: { reputation: -4, cash: 6000 } } : { performance: -4 }) } }),
      },
      {
        id: 'salaire',
        label: 'Réduire ta propre rémunération pour sauver le poste',
        outcome: (s) => ({ text: 'Tu acceptes de gagner moins pour garder tout le monde. Un geste qui marque les esprits.', fx: { friends: 6, network: 4, happiness: 2, moral: 'good', ...(s.business ? { biz: { reputation: 6 } } : { salaryPct: -10 }) } }),
      },
    ],
  },
  {
    id: 'mor_don',
    category: 'morale',
    title: 'L’appel aux dons',
    text: 'Une catastrophe naturelle frappe une région du pays. Les associations lancent un appel aux dons.',
    cooldown: 8,
    choices: [
      {
        id: 'genereux',
        label: 'Donner généreusement',
        outcome: (s) => ({ text: 'Tu fais un don important. Il ouvre droit à une réduction d’impôt, mais surtout, il aide.', fx: { money: -Math.max(100, Math.round(Math.min(5000, (s.cash + s.savings) * 0.03))), happiness: 4, moral: 'good' } }),
      },
      {
        id: 'symbolique',
        label: 'Donner un peu',
        outcome: { text: 'Un don modeste, à ta mesure.', fx: { money: -50, happiness: 1 } },
      },
      {
        id: 'benevole',
        label: 'Partir aider sur place',
        outcome: { text: 'Une semaine à déblayer et à soutenir les sinistrés. Une expérience bouleversante.', fx: { energy: -8, happiness: 6, friends: 3, skills: { care: 4 }, moral: 'good' } },
      },
    ],
  },
  {
    id: 'mor_pot_de_vin',
    category: 'morale',
    title: 'L’enveloppe',
    text: 'Un fournisseur te glisse qu’une « commission » de 5 000 € serait possible si tu lui attribues un contrat important.',
    minAge: 26,
    when: (s) => (hasJob(s) && JOB_BY_ID[s.job!.jobId].level >= 3) || hasBiz(s),
    cooldown: 25,
    choices: [
      {
        id: 'accepter',
        label: 'Accepter l’enveloppe',
        outcome: roll(0.7,
          { text: 'Tu acceptes. Personne n’en sait rien… pour l’instant.', fx: { money: 5000, moral: 'bad', delayed: [{ years: 3, title: 'L’enveloppe oubliée', text: 'Le fournisseur, poursuivi dans une autre affaire, n’a pas parlé de toi. Tu as eu de la chance.', fx: { happiness: -2 } }] } },
          { text: 'Tu acceptes. Mais un audit interne remonte la piste.', fx: { money: 5000, moral: 'bad', delayed: [{ years: 1, title: 'L’audit', text: 'L’audit révèle la commission : licenciement pour faute grave et remboursement.', fx: { money: -7000, loseJob: 'licenciement', unemploymentMonths: 0, flags: { casierPro: true }, network: -15, happiness: -10, highlight: { kind: 'mistake', text: 'Licenciement pour corruption' } } }] } }),
      },
      {
        id: 'refuser',
        label: 'Refuser fermement',
        outcome: { text: 'Tu refuses et choisis le fournisseur sur ses mérites.', fx: { moral: 'good', happiness: 2 } },
      },
      {
        id: 'signaler',
        label: 'Refuser et signaler la tentative',
        outcome: { text: 'Tu alertes ta hiérarchie. Le fournisseur est écarté, ta réputation d’intégrité grandit.', fx: { network: 6, performance: 4, moral: 'good' } },
      },
    ],
  },
];
