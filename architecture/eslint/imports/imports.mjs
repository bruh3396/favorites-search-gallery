import * as Adapters from "#architecture/eslint/imports/adapters.mjs";
import * as Core from "#architecture/eslint/imports/core.mjs";
import * as Features from "#architecture/eslint/imports/features.mjs";
import * as Storage from "#architecture/eslint/imports/storage.mjs";
import * as Tests from "#architecture/eslint/imports/tests.mjs";
import * as Ui from "#architecture/eslint/imports/ui.mjs";

export const MESSAGES = { ...Core.MESSAGES, ...Ui.MESSAGES, ...Adapters.MESSAGES, ...Features.MESSAGES, ...Storage.MESSAGES, ...Tests.MESSAGES };

export const IMPORTS = [...Core.POLICIES, ...Ui.POLICIES, ...Adapters.POLICIES, ...Features.POLICIES, ...Storage.POLICIES, ...Tests.POLICIES];
