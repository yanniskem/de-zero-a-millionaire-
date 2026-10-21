// Erreurs et difficultés.

import type { GameEvent } from '../../engine/eventTypes';
import { debtConso, eur, hasJob, liquid, roll, salary } from './helpers';

export const DIFFICULTE_EVENTS: GameEvent[] = [
  {
    id: 'dif_usurpation',
    category: 'difficulte',
    title: 'L’usurpation d’identité',
    text: 'Ta banque t’appelle : des achats de 1 800 € ont été faits avec ta carte à l’autre bout du monde.',
    cooldown: 15,
    choices: [
      {
        id: 'opposition',
        label: 'Faire opposition et porter plainte immédiatement',
        outcome: roll(0.8,
          { text: 'La banque te rembourse intégralement. Tu actives la double authentification partout.', fx: { energy: -3, skills: { tech: 2 } } },
          { text: 'La banque conteste : tu aurais été « négligent{|e} ». Tu récupères la moitié après des mois de procédure.', fx: { money: -900, happiness: -4 } }),
      },
      {
        id: 'attendre',
        label: 'Attendre de voir',
        outcome: { text: 'D’autres achats frauduleux suivent. Tu ne récupères qu’une partie des sommes.', fx: { money: -1400, happiness: -4 } },
      },
    ],
  },
  {
    id: 'dif_licenciement_eco',
    category: 'difficulte',
    title: 'Le licenciement économique',
    text: 'Ton entreprise perd son principal client. La direction annonce un licenciement économique : ton poste en fait partie.',
    minAge: 22,
    cooldown: 12,
    when: (s) => hasJob(s) && !['fonctionnaire', 'attache'].includes(s.job!.jobId) && !['infirmier', 'aide_soignant', 'cadre_sante'].includes(s.job!.jobId),
    choices: [
      {
        id: 'accepter',
        label: 'Accepter et négocier une formation',
        outcome: (s) => ({ text: `Tu pars avec ${eur(salary(s) * Math.max(1, s.job!.years) * 0.25)} d’indemnités et un financement de formation. Une page se tourne.`, fx: { money: Math.round(salary(s) * Math.max(1, s.job!.years) * 0.25), loseJob: 'licenciement', skills: { manage: 1 }, happiness: -6 } }),
      },
      {
        id: 'contester',
        label: 'Contester devant les prud’hommes',
        outcome: roll(0.35,
          { text: 'Le tribunal reconnaît un vice de procédure : indemnités doublées.', fx: { money: 9000, loseJob: 'licenciement', energy: -6 } },
          { text: 'La procédure dure deux ans pour un résultat maigre.', fx: { money: 1500, loseJob: 'licenciement', energy: -8, happiness: -6 } }),
      },
    ],
  },
  {
    id: 'dif_accident_voiture',
    category: 'difficulte',
    title: 'L’accrochage',
    text: 'Un instant d’inattention et ta voiture embrasse un poteau. Personne n’est blessé, mais la carrosserie est en miettes.',
    when: (s) => !!s.flags.voiture,
    cooldown: 10,
    choices: [
      {
        id: 'assurance',
        label: 'Passer par l’assurance',
        outcome: { text: 'Franchise de 400 € et hausse de ta prime d’assurance.', fx: { money: -800 } },
      },
      {
        id: 'garage',
        label: 'Trouver un garage pas cher',
        outcome: roll(0.6,
          { text: 'Un petit garage répare tout pour 900 €. Comme neuve.', fx: { money: -900 } },
          { text: 'Réparation bâclée : il faut tout refaire. 2 100 € au total.', fx: { money: -2100, happiness: -3 } }),
      },
    ],
  },
  {
    id: 'dif_achat_impulsif',
    category: 'difficulte',
    title: 'L’achat de trop',
    text: 'Après une semaine difficile, tu t’es offert{|e} un équipement hors de prix, commandé à minuit. Le colis arrive. Le regret aussi.',
    cooldown: 8,
    when: (s) => s.lifestyle !== 'frugal',
    choices: [
      {
        id: 'retour',
        label: 'Le renvoyer (délai de rétractation)',
        outcome: { text: 'Tu fais jouer ton droit de rétractation de 14 jours. Remboursé{|e}, moins les frais de retour.', fx: { money: -40, skills: { finance: 3 } } },
      },
      {
        id: 'garder',
        label: 'Le garder, tu l’as mérité',
        outcome: { text: 'Tu le gardes. Il finit dans un placard au bout de deux mois.', fx: { money: -1100, happiness: 1 } },
      },
    ],
  },
  {
    id: 'dif_mauvais_artisan',
    category: 'difficulte',
    title: 'Les travaux qui tournent mal',
    text: 'L’artisan que tu as payé d’avance pour refaire ta salle de bain ne répond plus. Le chantier est à moitié fini.',
    minAge: 25,
    when: (s) => s.properties.some((p) => p.isMainHome) || s.housingId === 'maison_location',
    cooldown: 15,
    choices: [
      {
        id: 'justice',
        label: 'Le mettre en demeure puis saisir la justice',
        outcome: roll(0.5,
          { text: 'Ta mise en demeure le fait réapparaître : il termine le chantier, en retard.', fx: { energy: -4 } },
          { text: 'Son entreprise a fermé. Tu dois payer un autre artisan pour finir.', fx: { money: -4500, happiness: -5 } }),
      },
      {
        id: 'soi_meme',
        label: 'Finir le chantier toi-même',
        outcome: roll((s) => 0.3 + s.skills.craft / 100,
          { text: 'Tutoriels et huile de coude : le résultat est même plutôt réussi.', fx: { money: -800, skills: { craft: 6 }, happiness: 3 } },
          { text: 'Un joint mal posé provoque une fuite. Il faut tout reprendre.', fx: { money: -3500, happiness: -4 } }),
      },
    ],
  },
  {
    id: 'dif_surendettement',
    category: 'difficulte',
    title: 'La spirale des dettes',
    text: (s) => `Tes dettes de consommation atteignent ${eur(debtConso(s))}. Chaque mois, tu rembourses un crédit avec un autre. Une conseillère d’une association te propose de l’aide.`,
    when: (s) => debtConso(s) >= 8000,
    cooldown: 6,
    choices: [
      {
        id: 'dossier',
        label: 'Déposer un dossier de surendettement',
        hint: 'Tes dettes sont rééchelonnées, mais tu es fiché{|e} plusieurs années.',
        outcome: { text: 'La commission de surendettement accepte ton dossier. Tes mensualités sont réduites, mais plus aucun crédit pendant des années.', fx: { flags: { ficheBanqueDeFrance: true, surendettement: true }, consolidateDebts: { rate: 0, years: 7, label: 'Plan de surendettement' }, happiness: 4, skills: { finance: 6 }, highlight: { kind: 'mistake', text: 'Dossier de surendettement' }, delayed: [{ years: 5, title: 'Fin du fichage bancaire', text: 'Ton inscription au fichier de la Banque de France est levée. Tu repars sur des bases saines.', fx: { flags: { ficheBanqueDeFrance: false }, happiness: 3 } }] } },
      },
      {
        id: 'rachat',
        label: 'Faire racheter tes crédits par une seule banque',
        outcome: { text: 'Une seule mensualité, plus basse, mais sur plus longtemps. Tu respires… pour l’instant.', fx: { consolidateDebts: { rate: 0.055, years: 7, label: 'Regroupement de crédits' }, happiness: 3, skills: { finance: 2 } } },
      },
      {
        id: 'nier',
        label: 'Continuer comme si de rien n’était',
        outcome: { text: 'Tu préfères ne pas regarder tes relevés. Les dettes, elles, grossissent.', fx: { happiness: -6, health: -3 } },
      },
    ],
  },
  {
    id: 'dif_cambriolage',
    category: 'difficulte',
    title: 'Le cambriolage',
    text: 'En rentrant de week-end, tu trouves ta porte forcée. Ordinateur, bijoux, télévision : tout a disparu.',
    when: (s) => s.housingId !== 'parents',
    cooldown: 15,
    choices: [
      {
        id: 'assurance',
        label: 'Déclarer le vol à l’assurance',
        outcome: { text: 'L’assurance rembourse une partie, après franchise et vétusté.', fx: { money: -900, happiness: -5 } },
      },
      {
        id: 'alarme',
        label: 'Installer une alarme et racheter le nécessaire',
        outcome: { text: 'Tu te sens en sécurité à nouveau, mais l’addition est salée.', fx: { money: -1800, happiness: -2 } },
      },
    ],
  },
  {
    id: 'dif_panne_ordi',
    category: 'difficulte',
    title: 'L’écran noir',
    text: 'Ton ordinateur portable refuse de démarrer. Tous tes fichiers sont dessus, et tu en as besoin pour travailler.',
    cooldown: 10,
    choices: [
      {
        id: 'reparer',
        label: 'Le faire réparer',
        outcome: roll(0.6,
          { text: 'Le réparateur sauve ton disque dur et change la carte mère : 350 €.', fx: { money: -350 } },
          { text: 'Irréparable. Il faut en racheter un, et tes fichiers sont perdus.', fx: { money: -1100, happiness: -4, performance: -3 } }),
      },
      {
        id: 'neuf',
        label: 'En racheter un neuf',
        outcome: { text: 'Nouvel ordinateur, et cette fois, une sauvegarde automatique.', fx: { money: -1000, skills: { tech: 1 } } },
      },
      {
        id: 'bricoler',
        label: 'Le réparer toi-même',
        requires: (s) => s.skills.tech >= 40,
        requiresText: 'Informatique 40+ requise.',
        outcome: { text: 'Un tournevis, un tutoriel, une pièce à 60 € : il repart !', fx: { money: -60, skills: { tech: 2 }, happiness: 3 } },
      },
    ],
  },
  {
    id: 'dif_recession',
    category: 'difficulte',
    title: 'La récession',
    text: 'L’économie entre en récession. Les entreprises gèlent les embauches, les marchés reculent, l’immobilier stagne. Il faut s’attendre à deux années difficiles.',
    minAge: 21,
    cooldown: 12,
    choices: [
      {
        id: 'prudence',
        label: 'Renforcer son épargne de précaution',
        outcome: (s) => ({ text: 'Tu réduis tes dépenses et mets de côté. Tu traverseras la tempête.', fx: { flags: { recessionUntil: s.age + 2 }, lifestyle: 'frugal', skills: { finance: 3 } } }),
      },
      {
        id: 'opportunite',
        label: 'Y voir une opportunité d’investir',
        requires: (s) => liquid(s) >= 2000,
        requiresText: 'Il faut au moins 2 000 € de liquidités.',
        outcome: (s) => ({ text: 'Tu investis régulièrement pendant que tout le monde a peur.', fx: { flags: { recessionUntil: s.age + 2 }, stocks: Math.min(s.cash, 2000), skills: { finance: 4 } } }),
      },
      {
        id: 'rien',
        label: 'Continuer comme avant',
        outcome: (s) => ({ text: 'Tu ne changes rien. Espérons que ça passe vite.', fx: { flags: { recessionUntil: s.age + 2 } } }),
      },
    ],
  },
  {
    id: 'dif_caution',
    category: 'difficulte',
    title: 'La caution qui tourne mal',
    text: 'Il y a quelques années, tu t’es porté{|e} caution pour le loyer d’un proche. Il ne paie plus, et le propriétaire se tourne vers toi.',
    minAge: 25,
    rare: true,
    choices: [
      {
        id: 'payer',
        label: 'Payer les arriérés',
        outcome: { text: 'Tu règles 3 200 € d’arriérés. Ta relation avec ce proche est durablement abîmée.', fx: { money: -3200, family: -6 } },
      },
      {
        id: 'negocier',
        label: 'Négocier un échéancier avec le propriétaire',
        outcome: { text: 'Le propriétaire accepte un paiement sur un an.', fx: { addDebt: { kind: 'famille', label: 'Arriérés de caution', amount: 3200, rate: 0, years: 1 }, money: -3200, family: -3 } },
      },
    ],
  },
];
