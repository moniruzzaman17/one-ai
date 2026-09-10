"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const { realpathSync } = require("node:fs");
const { join } = require("node:path");

const releaseDirectory = realpathSync(join(__dirname, "current"));
process.chdir(releaseDirectory);
require(join(releaseDirectory, "server.js"));
