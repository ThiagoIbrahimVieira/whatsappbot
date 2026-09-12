import { bootstrap } from './app/bootstrap.js';
import { logger } from './utils/logger.js';

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Falha fatal na inicialização da aplicação');
  process.exit(1);
});
