import * as Environment from "#architecture/eslint/syntax/environment.mjs";
import * as Outside from "#architecture/eslint/syntax/outside.mjs";
import * as Ui from "#architecture/eslint/syntax/ui.mjs";

export const MESSAGES = { ...Outside.MESSAGES, ...Environment.MESSAGES, ...Ui.MESSAGES };

export const SYNTAX = [...Outside.CONFIGS, ...Environment.CONFIGS, ...Ui.CONFIGS];
