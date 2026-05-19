import * as Joi from 'joi';

export const schema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),
  PORT: Joi.number().default(3001).optional(),
  FRONT_URL: Joi.string().required(),
  NODE_ENV: Joi.string().default('development'),
});
