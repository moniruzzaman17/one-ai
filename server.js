"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const { existsSync } = require("node:fs");
const { join } = require("node:path");

const standaloneDirectory = join(__dirname, ".next", "standalone");
const standaloneServer = join(standaloneDirectory, "server.js");

if (!existsSync(standaloneServer)) {
  throw new Error("OneAI production build is missing. Run the cpanel:build script first.");
}

process.chdir(standaloneDirectory);
require(standaloneServer);
