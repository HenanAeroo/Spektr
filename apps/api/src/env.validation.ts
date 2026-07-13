import * as Joi from 'joi';

export const schema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),
  PORT: Joi.number().default(3001).optional(),
  FRONT_URL: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().email().optional(),
  R2_ENDPOINT: Joi.string().required(),
  R2_PORT: Joi.number().required(),
  // Kept as a validated string ('true'/'false') because minio.service compares
  // it with === 'true'; using Joi.boolean() would coerce it and break that check.
  R2_USE_SSL: Joi.string().valid('true', 'false').default('false'),
  R2_ACCESS_KEY: Joi.string().required(),
  R2_SECRET_KEY: Joi.string().required(),
  R2_BUCKET: Joi.string().required(),
});
