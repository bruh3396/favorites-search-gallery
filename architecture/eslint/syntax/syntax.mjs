import * as Environment from "#architecture/eslint/syntax/environment.mjs";
import * as Outside from "#architecture/eslint/syntax/outside.mjs";

export const MESSAGES = { ...Outside.MESSAGES, ...Environment.MESSAGES };

export const SYNTAX = [...Outside.CONFIGS, ...Environment.CONFIGS];
