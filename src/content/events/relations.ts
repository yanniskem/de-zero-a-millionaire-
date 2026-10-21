// Famille et relations.

import type { GameEvent } from '../../engine/eventTypes';
import { coupled, eur, kids, liquid, roll, single } from './helpers';

export const RELATIONS_EVENTS: GameEvent[] = [
  {
    id: 'rel_rencontre_soiree',
    category: 'relations',
    title: 'La rencontre',
    text: 'À l’anniversaire d’une amie, tu discutes pendant des heures avec quelqu’un de drôle et brillant. À la fin de la soirée, vous échangez vos numéros.',
    maxAge: 55,
    cooldown: 4,
    when: single,
    choices: [
      {
        id: 'inviter',
        label: 'Proposer un verre la semaine suivante',
        outcome: roll((s) => 0.45 + s.skills.social / 250 + s.happiness / 400,
          { text: 'Un verre, puis un dîner, puis un week-end : une belle histoire commence.', fx: { startPartner: true, happiness: 8 } },
          { text: 'Le courant ne passe pas autant que tu l’espérais. Vous restez bons amis.', fx: { friends: 3 } }),
      },
      {
        id: 'attendre',
        label: 'Attendre qu’on t’écrive',
        outcome: roll(0.3,
          { text: 'Le message arrive trois jours plus tard. Votre histoire démarre.', fx: { startPartner: true, happiness: 6 } },
          { text: 'Aucun message. Tu te demandes longtemps ce qui se serait passé.', fx: { happiness: -2 } }),
      },
      {
        id: 'carriere',
        label: 'Rester concentré{|e} sur ta carrière',
        outcome: { text: 'Tu n’as pas la tête à ça pour le moment.', fx: { performance: 3 } },
      },
    ],
  },
  {
    id: 'rel_appli',
    category: 'relations',
    title: 'Les applications de rencontre',
    text: 'Tes amis t’ont installé une application de rencontre « pour rire ». Des dizaines de profils défilent.',
    minAge: 20, maxAge: 60,
    cooldown: 5,
    when: single,
    choices: [
      {
        id: 'jouer',
        label: 'Jouer le jeu sérieusement',
        outcome: roll((s) => 0.35 + s.skills.social / 300,
          { text: 'Après quelques rendez-vous ratés, une vraie rencontre. Cette fois, c’est différent.', fx: { startPartner: true, happiness: 6, money: -150 } },
          { text: 'Rendez-vous décevants, conversations sans suite. Tu désinstalles l’application.', fx: { happiness: -3, money: -150 } }),
      },
      {
        id: 'supprimer',
        label: 'Supprimer l’application',
        outcome: { text: 'Pas ton truc. Tu préfères les rencontres dans la vraie vie.', fx: {} },
      },
    ],
  },
  {
    id: 'rel_emmenager',
    category: 'relations',
    title: 'Vivre ensemble ?',
    text: '{partner} te propose d’emménager ensemble. Ce serait une étape importante… et des économies de loyer.',
    when: (s) => coupled(s) && !s.relations.partner!.cohabiting && s.relations.partner!.strength >= 50,
    choices: [
      {
        id: 'oui',
        label: 'Dire oui et chercher un appartement à deux',
        outcome: { text: 'Vous trouvez un deux-pièces lumineux. Premiers meubles, premières disputes sur la déco, premier vrai chez-vous.', fx: { housingId: 't2', cohabit: true, partner: 8, money: -1000, happiness: 6, highlight: { kind: 'key', text: 'Emménager avec {partner}' } } },
      },
      {
        id: 'attendre',
        label: 'Prendre encore un peu de temps',
        outcome: { text: '{partner} comprend, mais semble un peu déçu{|e}.', fx: { partner: -6 } },
      },
    ],
  },
  {
    id: 'rel_demande',
    category: 'relations',
    title: 'Le grand jour ?',
    text: 'Cela fait plusieurs années que tu partages ta vie avec {partner}. Un dimanche matin, au café, la question flotte dans l’air : et si vous officialisiez ?',
    when: (s) => coupled(s) && s.relations.partner!.cohabiting && !s.relations.partner!.married && s.relations.partner!.years >= 2 && s.relations.partner!.strength >= 55,
    choices: [
      {
        id: 'mariage',
        label: 'Organiser un vrai mariage',
        hint: 'Environ 9 000 €.',
        outcome: { text: 'Une fête magnifique entourée de tous vos proches. Un des plus beaux jours de ta vie.', fx: { money: -9000, marry: true, partner: 10, family: 8, friends: 6, happiness: 10, highlight: { kind: 'key', text: 'Mariage avec {partner}' } } },
      },
      {
        id: 'pacs',
        label: 'Se pacser simplement',
        outcome: { text: 'Une signature à la mairie, un restaurant à deux. Simple et sincère.', fx: { money: -300, marry: true, partner: 6, happiness: 6 } },
      },
      {
        id: 'non',
        label: 'Rester comme vous êtes',
        outcome: { text: 'Pas besoin de papier pour s’aimer. {partner} est d’accord… presque.', fx: { partner: -3 } },
      },
    ],
  },
  {
    id: 'rel_projet_enfant',
    category: 'relations',
    title: 'Un enfant ?',
    text: '{partner} te confie avoir envie d’un enfant. C’est un bouleversement : du bonheur, des nuits courtes, et un budget qui change.',
    minAge: 24, maxAge: 44,
    cooldown: 4,
    when: (s) => coupled(s) && s.relations.partner!.strength >= 55 && kids(s) < 3,
    choices: [
      {
        id: 'oui',
        label: 'Se lancer',
        outcome: roll(0.75,
          { text: 'Neuf mois plus tard, un bébé pousse son premier cri. Ta vie ne sera plus jamais la même.', fx: { child: true, happiness: 10, partner: 6, family: 8, energy: -10, highlight: { kind: 'key', text: 'Naissance d’un enfant' } } },
          { text: 'Vous essayez, sans succès pour l’instant. Il faudra être patients.', fx: { partner: 2, happiness: -2 } }),
      },
      {
        id: 'plus_tard',
        label: 'Attendre une meilleure situation',
        outcome: { text: 'Vous décidez d’attendre d’être plus stables. {partner} accepte, mais le sujet reviendra.', fx: { partner: -4 } },
      },
      {
        id: 'non',
        label: 'Tu ne veux pas d’enfant',
        outcome: { text: 'Une conversation difficile. Vous n’êtes pas sûrs de vouloir la même vie.', fx: { partner: -12, happiness: -3 } },
      },
    ],
  },
  {
    id: 'rel_dispute_argent',
    category: 'relations',
    title: 'La dispute sur l’argent',
    text: '{partner} trouve que tu dépenses trop. Toi, tu trouves que {partner} est obsédé{|e} par l’épargne. Le ton monte.',
    when: (s) => coupled(s) && s.relations.partner!.cohabiting,
    cooldown: 6,
    choices: [
      {
        id: 'budget',
        label: 'Mettre en place un budget commun',
        outcome: { text: 'Un compte joint pour les dépenses communes, chacun sa liberté pour le reste. Ça apaise tout.', fx: { partner: 6, skills: { finance: 3 } } },
      },
      {
        id: 'ceder',
        label: 'Céder pour avoir la paix',
        outcome: { text: 'Tu acceptes de réduire tes dépenses. Le calme revient, mais tu te sens un peu bridé{|e}.', fx: { lifestyle: 'frugal', partner: 3, happiness: -3 } },
      },
      {
        id: 'tenir',
        label: 'Tenir tête',
        outcome: { text: 'Chacun campe sur ses positions. Le sujet devient tabou.', fx: { partner: -10, happiness: -4 } },
      },
    ],
  },
  {
    id: 'rel_parent_malade',
    category: 'relations',
    title: 'Un parent malade',
    text: 'Ton père a été hospitalisé. Il va s’en sortir, mais il aura besoin d’aide pendant plusieurs mois.',
    minAge: 30,
    choices: [
      {
        id: 'present',
        label: 'Être présent{|e}, quitte à réduire ton activité',
        outcome: { text: 'Tu passes tes week-ends et tes congés près de lui. Ces moments vous rapprochent comme jamais.', fx: { family: 14, energy: -10, performance: -6, happiness: 2 } },
      },
      {
        id: 'payer',
        label: 'Financer une aide à domicile',
        outcome: { text: 'Une aide professionnelle vient chaque jour. Tu appelles souvent, tu passes quand tu peux.', fx: { money: -3500, family: 6 } },
      },
      {
        id: 'distance',
        label: 'Laisser tes frères et sœurs gérer',
        outcome: { text: 'Tu es trop pris{|e}. Ta fratrie s’en souviendra.', fx: { family: -12, happiness: -3 } },
      },
    ],
  },
  {
    id: 'rel_ami_pret',
    category: 'relations',
    title: 'L’ami dans le besoin',
    text: 'Ton ami d’enfance Thomas a des dettes et te demande de lui prêter 2 000 €. Il jure de te rembourser d’ici un an.',
    cooldown: 10,
    when: (s) => s.relations.friends >= 30,
    choices: [
      {
        id: 'preter',
        label: 'Lui prêter 2 000 €',
        cost: 2000,
        outcome: roll(0.55,
          { text: 'Thomas est soulagé. Il te serre dans ses bras.', fx: { friends: 6, delayed: [{ years: 1, title: 'Thomas tient parole', text: 'Thomas te rembourse jusqu’au dernier centime, avec une bouteille en prime.', fx: { money: 2000, friends: 6 } }] } },
          { text: 'Thomas est soulagé. Il te serre dans ses bras.', fx: { friends: 6, delayed: [{ years: 2, title: 'Thomas a disparu', text: 'Thomas ne répond plus à tes messages. Tu ne reverras ni ton argent, ni ton ami.', fx: { friends: -10, happiness: -4, highlight: { kind: 'mistake', text: 'Un prêt à un ami jamais remboursé' } } }] } }),
      },
      {
        id: 'donner',
        label: 'Lui donner 300 € sans rien attendre',
        outcome: { text: 'Tu ne prêtes pas, tu donnes. Thomas est touché.', fx: { money: -300, friends: 4, moral: 'good' } },
      },
      {
        id: 'refuser',
        label: 'Refuser',
        outcome: { text: 'Tu lui expliques que tu ne prêtes pas d’argent aux amis. Il se vexe.', fx: { friends: -6 } },
      },
    ],
  },
  {
    id: 'rel_reunion_lycee',
    category: 'relations',
    title: 'Dix ans après le lycée',
    text: 'Un groupe d’anciens élèves organise des retrouvailles. Tu te demandes ce que sont devenus tes anciens camarades.',
    minAge: 27, maxAge: 32,
    choices: [
      {
        id: 'aller',
        label: 'Y aller',
        outcome: (s) => ({ text: s.job || s.business ? 'Tu racontes fièrement ton parcours. Une ancienne camarade, devenue recruteuse, te donne sa carte.' : 'Tu croises des visages oubliés. Une ancienne camarade te parle d’un poste dans sa boîte.', fx: { network: 8, friends: 5, happiness: 3 } }),
      },
      {
        id: 'non',
        label: 'Ne pas y aller',
        outcome: { text: 'Le passé, c’est le passé. Tu regardes les photos sur les réseaux le lendemain.', fx: {} },
      },
    ],
  },
  {
    id: 'rel_conflit_fratrie',
    category: 'relations',
    title: 'La maison de famille',
    text: 'Tes parents veulent vendre la maison de famille. Ton frère s’y oppose, ta sœur veut sa part tout de suite. On te demande de trancher.',
    minAge: 32,
    rare: true,
    choices: [
      {
        id: 'vendre',
        label: 'Soutenir la vente',
        outcome: { text: 'La maison est vendue. Tes parents te donnent une part de la somme en avance d’héritage.', fx: { money: 18000, family: -6, flags: { donFamilial: true } } },
      },
      {
        id: 'garder',
        label: 'Proposer de garder la maison en commun',
        outcome: { text: 'Vous gardez la maison pour les vacances en famille. Les frais sont partagés.', fx: { money: -1500, family: 8, happiness: 3 } },
      },
      {
        id: 'neutre',
        label: 'Rester neutre',
        outcome: { text: 'Tu refuses de prendre parti. Chacun t’en veut un peu.', fx: { family: -4 } },
      },
    ],
  },
  {
    id: 'rel_ami_expatrie',
    category: 'relations',
    title: 'Le départ du meilleur ami',
    text: 'Ton meilleur ami part s’installer au Canada pour de bon. Il organise une dernière soirée.',
    cooldown: 15,
    choices: [
      {
        id: 'promesse',
        label: 'Promettre de venir le voir',
        outcome: { text: 'Tu tiens ta promesse : un voyage à Montréal l’année suivante. L’amitié traverse l’océan.', fx: { money: -1400, friends: 6, happiness: 5 } },
      },
      {
        id: 'appels',
        label: 'Garder le contact par visio',
        outcome: { text: 'Des appels réguliers au début, puis de plus en plus espacés.', fx: { friends: -4 } },
      },
    ],
  },
  {
    id: 'rel_etudes_enfant',
    category: 'relations',
    title: 'Les études de ton enfant',
    text: 'Ton aîné veut intégrer une école de commerce privée. Coût : 12 000 € par an pendant trois ans.',
    when: (s) => s.relations.childrenBirthAges.some((b) => s.age - b >= 17 && s.age - b <= 19) && !s.flags.etudesEnfant,
    choices: [
      {
        id: 'payer',
        label: 'Payer l’école',
        hint: '36 000 € sur trois ans.',
        outcome: { text: 'Tu financeras l’école. Ton enfant est fou de joie.', fx: { money: -12000, family: 10, flags: { etudesEnfant: true }, delayed: [{ years: 1, title: 'Frais de scolarité', text: 'Deuxième année d’école de commerce : 12 000 €.', fx: { money: -12000 } }, { years: 2, title: 'Frais de scolarité', text: 'Dernière année d’école de commerce : 12 000 €.', fx: { money: -12000, family: 4 } }] } },
      },
      {
        id: 'pret',
        label: 'L’encourager à prendre un prêt étudiant',
        outcome: { text: 'Ton enfant emprunte lui-même. Tu l’aides un peu chaque mois.', fx: { money: -3000, family: 2, flags: { etudesEnfant: true } } },
      },
      {
        id: 'universite',
        label: 'Proposer l’université publique',
        outcome: { text: 'Ton enfant boude, puis s’inscrit à l’université. Il y réussit très bien.', fx: { family: -4, flags: { etudesEnfant: true } } },
      },
    ],
  },
  {
    id: 'rel_crise_couple',
    category: 'relations',
    title: 'La crise de couple',
    text: 'Avec {partner}, vous ne vous parlez presque plus. Chacun vit sa vie, et les reproches s’accumulent.',
    when: (s) => coupled(s) && s.relations.partner!.strength < 40,
    choices: [
      {
        id: 'therapie',
        label: 'Proposer une thérapie de couple',
        outcome: roll(0.6,
          { text: 'Les séances sont difficiles, mais vous réapprenez à vous écouter.', fx: { money: -1200, partner: 22, happiness: 4 } },
          { text: 'Malgré les séances, le fossé reste trop grand.', fx: { money: -1200, partner: -5 } }),
      },
      {
        id: 'temps',
        label: 'Lever le pied au travail pour se retrouver',
        outcome: { text: 'Tu réduis ta charge de travail et organises un voyage à deux. L’étincelle revient doucement.', fx: { partner: 15, performance: -6, money: -900 } },
      },
      {
        id: 'separer',
        label: 'Se séparer',
        outcome: { text: 'Vous vous séparez, avec tristesse mais sans haine.', fx: { breakup: true, happiness: -10, money: -1500 } },
      },
    ],
  },
  {
    id: 'rel_aide_parents',
    category: 'relations',
    title: 'Le coup de pouce des parents',
    text: 'Tes parents veulent t’aider à démarrer dans la vie. Ils proposent un don de 15 000 €, ou de se porter caution pour un achat immobilier.',
    minAge: 23, maxAge: 35,
    rare: true,
    when: (s) => s.relations.family >= 60 && ['heritier', 'cocon', 'etudiant', 'reveur', 'codeur'].includes(s.profileId),
    choices: [
      {
        id: 'accepter',
        label: 'Accepter le don',
        outcome: { text: 'Tu acceptes avec émotion. Tu leur promets d’en faire bon usage.', fx: { money: 15000, family: 6, flags: { donFamilial: true } } },
      },
      {
        id: 'refuser',
        label: 'Refuser : tu veux réussir seul{|e}',
        outcome: { text: 'Tes parents sont un peu vexés mais fiers. Tu veux tout construire par toi-même.', fx: { family: -2, happiness: 3, flags: { fierte: true } } },
      },
    ],
  },
  {
    id: 'rel_oubli_anniversaire',
    category: 'relations',
    title: 'L’anniversaire oublié',
    text: 'Pris{|e} par le travail, tu as complètement oublié l’anniversaire de {partner}. Le dîner était réservé depuis un mois.',
    when: (s) => coupled(s) && (s.priority === 'carriere' || s.energy < 35),
    choices: [
      {
        id: 'rattraper',
        label: 'Tout faire pour te rattraper',
        outcome: { text: 'Week-end surprise dans un hôtel de charme. {partner} te pardonne.', fx: { money: -700, partner: 4 } },
      },
      {
        id: 'excuses',
        label: 'S’excuser sincèrement',
        outcome: { text: 'Tes excuses sont acceptées… mais pas oubliées.', fx: { partner: -6 } },
      },
    ],
  },
  {
    id: 'rel_grands_parents',
    category: 'relations',
    title: 'Les histoires de grand-mère',
    text: 'Ta grand-mère, 92 ans, te demande si tu peux venir la voir plus souvent. Elle a encore tant d’histoires à te raconter.',
    maxAge: 45,
    choices: [
      {
        id: 'visites',
        label: 'Venir chaque mois',
        outcome: { text: 'Chaque visite est un trésor. Elle te transmet des recettes, des secrets de famille et sa sagesse.', fx: { family: 10, happiness: 4, energy: -2, skills: { care: 3 } } },
      },
      {
        id: 'appels',
        label: 'L’appeler chaque semaine',
        outcome: { text: 'Des appels réguliers qui comptent beaucoup pour elle.', fx: { family: 4 } },
      },
    ],
  },
  {
    id: 'rel_enfants_partent',
    category: 'relations',
    title: 'Le nid vide',
    text: 'Le dernier de tes enfants quitte la maison pour ses études. Le silence dans la maison est assourdissant.',
    when: (s) => kids(s) > 0 && s.relations.childrenBirthAges.every((b) => s.age - b >= 19) && !s.flags.nidVide,
    choices: [
      {
        id: 'couple',
        label: 'Redécouvrir la vie à deux',
        requires: coupled,
        requiresText: 'Il faut être en couple.',
        outcome: { text: 'Voyages, restaurants, projets : vous vous retrouvez comme au premier jour.', fx: { partner: 12, happiness: 6, money: -1500, flags: { nidVide: true } } },
      },
      {
        id: 'projet',
        label: 'Se lancer dans un nouveau projet',
        outcome: { text: 'Tu te découvres une nouvelle passion qui remplit tes journées.', fx: { happiness: 5, skills: { creative: 4, social: 2 }, flags: { nidVide: true } } },
      },
      {
        id: 'aider',
        label: 'Aider financièrement tes enfants à s’installer',
        outcome: (s) => ({ text: `Tu verses ${eur(Math.min(10000, liquid(s) * 0.2))} pour les aider à démarrer. Ils sont reconnaissants.`, fx: { money: -Math.round(Math.min(10000, liquid(s) * 0.2)), family: 10, flags: { nidVide: true } } }),
      },
    ],
  },
];
