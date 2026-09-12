export * from './client';
export * from './bot';
export * from './access';
export * from './activity';

import { botApi } from './bot';
import { accessApi } from './access';
import { activityApi } from './activity';

export const api = {
  bot: botApi,
  access: accessApi,
  activity: activityApi,
};
