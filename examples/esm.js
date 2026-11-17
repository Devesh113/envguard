/**
 * EnvGuard — ESM usage example
 *
 * Run:
 *   PORT=3000 DATABASE_URL=postgres://localhost/mydb node examples/esm.js
 */

import { validateEnv, EnvValidationError } from "../src/index.js";

try {
  const config = validateEnv({
    PORT: "number",
    DATABASE_URL: "string",
    DEBUG: { type: "boolean", default: false },
    LOG_LEVEL: { type: "string", required: false },
  });

  console.log("✅ Configuration validated successfully:");
  console.log(config);
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.error("❌ Environment validation failed:");
    err.errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }
  throw err;
}
