// Emploi et carrière.

import { JOB_BY_ID } from '../../engine/catalog';
import type { GameEvent } from '../../engine/eventTypes';
import { eur, hasJob, jobLevel, noJob, roll, salary } from './helpers';

export const CARRIERE_EVENTS: GameEvent[] = [
  {
    id: 'car_ancien_collegue',
    category: 'carriere',
    title: 'L’appel d’un ancien collègue',
    text: (s) => `À ${s.age} ans, un ancien collègue te propose de rejoindre une petite entreprise qui commence à grandir. Le salaire serait légèrement inférieur à ton poste actuel, mais tu pourrais obtenir bien plus de responsabilités.`,
    minAge: 22, maxAge: 45,
    when: (s) => hasJob(s) && s.job!.years >= 1,
    choices: [
      {
        id: 'rester',
        label: 'Rester dans ton emploi actuel',
        hint: 'Stabilité, progression plus lente.',
        outcome: { text: 'Tu déclines poliment. Ta place est confortable, ta progression régulière.', fx: { performance: 3 } },
      },
      {
        id: 'accepter',
        label: 'Accepter le défi',
        hint: 'Période d’incertitude, potentiel d’évolution.',
        outcome: { text: 'Tu rejoins l’aventure avec 8 % de salaire en moins. Tout est à construire, et c’est grisant.', fx: { salaryPct: -8, skills: { manage: 6 }, network: 6, happiness: 4, flags: { startupCollegue: true }, delayed: [{ years: 2, eventId: 'suite_collegue_startup' }] } },
      },
      {
        id: 'negocier',
        label: 'Négocier de meilleures conditions',
        hint: 'Le résultat dépend de ton relationnel et de ta réputation.',
        outcome: roll((s) => 0.25 + s.skills.social / 200 + s.relations.network / 300,
          { text: 'Ton ancien collègue cède : même salaire, plus des parts dans l’entreprise. Tu acceptes.', fx: { skills: { manage: 6 }, network: 6, flags: { startupCollegue: true, partsStartup: true }, delayed: [{ years: 2, eventId: 'suite_collegue_startup' }] } },
          { text: 'Ta contre-proposition refroidit ton interlocuteur. L’offre est retirée.', fx: { network: -3, happiness: -2 } }),
      },
    ],
  },
  {
    id: 'car_heures_sup',
    category: 'carriere',
    title: 'Les heures supplémentaires',
    text: 'Gros rush au travail : ta responsable demande des volontaires pour travailler plusieurs week-ends ce trimestre. Payé, mais épuisant.',
    cooldown: 6,
    when: (s) => hasJob(s) && JOB_BY_ID[s.job!.jobId].level <= 3,
    choices: [
      {
        id: 'oui',
        label: 'Se porter volontaire',
        hint: 'Argent et bonne image, mais fatigue.',
        outcome: (s) => ({ text: `Six week-ends de travail : ${eur(salary(s) * 0.35)} de plus sur tes fiches de paie, et une responsable reconnaissante.`, fx: { money: Math.round(salary(s) * 0.35), performance: 8, energy: -10, friends: -3 } }),
      },
      {
        id: 'partiel',
        label: 'Accepter deux week-ends seulement',
        outcome: (s) => ({ text: 'Un compromis apprécié. Un peu plus d’argent sans y laisser ta santé.', fx: { money: Math.round(salary(s) * 0.12), performance: 3, energy: -3 } }),
      },
      {
        id: 'non',
        label: 'Refuser poliment',
        outcome: { text: 'Tes week-ends sont sacrés. Ta responsable note ton refus sans commentaire.', fx: { performance: -3, happiness: 2 } },
      },
    ],
  },
  {
    id: 'car_chef_toxique',
    category: 'carriere',
    title: 'Le nouveau chef',
    text: 'Ton nouveau responsable humilie l’équipe en réunion, envoie des messages à minuit et s’attribue tes idées. L’ambiance se dégrade de semaine en semaine.',
    when: (s) => hasJob(s),
    choices: [
      {
        id: 'subir',
        label: 'Serrer les dents',
        hint: 'Garder son poste, au prix de sa santé.',
        outcome: { text: 'Tu encaisses en silence. Les dimanches soir deviennent angoissants.', fx: { health: -6, happiness: -8, energy: -6 } },
      },
      {
        id: 'rh',
        label: 'Alerter les ressources humaines avec des preuves',
        hint: 'Courageux, résultat incertain.',
        outcome: roll(0.55,
          { text: 'D’autres collègues témoignent. Le responsable est muté. L’équipe te remercie.', fx: { happiness: 6, network: 4, performance: 4, friends: 3, moral: 'good' } },
          { text: 'Les RH « prennent note ». Rien ne change, et ton responsable t’a désormais dans le collimateur.', fx: { happiness: -6, performance: -8 } }),
      },
      {
        id: 'partir',
        label: 'Négocier son départ',
        hint: 'Rupture conventionnelle et droits au chômage.',
        outcome: (s) => ({ text: `Ton départ est négocié : ${eur(salary(s) * 0.5)} d’indemnité et des droits au chômage. Tu respires à nouveau.`, fx: { money: Math.round(salary(s) * 0.5), loseJob: 'rupture', happiness: 5, health: 3 } }),
      },
    ],
  },
  {
    id: 'car_entretien_annuel',
    category: 'carriere',
    title: 'L’entretien annuel',
    text: 'C’est le moment de l’entretien annuel. Ta responsable te demande ce que tu attends pour l’année à venir.',
    cooldown: 5,
    when: (s) => hasJob(s) && s.job!.years >= 1,
    choices: [
      {
        id: 'augmentation',
        label: 'Demander une augmentation',
        hint: 'Selon ta performance.',
        outcome: roll((s) => 0.2 + s.job!.performance / 120,
          { text: 'Ta responsable reconnaît tes efforts : +5 % sur ton salaire.', fx: { salaryPct: 5, happiness: 4 } },
          { text: '« Pas cette année, les budgets sont serrés. » Tu ravales ta déception.', fx: { happiness: -3 } }),
      },
      {
        id: 'formation',
        label: 'Demander une formation',
        outcome: { text: 'Elle accepte de financer une formation courte dans ton domaine.', fx: { skills: { tech: 3, manage: 3 }, performance: 3 } },
      },
      {
        id: 'teletravail',
        label: 'Demander plus de flexibilité',
        outcome: roll(0.6,
          { text: 'Deux jours de télétravail par semaine : moins de transports, plus de temps pour toi.', fx: { energy: 6, happiness: 5, flags: { teletravail: true } } },
          { text: 'Refusé : « la présence sur site est essentielle ».', fx: { happiness: -2 } }),
      },
    ],
  },
  {
    id: 'car_chasseur_tetes',
    category: 'carriere',
    title: 'Le chasseur de têtes',
    text: 'Un cabinet de recrutement te contacte : un concurrent cherche exactement ton profil, avec 20 % de salaire en plus. Le poste est plus exigeant.',
    minAge: 24,
    when: (s) => hasJob(s) && s.job!.performance >= 60 && jobLevel(s) >= 2,
    choices: [
      {
        id: 'accepter',
        label: 'Accepter l’offre',
        hint: '+20 % de salaire, plus de pression, ancienneté remise à zéro.',
        outcome: (s) => ({ text: 'Tu signes chez le concurrent. Nouveau bureau, nouveaux défis, nouveau salaire.', fx: { setJob: { jobId: s.job!.jobId, salaryPct: 20 }, energy: -5, network: 6, highlight: { kind: 'key', text: 'Débauché{|e} par un concurrent avec 20 % d’augmentation' } } }),
      },
      {
        id: 'contre',
        label: 'S’en servir pour négocier en interne',
        hint: 'Risqué : ton employeur peut mal le prendre.',
        outcome: roll(0.6,
          { text: 'Ton employeur s’aligne en partie pour te garder : +10 %.', fx: { salaryPct: 10, happiness: 3 } },
          { text: 'Ton employeur n’apprécie pas le chantage. Ambiance glaciale.', fx: { performance: -10, happiness: -4 } }),
      },
      {
        id: 'refuser',
        label: 'Refuser, tu es bien là où tu es',
        outcome: { text: 'Tu restes fidèle à ton équipe. Le chasseur de têtes garde ton CV au chaud.', fx: { network: 2, happiness: 1 } },
      },
    ],
  },
  {
    id: 'car_restructuration',
    category: 'carriere',
    title: 'Le plan de départs volontaires',
    text: 'Ton entreprise annonce une restructuration. Un plan de départs volontaires est proposé, avec une indemnité généreuse. Ceux qui restent ne sont pas à l’abri.',
    minAge: 25,
    cooldown: 12,
    when: (s) => hasJob(s) && s.job!.jobId !== 'fonctionnaire' && s.job!.jobId !== 'attache',
    choices: [
      {
        id: 'partir',
        label: 'Partir avec le chèque',
        hint: 'Une indemnité importante et le chômage.',
        outcome: (s) => ({ text: `Tu signes : ${eur(salary(s) * (2 + s.job!.years * 0.4))} d’indemnité et des droits au chômage. À toi de rebondir.`, fx: { money: Math.round(salary(s) * (2 + s.job!.years * 0.4)), loseJob: 'licenciement', highlight: { kind: 'key', text: 'Départ volontaire lors d’une restructuration' } } }),
      },
      {
        id: 'rester',
        label: 'Rester et espérer',
        outcome: roll(0.7,
          { text: 'Tu passes entre les gouttes. Avec moins de collègues, ta charge de travail augmente.', fx: { energy: -6, performance: 5 } },
          { text: 'Deuxième vague : ton poste est supprimé, avec une indemnité moindre.', fx: { loseJob: 'licenciement', happiness: -8 } }),
      },
      {
        id: 'mutation',
        label: 'Demander une mutation dans une autre région',
        hint: 'Garder son emploi, quitter ses proches.',
        outcome: { text: 'Mutation acceptée. Tu changes de ville et tu repars de zéro socialement.', fx: { friends: -12, family: -4, network: 3, money: -1200, happiness: -2 } },
      },
    ],
  },
  {
    id: 'car_erreur_pro',
    category: 'carriere',
    title: 'L’erreur coûteuse',
    text: 'Tu as commis une erreur qui a coûté cher à ton entreprise. Personne ne sait encore que ça vient de toi.',
    when: (s) => hasJob(s),
    choices: [
      {
        id: 'avouer',
        label: 'Avouer immédiatement',
        hint: 'L’honnêteté a un prix… et une valeur.',
        outcome: { text: 'Ta responsable apprécie ta franchise. Vous corrigez le tir ensemble. On te fera davantage confiance.', fx: { performance: -3, happiness: 2, skills: { manage: 2 }, moral: 'good' } },
      },
      {
        id: 'cacher',
        label: 'Ne rien dire',
        hint: 'Et si ça se savait ?',
        outcome: roll(0.6,
          { text: 'Personne ne remonte jusqu’à toi. Mais tu y repenses souvent.', fx: { happiness: -4, moral: 'bad' } },
          { text: 'L’enquête interne révèle la vérité. Avertissement écrit et confiance brisée.', fx: { performance: -18, happiness: -8, flags: { casierPro: true }, moral: 'bad', highlight: { kind: 'mistake', text: 'Avoir caché une erreur professionnelle' } } }),
      },
      {
        id: 'collegue',
        label: 'Laisser accuser un collègue',
        hint: 'Moralement discutable.',
        outcome: roll(0.5,
          { text: 'Ton collègue écope d’un blâme. Tu gardes ta place, mais l’équipe te regarde différemment.', fx: { friends: -6, network: -4, happiness: -6, moral: 'bad' } },
          { text: 'Ton collègue prouve son innocence. Ta crédibilité s’effondre.', fx: { performance: -25, network: -10, flags: { casierPro: true }, moral: 'bad', highlight: { kind: 'mistake', text: 'Avoir fait accuser un collègue' } } }),
      },
    ],
  },
  {
    id: 'car_collegue_burnout',
    category: 'carriere',
    title: 'La collègue à bout',
    text: 'Ta collègue Sophie s’effondre en larmes dans la salle de pause. Elle est au bord du burn-out et te supplie de reprendre une partie de ses dossiers.',
    when: (s) => hasJob(s),
    choices: [
      {
        id: 'aider',
        label: 'Reprendre ses dossiers',
        hint: 'Solidarité, charge de travail en plus.',
        outcome: { text: 'Tu tiens les deux postes pendant trois mois. Sophie revient, reconnaissante pour toujours.', fx: { energy: -10, performance: 6, friends: 4, network: 4, moral: 'good' } },
      },
      {
        id: 'manager',
        label: 'L’accompagner voir la direction',
        outcome: { text: 'Vous alertez la direction ensemble. Un intérimaire est recruté.', fx: { skills: { social: 3, manage: 2 }, network: 2, moral: 'good' } },
      },
      {
        id: 'refuser',
        label: 'Refuser, tu as déjà trop à faire',
        outcome: { text: 'Tu te protèges. Sophie part en arrêt maladie, et l’équipe en souffre.', fx: { friends: -3, happiness: -2 } },
      },
    ],
  },
  {
    id: 'car_greve',
    category: 'carriere',
    title: 'La grève',
    text: 'Les salariés de ton entreprise votent la grève pour des hausses de salaire. Chaque jour de grève est un jour non payé.',
    cooldown: 10,
    when: (s) => hasJob(s) && jobLevel(s) <= 3,
    choices: [
      {
        id: 'greve',
        label: 'Faire grève avec les collègues',
        outcome: roll(0.55,
          { text: 'Après huit jours, la direction cède : +4 % pour tous. Tu perds huit jours de salaire, mais tu y gagnes à long terme.', fx: { money: -400, salaryPct: 4, friends: 5 } },
          { text: 'Après dix jours, le mouvement s’essouffle sans rien obtenir.', fx: { money: -500, happiness: -3, friends: 4 } }),
      },
      {
        id: 'travailler',
        label: 'Continuer à travailler',
        outcome: { text: 'Tu franchis le piquet de grève. Certains collègues ne te le pardonneront pas.', fx: { friends: -6, performance: 4 } },
      },
      {
        id: 'mediation',
        label: 'Proposer une médiation',
        hint: 'Relationnel requis.',
        requires: (s) => s.skills.social >= 40,
        requiresText: 'Relationnel 40+ requis.',
        outcome: { text: 'Ta proposition débloque la situation : prime exceptionnelle pour tous et dialogue renoué.', fx: { network: 8, skills: { manage: 4 }, performance: 6, money: 500 } },
      },
    ],
  },
  {
    id: 'car_projet_visible',
    category: 'carriere',
    title: 'Le projet à haut risque',
    text: 'La direction cherche quelqu’un pour piloter un projet stratégique. S’il réussit, c’est la promotion assurée. S’il échoue, on se souviendra de ton nom.',
    minAge: 23,
    when: (s) => hasJob(s) && jobLevel(s) >= 2,
    choices: [
      {
        id: 'oui',
        label: 'Lever la main',
        hint: 'Gros risque, grosse visibilité.',
        outcome: roll((s) => 0.3 + (s.skills.manage + s.energy) / 250,
          { text: 'Projet livré dans les temps ! La direction te félicite publiquement.', fx: { performance: 20, network: 8, salaryPct: 6, energy: -8, highlight: { kind: 'success', text: 'Réussite d’un projet stratégique' } } },
          { text: 'Le projet dérape. Tu n’es pas seul{|e} en cause, mais c’est toi qu’on retient.', fx: { performance: -12, energy: -10, happiness: -6 } }),
      },
      {
        id: 'binome',
        label: 'Proposer de le piloter en binôme',
        outcome: { text: 'Un pilotage partagé : moins de gloire, moins de risque. Le projet se passe correctement.', fx: { performance: 8, skills: { manage: 4 } } },
      },
      {
        id: 'non',
        label: 'Laisser passer',
        outcome: { text: 'Un collègue s’en charge. Tu regardes de loin.' },
      },
    ],
  },
  {
    id: 'car_crise_sens',
    category: 'carriere',
    title: 'À quoi bon ?',
    text: 'Un lundi matin, coincé{|e} dans les transports, une question t’obsède : « Est-ce que je vais faire ça toute ma vie ? »',
    minAge: 30, maxAge: 55,
    when: (s) => hasJob(s) && s.job!.years >= 3,
    choices: [
      {
        id: 'bilan',
        label: 'Faire un bilan de compétences',
        hint: 'Financé par ton compte formation.',
        outcome: { text: 'Trois mois d’introspection guidée. Tu identifies tes forces et des métiers qui te correspondraient mieux.', fx: { happiness: 5, skills: { social: 2, manage: 2 }, flags: { bilanCompetences: true } } },
      },
      {
        id: 'passion',
        label: 'Réveiller une passion le soir',
        outcome: { text: 'Atelier de poterie, chorale, écriture : tu retrouves une part de toi.', fx: { happiness: 8, skills: { creative: 6 }, money: -400 } },
      },
      {
        id: 'ignorer',
        label: 'Ravaler ses doutes',
        outcome: { text: 'Tu enfouis la question. Elle reviendra.', fx: { happiness: -5 } },
      },
    ],
  },
  {
    id: 'car_chomage_long',
    category: 'carriere',
    title: 'Les mois qui passent',
    text: 'Les candidatures restent sans réponse. Ton conseiller te propose un poste éloigné de ton domaine, au salaire minimum.',
    when: (s) => noJob(s) && !s.training,
    cooldown: 3,
    choices: [
      {
        id: 'accepter',
        label: 'Accepter le poste proposé',
        hint: 'Retrouver un salaire, même modeste.',
        outcome: (s) => ({ text: 'Tu reprends le travail dans un entrepôt. Ce n’est pas ton rêve, mais tu remets le pied à l’étrier.', fx: { setJob: { jobId: s.diplomas.includes('caces') ? 'cariste' : 'preparateur' }, happiness: 3 } }),
      },
      {
        id: 'chercher',
        label: 'Continuer à chercher dans ton domaine',
        outcome: { text: 'Tu refuses et redoubles d’efforts : réseau, candidatures spontanées, salons.', fx: { network: 6, happiness: -3, skills: { social: 2 } } },
      },
      {
        id: 'auto',
        label: 'Tenter l’auto-entreprise',
        hint: 'Créer son propre emploi.',
        requires: (s) => Math.max(s.skills.tech, s.skills.craft, s.skills.creative, s.skills.finance) >= 45,
        requiresText: 'Il faut une compétence solide (45+) à vendre.',
        outcome: (s) => {
          const best = (['tech', 'craft', 'creative', 'finance'] as const).reduce((a, b) => (s.skills[a] >= s.skills[b] ? a : b));
          const sectorMap = { tech: 'conseil', craft: 'artisan', creative: 'agence', finance: 'conseil' } as const;
          return { text: 'Tu crées ta micro-entreprise. Tes premiers clients arrivent par le bouche-à-oreille.', fx: { startBusiness: { sector: sectorMap[best], capital: Math.min(s.cash, 2000) }, happiness: 5 } };
        },
      },
    ],
  },
  {
    id: 'car_premier_salaire',
    category: 'carriere',
    title: 'Le premier gros salaire',
    text: 'Pour la première fois, ton salaire dépasse nettement ce dont tu as besoin. Tes collègues parlent voitures, montres et voyages.',
    when: (s) => hasJob(s) && s.job!.salary >= 2600 && !s.flags.premierGrosSalaire,
    choices: [
      {
        id: 'craquer',
        label: 'S’offrir enfin un grand train de vie',
        hint: 'Le plaisir maintenant.',
        outcome: { text: 'Restaurants, sorties, beaux vêtements : tu changes de vie… et de budget.', fx: { lifestyle: 'confort', happiness: 6, flags: { premierGrosSalaire: true } } },
      },
      {
        id: 'epargner',
        label: 'Garder le même train de vie et épargner',
        hint: 'L’effet boule de neige.',
        outcome: { text: 'Tu continues à vivre comme avant. La différence part directement en épargne. Dans dix ans, tu te remercieras.', fx: { skills: { finance: 5 }, flags: { premierGrosSalaire: true, discipline: true } } },
      },
      {
        id: 'famille',
        label: 'Aider ta famille',
        outcome: { text: 'Tu offres à tes parents le voyage dont ils rêvaient. Ta mère pleure de joie.', fx: { money: -2500, family: 12, happiness: 6, flags: { premierGrosSalaire: true } } },
      },
    ],
  },
  {
    id: 'car_interim',
    category: 'carriere',
    title: 'La mission d’intérim',
    text: 'Une agence d’intérim te propose une mission de six mois en logistique. C’est bien payé grâce aux primes, mais physique.',
    when: (s) => noJob(s) && !s.training,
    choices: [
      {
        id: 'accepter',
        label: 'Accepter la mission',
        outcome: { text: 'Six mois d’entrepôt. Tu gagnes ta vie, et l’entreprise te propose un CDI à la fin.', fx: { setJob: { jobId: 'preparateur', salaryPct: 8 }, money: 600 } },
      },
      {
        id: 'refuser',
        label: 'Refuser et viser mieux',
        outcome: { text: 'Tu préfères attendre une offre dans ton domaine.', fx: { happiness: -1 } },
      },
    ],
  },
  {
    id: 'car_offre_etranger',
    category: 'carriere',
    title: 'L’offre en Suisse',
    text: 'Une entreprise de Genève te propose un poste équivalent au tien… payé presque le double. Mais la vie y est très chère et tes proches loin.',
    rare: true,
    minAge: 24, maxAge: 50,
    when: (s) => hasJob(s) && jobLevel(s) >= 2 && !s.flags.suisse,
    choices: [
      {
        id: 'partir',
        label: 'Partir en Suisse',
        hint: 'Salaire bien plus élevé, coût de la vie aussi.',
        outcome: { text: 'Tu t’installes près de Genève. Ta fiche de paie te donne le vertige, ton loyer aussi.', fx: { salaryPct: 75, housingId: 't2', family: -10, friends: -12, happiness: 2, flags: { suisse: true }, highlight: { kind: 'key', text: 'Expatriation en Suisse' } } },
      },
      {
        id: 'frontalier',
        label: 'Devenir frontalier',
        hint: 'Garder un logement en France, beaucoup de trajets.',
        outcome: { text: 'Tu fais les allers-retours tous les jours. Salaire suisse, loyer français, mais deux heures de route quotidiennes.', fx: { salaryPct: 55, energy: -12, flags: { suisse: true, voiture: true } } },
      },
      {
        id: 'refuser',
        label: 'Rester en France',
        outcome: { text: 'L’argent ne fait pas tout. Tu restes près des tiens.', fx: { family: 3 } },
      },
    ],
  },
  {
    id: 'car_stagiaire',
    category: 'carriere',
    title: 'Le stagiaire brillant',
    text: 'On te confie un stagiaire très doué. Il pourrait te faire briller… ou te faire de l’ombre.',
    minAge: 26,
    when: (s) => hasJob(s) && jobLevel(s) >= 2,
    choices: [
      {
        id: 'former',
        label: 'Le former généreusement',
        outcome: { text: 'Tu partages tout ce que tu sais. Il te le rendra : dix ans plus tard, il dirige une entreprise et pense à toi.', fx: { skills: { manage: 5, social: 3 }, network: 4, delayed: [{ years: 8, title: 'Un ancien stagiaire se souvient de toi', text: 'Ton ancien stagiaire, devenu dirigeant, te recommande pour une mission de conseil bien rémunérée.', fx: { money: 4000, network: 8 } }] } },
      },
      {
        id: 'minimum',
        label: 'Le cantonner aux photocopies',
        outcome: { text: 'Tu protèges ton territoire. Le stage se passe sans éclat.', fx: { network: -2 } },
      },
    ],
  },
  {
    id: 'car_promotion_ailleurs',
    category: 'carriere',
    title: 'Le poste de manager',
    text: 'Un poste de manager se libère dans ton service. Tu as l’expérience, mais tu sais aussi que manager, c’est un autre métier.',
    minAge: 26,
    when: (s) => hasJob(s) && s.job!.years >= 3 && !!JOB_BY_ID[s.job!.jobId].next,
    choices: [
      {
        id: 'postuler',
        label: 'Postuler en interne',
        outcome: roll((s) => 0.25 + s.job!.performance / 200 + s.skills.manage / 300,
          { text: 'Tu obtiens le poste ! Une prime de prise de fonction et beaucoup de nouvelles responsabilités.', fx: { salaryPct: 12, skills: { manage: 6 }, energy: -6, performance: 5, highlight: { kind: 'success', text: 'Nommé{|e} manager en interne' } } },
          { text: 'Le poste revient à quelqu’un de l’extérieur. Tu devras faire tes preuves autrement.', fx: { happiness: -4 } }),
      },
      {
        id: 'expert',
        label: 'Rester expert{|e} dans ton domaine',
        outcome: { text: 'Tu préfères approfondir ton métier plutôt que gérer des plannings.', fx: { skills: { tech: 3, craft: 3 }, happiness: 2 } },
      },
    ],
  },
];
