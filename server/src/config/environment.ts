import { config } from './index';

export function getEnvironmentInfo() {
  return {
    nodeEnv: config.nodeEnv,
    port: config.port,
    databaseUrl: config.databaseUrl,
    jwtSecret: config.jwtSecret,
    openaiApiKey: config.openaiApiKey,
  };
}
