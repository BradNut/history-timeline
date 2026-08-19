import dotenv from 'dotenv';

const env = process.env.ENVIRONMENT;

// Load example defaults first so real .env files can override them
dotenv.config({ path: '.env.example' });
dotenv.config({ override: true });
dotenv.config({ path: '.env.local', override: true });
if (env) {
  dotenv.config({ path: `.env.${env}`, override: true });
  dotenv.config({ path: `.env.${env}.local`, override: true });
}
