"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const { existsSync } = require("node:fs");
const { createServer } = require("node:http");
const { join } = require("node:path");

const configuredEnvironment = process.env.ONEAI_ENV_FILE;
if (configuredEnvironment) {
  if (!existsSync(configuredEnvironment)) {
    throw new Error(`ONEAI_ENV_FILE does not exist: ${configuredEnvironment}`);
  }
  process.loadEnvFile(configuredEnvironment);
}

const standaloneDirectory = join(__dirname, ".next", "standalone");
const standaloneServer = join(standaloneDirectory, "server.js");

if (existsSync(standaloneServer)) {
  process.chdir(standaloneDirectory);
  require(standaloneServer);
} else {
  const port = Number(process.env.PORT || 3000);
  const hostname = process.env.HOSTNAME || "0.0.0.0";
  createServer((_, response) => {
    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end("OneAI dependencies installed. Run the cpanel:build script, then restart the application.\n");
  }).listen(port, hostname);
}
