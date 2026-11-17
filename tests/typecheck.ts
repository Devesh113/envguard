/**
 * TypeScript type-level verification for src/index.d.ts
 *
 * This file is NOT executed at runtime. It verifies that the type
 * declarations produce correct inferred types.
 *
 * Verify with:
 *   npx tsc --noEmit -p tsconfig.json
 */

import { validateEnv, EnvValidationError } from "../src/index.js";

// --- String type inference ---
const stringConfig = validateEnv({ NAME: "string" });
const name: string = stringConfig.NAME;

// --- Number type inference ---
const numberConfig = validateEnv({ PORT: { type: "number" } });
const port: number = numberConfig.PORT;

// --- Boolean type inference ---
const boolConfig = validateEnv({ DEBUG: { type: "boolean" } });
const debug: boolean = boolConfig.DEBUG;

// --- Default values ---
const defaultConfig = validateEnv({
  PORT: { type: "number", default: 3000 },
  DEBUG: { type: "boolean", default: false },
  HOST: { type: "string", default: "localhost" },
});
const dPort: number = defaultConfig.PORT;
const dDebug: boolean = defaultConfig.DEBUG;
const dHost: string = defaultConfig.HOST;

// --- Optional variable (required: false, no default → optional in result) ---
const optionalConfig = validateEnv({
  LOG: { type: "string", required: false },
});
const log: string | undefined = optionalConfig.LOG;

// --- Mixed schema ---
const mixedConfig = validateEnv({
  PORT: { type: "number" },
  DATABASE_URL: "string",
  DEBUG: { type: "boolean", default: false },
  LOG_LEVEL: { type: "string", required: false },
});
const mPort: number = mixedConfig.PORT;
const mUrl: string = mixedConfig.DATABASE_URL;
const mDebug: boolean = mixedConfig.DEBUG;
const mLog: string | undefined = mixedConfig.LOG_LEVEL;

// --- EnvValidationError ---
const err = new EnvValidationError(["test"]);
const errName: string = err.name;
const errMsg: string = err.message;
const errErrors: string[] = err.errors;
const isErr: boolean = err instanceof Error;

// Suppress unused-variable warnings
void name; void port; void debug;
void dPort; void dDebug; void dHost;
void log;
void mPort; void mUrl; void mDebug; void mLog;
void errName; void errMsg; void errErrors; void isErr;
