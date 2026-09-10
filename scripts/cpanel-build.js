"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const root = join(__dirname, "..");
const configuredEnvironment = process.env.ONEAI_ENV_FILE;
const localEnvironment = join(root, ".env.local");
const environmentFile = configuredEnvironment || (existsSync(localEnvironment) ? localEnvironment : null);

if (environmentFile) {
  if (!existsSync(environmentFile)) {
    throw new Error(`ONEAI_ENV_FILE does not exist: ${environmentFile}`);
  }
  process.loadEnvFile(environmentFile);
}

process.env.NODE_ENV = "production";

function run(modulePath, arguments_) {
  const result = spawnSync(process.execPath, [modulePath, ...arguments_], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const tsx = require.resolve("tsx/cli");
run(tsx, ["scripts/migrate.ts"]);
run(tsx, ["scripts/seed.ts"]);
run(require.resolve("next/dist/bin/next"), ["build"]);
run(tsx, ["scripts/prepare-standalone.ts"]);
