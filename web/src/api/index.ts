export * from './client';
export * from './bot';
export * from './access';
export * from './activity';
export * from './ranking';

import { botApi } from './bot';
import { accessApi } from './access';
import { activityApi } from './activity';
import { rankingApi } from './ranking';

export const api = {
  bot: botApi,
  access: accessApi,
  activity: activityApi,
  ranking: rankingApi,
};
