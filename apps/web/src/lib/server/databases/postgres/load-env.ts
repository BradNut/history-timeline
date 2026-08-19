import dotenv from 'dotenv';

const env = process.env.ENVIRONMENT;

dotenv.config({ override: true });
dotenv.config({ path: '.env.local', override: true });
if (env) {
  dotenv.config({ path: `.env.${env}`, override: true });
  dotenv.config({ path: `.env.${env}.local`, override: true });
}
