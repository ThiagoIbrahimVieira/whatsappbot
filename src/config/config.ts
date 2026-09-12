import dotenv from 'dotenv';
import { envSchema } from './schema.js';
import type { AppConfig } from '../types/config.js';

// Carrega variáveis do arquivo .env
dotenv.config();

export function loadConfig(rawEnv: Record<string, unknown> = process.env): AppConfig {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('\n❌ Erro de validação das configurações de ambiente:');
    console.error(errorDetails);
    console.error('\nPor favor, corrija as variáveis no seu arquivo .env e tente novamente.\n');

    throw new Error(`Falha na validação do .env:\n${errorDetails}`);
  }

  return result.data;
}

// Instância singleton da configuração validada
export const config: AppConfig = loadConfig();
