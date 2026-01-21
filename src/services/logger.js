/**
 * Logger centralisé - N'affiche les logs qu'en mode développement
 *
 * Usage:
 *   import logger from './services/logger';
 *   logger.log('Message');
 *   logger.error('Erreur');
 *   logger.warn('Attention');
 *   logger.info('Info');
 *   logger.group('Groupe');
 *   logger.groupEnd();
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const noop = () => {};

const logger = {
  log: isDevelopment ? console.log.bind(console) : noop,
  error: isDevelopment ? console.error.bind(console) : noop,
  warn: isDevelopment ? console.warn.bind(console) : noop,
  info: isDevelopment ? console.info.bind(console) : noop,
  debug: isDevelopment ? console.debug.bind(console) : noop,
  group: isDevelopment ? console.group.bind(console) : noop,
  groupEnd: isDevelopment ? console.groupEnd.bind(console) : noop,
  table: isDevelopment ? console.table.bind(console) : noop,
};

export default logger;
