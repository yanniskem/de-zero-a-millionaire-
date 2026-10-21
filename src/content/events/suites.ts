// Événements de suite : déclenchés par des conséquences différées ou par l'état du personnage.

import { businessValuation } from '../../engine/economy';
import type { GameEvent } from '../../engine/eventTypes';
import { eur, roll } from './helpers';

export const SUITE_EVENTS: GameEvent[] = [
  {
    id: 'suite_stage_offre',
    followUp: true,
    category: 'carriere',
    title: 'Le stage porte ses fruits',
    text: 'L’entreprise où tu avais fait ton stage te recontacte : elle a un poste pour toi, si tu es disponible.',
    choices: [
      {
        id: 'accepter',
        label: 'Accepter le poste',
        requires: (s) => s.training?.mode !== 'full',
        requiresText: 'Termine d’abord ta formation à temps plein.',
        outcome: (s) => ({ text: 'Tu rejoins l’entreprise. Ton stage non payé était finalement un excellent investissement.', fx: { setJob: { jobId: s.education >= 4 ? 'chef_projet' : s.education >= 3 ? 'gestionnaire_paie' : 'assistant_admin' }, network: 6, happiness: 6 } }),
      },
      {
        id: 'garder',
        label: 'Garder le contact pour plus tard',
        outcome: { text: 'Tu remercies chaleureusement et gardes le contact.', fx: { network: 4 } },
      },
    ],
  },
  {
    id: 'suite_collegue_startup',
    followUp: true,
    category: 'carriere',
    title: 'Deux ans plus tard',
    text: 'Deux ans ont passé depuis que tu as rejoint la petite entreprise de ton ancien collègue. L’heure du bilan a sonné.',
    choices: [
      {
        id: 'bilan',
        label: 'Découvrir le résultat',
        outcome: (s, r) => {
          const success = r.chance(0.5 + s.skills.manage / 300);
          if (!s.job) return { text: 'Tu avais déjà quitté l’aventure. Tu suis son évolution de loin.', fx: {} };
          if (success) {
            return {
              text: s.flags.partsStartup
                ? 'L’entreprise a décollé ! Ton poste a pris de l’ampleur et tes parts valent désormais une belle somme, rachetées par un investisseur.'
                : 'L’entreprise a décollé ! Tu es promu{|e} à la tête d’une équipe, avec une belle augmentation.',
              fx: { salaryPct: 30, skills: { manage: 5 }, money: s.flags.partsStartup ? 40000 : 0, happiness: 8, highlight: { kind: 'success', text: 'Avoir misé sur la bonne petite entreprise' } },
            };
          }
          return { text: 'L’entreprise n’a pas trouvé son marché et ferme ses portes. Tu te retrouves sans emploi, mais riche d’expérience.', fx: { loseJob: 'licenciement', skills: { manage: 4 }, happiness: -6 } };
        },
      },
    ],
  },
  {
    id: 'suite_ponzi',
    followUp: true,
    category: 'difficulte',
    title: 'Le placement miracle s’effondre',
    text: 'Les « intérêts » ont cessé d’arriver. Ton collègue ne répond plus. Les journaux parlent d’une pyramide de Ponzi démantelée.',
    choices: [
      {
        id: 'plainte',
        label: 'Porter plainte avec les autres victimes',
        outcome: roll(0.3,
          { text: 'Des années plus tard, une partie des fonds est restituée : tu récupères 900 €.', fx: { money: 900, skills: { finance: 6 }, highlight: { kind: 'mistake', text: 'Victime d’une pyramide de Ponzi' } } },
          { text: 'L’argent a disparu à l’étranger. Tu ne récupéreras rien.', fx: { happiness: -6, skills: { finance: 6 }, highlight: { kind: 'mistake', text: 'Victime d’une pyramide de Ponzi' } } }),
      },
      {
        id: 'oublier',
        label: 'Tourner la page',
        outcome: { text: 'Tu fais une croix sur cet argent. Une leçon à 2 400 €.', fx: { happiness: -4, skills: { finance: 5 }, highlight: { kind: 'mistake', text: 'Victime d’une pyramide de Ponzi' } } },
      },
    ],
  },
  {
    id: 'suite_associe',
    followUp: true,
    category: 'entreprise',
    title: 'L’associé veut partir',
    text: 'Mehdi, ton associé, est épuisé. Il veut quitter l’entreprise et te demande de racheter sa part.',
    choices: [
      {
        id: 'racheter',
        label: 'Racheter sa part',
        hint: '10 000 €',
        cost: 10000,
        requires: (s) => !!s.business,
        requiresText: 'L’entreprise n’existe plus.',
        outcome: { text: 'Tu rachètes sa part. Vous vous quittez en amis, et tu es seul{|e} maître à bord.', fx: { friends: 4, biz: { valuationBonus: 1.1 }, flags: { associe: false } } },
      },
      {
        id: 'remplacer',
        label: 'Trouver un nouvel associé',
        requires: (s) => !!s.business,
        requiresText: 'L’entreprise n’existe plus.',
        outcome: roll(0.6,
          { text: 'Un nouvel associé rachète la part de Mehdi et apporte un souffle neuf.', fx: { biz: { reputation: 5, cash: 5000 }, flags: { associe: true } } },
          { text: 'Le nouvel associé ne s’entend pas avec toi. Les tensions pèsent sur l’activité.', fx: { biz: { reputation: -8 }, happiness: -4 } }),
      },
      {
        id: 'dissoudre',
        label: 'Fermer l’entreprise ensemble',
        outcome: { text: 'Vous décidez d’arrêter ensemble. Une belle aventure se termine.', fx: { biz: { close: 'fermeture' }, friends: 4, flags: { associe: false } } },
      },
    ],
  },
  {
    id: 'suite_rachat',
    followUp: true,
    category: 'entreprise',
    title: 'La contre-offre acceptée',
    text: (s) => `Le groupe revient vers toi : il accepte ta contre-offre pour racheter ${s.business?.name ?? 'ton entreprise'}.`,
    choices: [
      {
        id: 'signer',
        label: 'Signer la vente',
        requires: (s) => !!s.business,
        requiresText: 'L’entreprise n’existe plus.',
        outcome: (s) => {
          const price = Math.round(Math.max(businessValuation(s.business) * 1.6, 60000));
          const tax = Math.round(Math.max(0, price - s.business!.invested) * 0.2);
          return { text: `Vente signée pour ${eur(price)} ! Après impôt (${eur(tax)}), le fruit de ton travail est sur ton compte.`, fx: { money: price - tax, biz: { close: 'fermeture', cash: -s.business!.treasury }, recordSale: price, happiness: 12, highlight: { kind: 'success', text: `Vente de ${s.business!.name} pour ${eur(price)}` } } };
        },
      },
      {
        id: 'refuser',
        label: 'Finalement, garder l’entreprise',
        outcome: { text: 'Au dernier moment, tu ne peux pas. Le groupe claque la porte.', fx: { network: -4 } },
      },
    ],
  },
  {
    id: 'suite_mentor',
    followUp: true,
    category: 'opportunite',
    title: 'Le dernier conseil du mentor',
    text: 'Ton vieux mentor du café t’appelle. Il veut investir dans un dernier projet et pense à toi.',
    choices: [
      {
        id: 'accepter',
        label: 'Écouter sa proposition',
        outcome: (s) => (s.business
          ? { text: 'Il investit 40 000 € dans ton entreprise et t’ouvre son carnet d’adresses.', fx: { biz: { cash: 40000, reputation: 10, valuationBonus: 1.2 }, network: 10 } }
          : { text: 'Il te recommande pour un poste de direction chez un ami, ou te propose de financer ton futur projet. En attendant, il te donne 5 000 € « pour démarrer ».', fx: { money: 5000, network: 10, skills: { finance: 3 } } }),
      },
    ],
  },
  {
    id: 'suite_alerte',
    followUp: true,
    category: 'morale',
    title: 'Les suites de l’alerte',
    text: 'L’enquête sur les comptes truqués de ton ancienne direction arrive à son terme.',
    choices: [
      {
        id: 'resultat',
        label: 'Découvrir l’issue',
        outcome: roll(0.65,
          { text: 'La justice te donne raison. Les dirigeants sont condamnés, et ton courage est salué publiquement. Une entreprise éthique te recrute.', fx: { network: 15, happiness: 10, salaryPct: 10, highlight: { kind: 'success', text: 'Lanceur d’alerte reconnu{|e} par la justice' } } },
          { text: 'L’affaire s’enlise. Tu as payé cher ton intégrité : ambiance délétère et carrière ralentie.', fx: { happiness: -6, performance: -10, network: 4 } }),
      },
    ],
  },
  {
    id: 'suite_rupture',
    followUp: true,
    category: 'relations',
    title: 'Le couple au bord de la rupture',
    text: '{partner} te dit, la voix tremblante : « Je ne suis plus heureux{|se} avec toi. On ne se voit plus, on ne se parle plus. »',
    choices: [
      {
        id: 'sauver',
        label: 'Tout faire pour sauver votre histoire',
        outcome: roll(0.55,
          { text: 'Tu lèves le pied, vous partez ensemble, vous vous retrouvez. La flamme se rallume.', fx: { partner: 30, performance: -5, money: -1200 } },
          { text: 'Malgré tes efforts, {partner} prend sa décision. Vous vous séparez.', fx: { breakup: true, happiness: -12 } }),
      },
      {
        id: 'accepter',
        label: 'Accepter la séparation',
        outcome: { text: 'Vous vous quittez, épuisés mais lucides.', fx: { breakup: true, happiness: -10, money: -1500 } },
      },
    ],
  },
  {
    id: 'suite_burnout',
    followUp: true,
    category: 'sante',
    title: 'Le burn-out',
    text: 'Un matin, tu fonds en larmes devant ton café sans savoir pourquoi. Ton médecin pose le mot : burn-out.',
    choices: [
      {
        id: 'arret',
        label: 'Accepter un long arrêt et se soigner',
        outcome: { text: 'Plusieurs mois pour te reconstruire. Tu reviens différent{|e}, avec de nouvelles limites.', fx: { energy: 30, health: 12, performance: -15, happiness: 4, flags: { burnoutVecu: true }, highlight: { kind: 'mistake', text: 'Burn-out' } } },
      },
      {
        id: 'quitter',
        label: 'Démissionner pour tout changer',
        outcome: { text: 'Tu quittes tout. Le soulagement est immense, l’incertitude aussi.', fx: { loseJob: 'demission', energy: 35, health: 8, happiness: 6, flags: { burnoutVecu: true }, highlight: { kind: 'mistake', text: 'Burn-out et démission' } } },
      },
      {
        id: 'nier',
        label: 'Continuer coûte que coûte',
        outcome: { text: 'Tu continues, à vide. Ton corps et ton moral en paient le prix.', fx: { health: -15, happiness: -10, energy: 5, highlight: { kind: 'mistake', text: 'Ignorer un burn-out' } } },
      },
    ],
  },
];
