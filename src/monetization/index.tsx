// Module de monétisation — DÉSACTIVÉ.
//
// Ce module est volontairement isolé du moteur de jeu : rien dans src/engine ni src/content n'en dépend.
// La première version ne contient aucune publicité, aucun script tiers et aucun traceur.
//
// Pour activer un jour de la publicité, il faudra au minimum :
//  1. choisir une régie et ajouter son script UNIQUEMENT après consentement explicite (CMP conforme RGPD / ePrivacy) ;
//  2. mettre à jour les mentions légales et la politique de confidentialité ;
//  3. passer `adsEnabled` à true et implémenter le rendu dans <AdSlot />.
// Le jeu doit rester pleinement jouable si ce module reste désactivé.

export const MONETIZATION = {
  adsEnabled: false,
  requiresConsent: true,
} as const;

export interface AdSlotProps {
  placement: 'home' | 'ending';
}

/** Emplacement publicitaire : ne rend rien tant que la monétisation est désactivée. */
export function AdSlot(_props: AdSlotProps) {
  if (!MONETIZATION.adsEnabled) return null;
  return null;
}
