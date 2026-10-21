// Bilan de vie et texte de partage, calculés uniquement à partir de la partie réelle.

import { ENDING_BY_ID } from '../content/endings';
import { PROFILE_BY_ID } from '../content/profiles';
import { jobTitle } from './catalog';
import { activeChildren, balanceSheet } from './economy';
import { determineEnding, endingContext } from './endings';
import { fillText } from './events';
import type { GameState } from './types';

export interface LifeSummary {
  name: string;
  age: number;
  profileName: string;
  profileEmoji: string;
  startMoney: number;
  finalNetWorth: number;
  peakNetWorth: number;
  peakAge: number;
  ending: { id: string; title: string; emoji: string; rarity: string; conclusion: string };
  careerPath: string[];
  successes: string[];
  mistakes: string[];
  keyDecisions: { age: number; title: string; choice: string }[];
  partner: string | null;
  married: boolean;
  children: number;
  family: number;
  friends: number;
  happiness: number;
  health: number;
  businessesCreated: number;
  bankruptcies: number;
  diplomas: number;
  promotions: number;
  shareText: string;
}

const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;
const WORDS = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
const count = (n: number, singular: string, plural: string, fem = true) => {
  const w = n <= 10 ? (n === 1 && !fem ? 'un' : WORDS[n]) : String(n);
  return `${w} ${n > 1 ? plural : singular}`;
};

export function careerPathLabels(s: GameState): string[] {
  const out: string[] = [];
  for (const c of s.careerPath) {
    const t = jobTitle(c.jobId, s.gender);
    if (out[out.length - 1] !== t) out.push(t);
  }
  return out;
}

export function buildShareText(s: GameState, endingTitle: string): string {
  const b = balanceSheet(s);
  const parts: string[] = [`J’ai commencé avec ${eur(s.startCash)} et terminé avec ${eur(b.netWorth)} à ${s.age} ans.`];
  const facts: string[] = [];
  if (s.counters.businessesCreated > 0) facts.push(`créé ${count(s.counters.businessesCreated, 'entreprise', 'entreprises')}`);
  if (s.counters.bankruptcies > 0) facts.push(`connu ${count(s.counters.bankruptcies, 'faillite', 'faillites')}`);
  if (s.counters.bankruptcies > 0 && b.netWorth > Math.max(50000, (s.flags.nwAtFaillite as number) ?? 0)) facts.push('rebondi');
  if (facts.length < 3 && s.counters.businessesSold > 0) facts.push(`revendu ${count(s.counters.businessesSold, 'entreprise', 'entreprises')}`);
  if (facts.length < 3 && s.peakNetWorth >= 1000000) facts.push('été millionnaire');
  if (facts.length < 3 && s.counters.promotions >= 2) facts.push(`décroché ${count(s.counters.promotions, 'promotion', 'promotions')}`);
  if (facts.length < 3 && s.counters.reconversions > 0) facts.push('changé de voie en cours de route');
  if (facts.length < 3 && s.relations.childrenBirthAges.length > 0) facts.push(`eu ${count(s.relations.childrenBirthAges.length, 'enfant', 'enfants', false)}`);
  if (facts.length < 3 && s.peakNetWorth > b.netWorth * 2 && s.peakNetWorth > 100000) facts.push(`perdu une fortune de ${eur(s.peakNetWorth)}`);
  if (facts.length) {
    const f = facts.slice(0, 3);
    const sentence = f.length === 1 ? f[0] : `${f.slice(0, -1).join(', ')} et ${f[f.length - 1]}`;
    parts.push(`J’ai ${sentence}.`);
  }
  parts.push(`Ma fin : « ${endingTitle} ». Quel sera ton parcours ?`);
  return parts.join(' ');
}

export function buildSummary(s: GameState): LifeSummary {
  const b = balanceSheet(s);
  const def = (s.endingId && ENDING_BY_ID[s.endingId]) || determineEnding(s);
  const profile = PROFILE_BY_ID[s.profileId];
  const conclusion = def.conclusion(s, endingContext(s));
  const title = fillText(def.title, s);
  const careerPath = careerPathLabels(s);
  if (s.counters.businessesCreated > 0 && !careerPath.some((c) => c.startsWith('Dirigeant'))) careerPath.push(`Entrepreneur${s.gender === 'f' ? 'e' : ''} (${s.counters.businessesCreated} création${s.counters.businessesCreated > 1 ? 's' : ''})`);
  const decisions = [...s.decisions].sort((a, b2) => b2.impact - a.impact).slice(0, 5).sort((a, b2) => a.age - b2.age);
  const uniq = (xs: string[]) => [...new Set(xs)];
  return {
    name: s.name,
    age: s.age,
    profileName: fillText(profile?.name ?? '', s),
    profileEmoji: profile?.emoji ?? '✨',
    startMoney: s.startCash,
    finalNetWorth: b.netWorth,
    peakNetWorth: s.peakNetWorth,
    peakAge: s.peakAge,
    ending: { id: def.id, title, emoji: def.emoji, rarity: def.rarity, conclusion: fillText(conclusion, s) },
    careerPath,
    successes: uniq(s.highlights.filter((h) => h.kind === 'success').map((h) => `${h.age} ans — ${h.text}`)).slice(-5),
    mistakes: uniq(s.highlights.filter((h) => h.kind === 'mistake').map((h) => `${h.age} ans — ${h.text}`)).slice(0, 4),
    keyDecisions: decisions.map((d) => ({ age: d.age, title: d.title, choice: d.choice })),
    partner: s.relations.partner?.name ?? null,
    married: !!s.relations.partner?.married,
    children: s.relations.childrenBirthAges.length || activeChildren(s),
    family: s.relations.family,
    friends: s.relations.friends,
    happiness: s.happiness,
    health: s.health,
    businessesCreated: s.counters.businessesCreated,
    bankruptcies: s.counters.bankruptcies,
    diplomas: s.counters.diplomas,
    promotions: s.counters.promotions,
    shareText: buildShareText(s, title),
  };
}
