// Logement.

import type { GameEvent } from '../../engine/eventTypes';
import { atParents, landlord, liquid, owner, renting, roll } from './helpers';

export const LOGEMENT_EVENTS: GameEvent[] = [
  {
    id: 'log_degat_eaux',
    category: 'logement',
    title: 'Le dégât des eaux',
    text: 'Le voisin du dessus a laissé sa baignoire déborder. Ton plafond goutte, ton canapé est fichu.',
    when: (s) => !atParents(s),
    cooldown: 10,
    choices: [
      {
        id: 'assurance',
        label: 'Faire jouer l’assurance',
        outcome: { text: 'Constat amiable, expert, franchise : tu es remboursé{|e} au bout de trois mois, moins 150 €.', fx: { money: -150, energy: -3 } },
      },
      {
        id: 'voisin',
        label: 'Régler ça à l’amiable avec le voisin',
        outcome: roll(0.6,
          { text: 'Ton voisin, confus, paie un canapé neuf. Vous devenez amis.', fx: { friends: 3, happiness: 2 } },
          { text: 'Ton voisin fait la sourde oreille. Tu paies de ta poche.', fx: { money: -700, happiness: -3 } }),
      },
    ],
  },
  {
    id: 'log_proprio_vend',
    category: 'logement',
    title: 'Le propriétaire vend',
    text: 'Ton propriétaire t’annonce qu’il vend ton logement. Tu as un droit de préemption : tu peux l’acheter en priorité, ou partir dans six mois.',
    minAge: 23,
    when: (s) => renting(s) && s.housingId !== 'coloc',
    cooldown: 15,
    choices: [
      {
        id: 'chercher',
        label: 'Chercher un nouveau logement',
        outcome: { text: 'Visites, dossiers, cartons : tu trouves un logement équivalent, un peu plus cher.', fx: { money: -900, energy: -4 } },
      },
      {
        id: 'acheter',
        label: 'Étudier l’achat avec ta banque',
        hint: 'Rends-toi dans l’onglet Patrimoine pour acheter un bien.',
        outcome: { text: 'Ta banque te reçoit. À toi de voir si un achat est possible dans l’onglet Patrimoine.', fx: { skills: { finance: 3 }, money: -400 } },
      },
      {
        id: 'negocier',
        label: 'Négocier avec l’acheteur pour rester locataire',
        outcome: roll(0.5,
          { text: 'Le nouvel acheteur est un investisseur ravi d’avoir déjà un locataire. Tu restes.', fx: { happiness: 2 } },
          { text: 'L’acheteur veut habiter le logement. Tu dois partir.', fx: { money: -900, energy: -4, happiness: -3 } }),
      },
    ],
  },
  {
    id: 'log_coloc_conflit',
    category: 'logement',
    title: 'La guerre de la vaisselle',
    text: 'Dans ta colocation, la vaisselle s’entasse et l’un des colocataires ne paie plus sa part des charges depuis deux mois.',
    when: (s) => s.housingId === 'coloc',
    choices: [
      {
        id: 'reunion',
        label: 'Organiser une réunion de colocation',
        outcome: roll((s) => 0.4 + s.skills.social / 150,
          { text: 'Planning des tâches, cagnotte commune : la paix revient.', fx: { friends: 5, skills: { social: 3, manage: 2 } } },
          { text: 'La réunion tourne au règlement de comptes. Ambiance glaciale.', fx: { friends: -6, happiness: -4 } }),
      },
      {
        id: 'payer',
        label: 'Payer sa part pour avoir la paix',
        outcome: { text: 'Tu avances 300 €. Tu ne les reverras probablement jamais.', fx: { money: -300 } },
      },
      {
        id: 'partir',
        label: 'Chercher un studio',
        outcome: { text: 'Tu trouves un studio en ville moyenne. Le calme, enfin.', fx: { housingId: 'studio', money: -900, friends: -4, happiness: 3 } },
      },
    ],
  },
  {
    id: 'log_parents_pression',
    category: 'logement',
    title: '« Il serait temps… »',
    text: 'Au petit-déjeuner, tes parents t’annoncent qu’ils aimeraient récupérer ta chambre. Ils ne te mettent pas dehors, mais le message est clair.',
    minAge: 22,
    when: atParents,
    choices: [
      {
        id: 'partir',
        label: 'Prendre un studio',
        hint: 'L’indépendance a un prix.',
        outcome: { text: 'Tu signes ton premier bail. Les cartons, les meubles d’occasion, la liberté.', fx: { housingId: 'studio', money: -900, happiness: 6, family: 3 } },
      },
      {
        id: 'coloc',
        label: 'Rejoindre une colocation',
        outcome: { text: 'Tu emménages avec trois inconnus devenus amis en un mois.', fx: { housingId: 'coloc', money: -600, friends: 8, happiness: 4 } },
      },
      {
        id: 'participer',
        label: 'Proposer de payer un loyer à tes parents',
        outcome: { text: 'Tu verses 250 € par mois à tes parents. Ils acceptent que tu restes encore un peu.', fx: { familyContribution: 250, family: 4 } },
      },
    ],
  },
  {
    id: 'log_coup_de_coeur',
    category: 'logement',
    title: 'L’appartement coup de cœur',
    text: 'Un ami quitte son superbe deux-pièces lumineux en centre-ville. Il peut te recommander au propriétaire. Le loyer est plus élevé que le tien.',
    minAge: 22,
    when: (s) => renting(s) && s.housingId !== 't2' && s.housingId !== 't3',
    choices: [
      {
        id: 'prendre',
        label: 'Saisir l’occasion',
        outcome: { text: 'Parquet, moulures, balcon : tu te sens enfin chez toi.', fx: { housingId: 't2', money: -1100, happiness: 8 } },
      },
      {
        id: 'raison',
        label: 'Rester raisonnable',
        outcome: { text: 'Tu laisses passer. Ton compte en banque approuve.', fx: { skills: { finance: 2 } } },
      },
    ],
  },
  {
    id: 'log_travaux_toiture',
    category: 'logement',
    title: 'La toiture à refaire',
    text: 'Le couvreur est formel : la toiture de ton bien doit être refaite. Devis : 9 000 €. On peut attendre, mais les fuites vont s’aggraver.',
    when: (s) => s.properties.length > 0,
    cooldown: 15,
    choices: [
      {
        id: 'payer',
        label: 'Faire les travaux maintenant',
        outcome: { text: 'Toiture neuve, bien valorisé. Ça fait mal au portefeuille.', fx: { money: -9000, propertyValuePct: 2 } },
      },
      {
        id: 'credit',
        label: 'Financer par un prêt travaux',
        outcome: { text: 'Prêt travaux à 4,5 % sur 5 ans. Les travaux sont faits, la dette aussi.', fx: { addDebt: { kind: 'conso', label: 'Prêt travaux', amount: 9000, rate: 0.045, years: 5 }, money: -9000, propertyValuePct: 2 } },
      },
      {
        id: 'attendre',
        label: 'Reporter les travaux',
        outcome: { text: 'Une bâche et beaucoup d’espoir.', fx: { delayed: [{ years: 2, title: 'La toiture a lâché', text: 'L’hiver a eu raison de la vieille toiture : infiltration et dégâts intérieurs. La facture est bien plus lourde.', fx: { money: -16000, propertyValuePct: -3, highlight: { kind: 'mistake', text: 'Avoir reporté des travaux urgents' } } }] } },
      },
    ],
  },
  {
    id: 'log_locataire_impaye',
    category: 'logement',
    title: 'Le locataire qui ne paie plus',
    text: 'Le locataire de ton bien n’a pas payé son loyer depuis trois mois. Il ne répond plus.',
    when: landlord,
    cooldown: 8,
    choices: [
      {
        id: 'procedure',
        label: 'Engager une procédure d’expulsion',
        outcome: { text: 'Huissier, tribunal, délais : dix mois de loyers perdus avant de récupérer ton bien.', fx: { money: -6500, happiness: -5, energy: -4 } },
      },
      {
        id: 'dialogue',
        label: 'Aller le voir pour discuter',
        outcome: roll(0.6,
          { text: 'Il vient de perdre son emploi. Vous trouvez un échéancier, il tient parole.', fx: { money: -800, moral: 'good', happiness: 2 } },
          { text: 'Il promet beaucoup et ne paie rien. Tu finis par lancer la procédure.', fx: { money: -7000, happiness: -5 } }),
      },
      {
        id: 'assurance',
        label: 'Activer ta garantie loyers impayés',
        requires: (s) => !!s.flags.garantieLoyers,
        requiresText: 'Tu n’as pas souscrit de garantie loyers impayés.',
        outcome: { text: 'L’assurance prend tout en charge. Tu ne perds presque rien.', fx: { money: -300 } },
      },
    ],
  },
  {
    id: 'log_gestion_locative',
    category: 'logement',
    title: 'Confier la gestion de tes biens ?',
    text: 'Une agence propose de gérer tes locations : recherche de locataires, état des lieux, garantie des loyers impayés. Elle prend 8 % des loyers.',
    when: (s) => landlord(s) && !s.flags.garantieLoyers,
    choices: [
      {
        id: 'agence',
        label: 'Confier la gestion à l’agence',
        outcome: { text: 'Tu délègues tout. Moins de rendement, beaucoup moins de soucis.', fx: { flags: { garantieLoyers: true }, energy: 4, money: -600 } },
      },
      {
        id: 'seul',
        label: 'Continuer à gérer toi-même',
        outcome: { text: 'Tu gardes la main… et le téléphone allumé le dimanche.', fx: { skills: { manage: 2 } } },
      },
    ],
  },
  {
    id: 'log_voisin_bruyant',
    category: 'logement',
    title: 'Le voisin fêtard',
    text: 'Ton nouveau voisin organise des soirées trois fois par semaine. Tu ne dors plus.',
    when: (s) => !atParents(s) && s.housingId !== 'maison_location',
    cooldown: 10,
    choices: [
      {
        id: 'parler',
        label: 'Aller lui parler',
        outcome: roll((s) => 0.4 + s.skills.social / 150,
          { text: 'Il s’excuse et t’invite à la prochaine. Le volume baisse nettement.', fx: { friends: 3, energy: 3 } },
          { text: 'Il te rit au nez. Les soirées continuent.', fx: { energy: -6, happiness: -4 } }),
      },
      {
        id: 'bouchons',
        label: 'Acheter des bouchons d’oreilles et prendre sur soi',
        outcome: { text: 'Tu dors mal, mais tu évites le conflit.', fx: { energy: -5, money: -30 } },
      },
      {
        id: 'demenager',
        label: 'Déménager',
        outcome: { text: 'Tu préfères partir. Nouveau quartier, nouveau calme.', fx: { money: -1100, energy: 2, happiness: 2 } },
      },
    ],
  },
  {
    id: 'log_hausse_loyer',
    category: 'logement',
    title: 'La hausse de loyer',
    text: 'Ton propriétaire annonce une hausse de loyer de 8 %, bien au-delà de l’indice légal.',
    when: renting,
    cooldown: 10,
    choices: [
      {
        id: 'contester',
        label: 'Contester en citant la loi',
        outcome: roll(0.75,
          { text: 'Ton courrier recommandé, bien argumenté, fait mouche. La hausse est ramenée à l’indice légal.', fx: { skills: { finance: 2 }, happiness: 3 } },
          { text: 'Ton propriétaire maintient sa position. Le conflit s’enlise.', fx: { money: -400, happiness: -3 } }),
      },
      {
        id: 'accepter',
        label: 'Accepter pour éviter les histoires',
        outcome: { text: 'Tu paies plus, sans broncher.', fx: { money: -600 } },
      },
    ],
  },
  {
    id: 'log_location_courte',
    category: 'logement',
    title: 'Louer pendant les vacances',
    text: 'Ta ville accueille un grand événement cet été. Les locations de courte durée s’arrachent. Tu pourrais louer ton logement pendant tes vacances.',
    when: (s) => owner(s),
    cooldown: 6,
    choices: [
      {
        id: 'louer',
        label: 'Louer trois semaines',
        outcome: roll(0.8,
          { text: 'Des voyageurs adorables, un logement impeccable à ton retour, et 2 400 € en poche.', fx: { money: 2400 } },
          { text: 'Les voyageurs ont organisé une fête. 2 400 € encaissés, 1 500 € de réparations.', fx: { money: 900, happiness: -4 } }),
      },
      {
        id: 'non',
        label: 'Garder son chez-soi pour soi',
        outcome: { text: 'Ton logement, c’est ton refuge.' },
      },
    ],
  },
  {
    id: 'log_renovation_energie',
    category: 'logement',
    title: 'La rénovation énergétique',
    text: 'Ton bien est classé F au diagnostic énergétique. Une aide publique couvre 40 % de travaux d’isolation de 18 000 €.',
    when: (s) => s.properties.length > 0 && !s.flags.renove,
    cooldown: 8,
    choices: [
      {
        id: 'renover',
        label: 'Engager les travaux',
        hint: 'Reste à charge de 10 800 €.',
        requires: (s) => liquid(s) >= 10800,
        requiresText: 'Il te faut 10 800 € disponibles.',
        outcome: { text: 'Isolation, fenêtres, pompe à chaleur : ton bien passe en classe C et prend de la valeur.', fx: { money: -10800, propertyValuePct: 6, flags: { renove: true } } },
      },
      {
        id: 'attendre',
        label: 'Attendre',
        outcome: { text: 'Tu remets à plus tard. Les factures d’énergie, elles, n’attendent pas.', fx: { money: -500 } },
      },
    ],
  },
];
