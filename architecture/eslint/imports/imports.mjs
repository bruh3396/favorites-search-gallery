import * as Adapters from "#architecture/eslint/imports/adapters.mjs";
import * as Core from "#architecture/eslint/imports/core.mjs";
import * as Features from "#architecture/eslint/imports/features.mjs";
import * as Storage from "#architecture/eslint/imports/storage.mjs";
import * as Tests from "#architecture/eslint/imports/tests.mjs";

export const MESSAGES = { ...Core.MESSAGES, ...Adapters.MESSAGES, ...Features.MESSAGES, ...Storage.MESSAGES, ...Tests.MESSAGES };

export const IMPORTS = [...Core.POLICIES, ...Adapters.POLICIES, ...Features.POLICIES, ...Storage.POLICIES, ...Tests.POLICIES];
