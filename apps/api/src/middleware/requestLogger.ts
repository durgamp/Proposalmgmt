import morgan from 'morgan';
import { isDev } from '../config/env';

export const requestLogger = morgan(isDev ? 'dev' : 'combined');
