// Registre de tous les événements narratifs.

import type { GameEvent } from '../../engine/eventTypes';
import { BUDGET_EVENTS } from './budget';
import { CARRIERE_EVENTS } from './carriere';
import { CHANGEMENT_EVENTS } from './changements';
import { DIFFICULTE_EVENTS } from './difficultes';
import { ENTREPRISE_EVENTS } from './entreprise';
import { ETUDES_EVENTS } from './etudes';
import { INTRO_EVENTS } from './intros';
import { INVEST_EVENTS } from './investissement';
import { LOGEMENT_EVENTS } from './logement';
import { MORALE_EVENTS } from './morale';
import { OPPORTUNITE_EVENTS } from './opportunites';
import { RELATIONS_EVENTS } from './relations';
import { REUSSITE_EVENTS } from './reussites';
import { SANTE_EVENTS } from './sante';
import { SUITE_EVENTS } from './suites';

export const ALL_EVENTS: GameEvent[] = [
  ...INTRO_EVENTS,
  ...ETUDES_EVENTS,
  ...CARRIERE_EVENTS,
  ...BUDGET_EVENTS,
  ...INVEST_EVENTS,
  ...ENTREPRISE_EVENTS,
  ...LOGEMENT_EVENTS,
  ...RELATIONS_EVENTS,
  ...SANTE_EVENTS,
  ...OPPORTUNITE_EVENTS,
  ...DIFFICULTE_EVENTS,
  ...REUSSITE_EVENTS,
  ...MORALE_EVENTS,
  ...CHANGEMENT_EVENTS,
  ...SUITE_EVENTS,
];
