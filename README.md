# EnvGuard

Simple, lightweight environment variable validation for Node.js applications.

Validate, type-check, and convert environment variables with a clean declarative schema. Supports ESM, CommonJS, and TypeScript out of the box.

## Installation

```bash
npm install envguard
```

## Quick Start

### ESM

```javascript
import { validateEnv } from "envguard";

const config = validateEnv({
  PORT: "number",
  DATABASE_URL: "string",
  DEBUG: { type: "boolean", default: false }
});

console.log(config.PORT);         // 3000 (number)
console.log(config.DATABASE_URL); // "postgres://..." (string)
console.log(config.DEBUG);        // false (boolean)
```

### CommonJS

```javascript
const { validateEnv } = require("envguard");

const config = validateEnv({
  PORT: "number",
  DATABASE_URL: "string",
  DEBUG: { type: "boolean", default: false }
});
```

### TypeScript

Full type inference is included — no additional `@types` package needed.

```typescript
import { validateEnv } from "envguard";

const config = validateEnv({
  PORT: { type: "number" },
  DEBUG: { type: "boolean", default: false },
  DATABASE_URL: "string",
  LOG_LEVEL: { type: "string", required: false }
});

config.PORT;         // number
config.DEBUG;        // boolean
config.DATABASE_URL; // string
config.LOG_LEVEL;    // string | undefined (optional)
```

## Supported Types

| Type        | Environment Value                        | Converted To |
| ----------- | ---------------------------------------- | ------------ |
| `"string"`  | Any non-empty string                     | `string`     |
| `"number"`  | Valid finite number                      | `number`     |
| `"boolean"` | `"true"` or `"false"` (case-insensitive) | `boolean`    |

## Schema Options

### Shorthand Syntax

Pass a type string directly:

```javascript
const config = validateEnv({
  DATABASE_URL: "string",
  PORT: "number",
  DEBUG: "boolean"
});
```

### Object Syntax

Pass an options object for more control:

```javascript
const config = validateEnv({
  PORT: {
    type: "number",     // "string" | "number" | "boolean" (default: "string")
    required: true,     // boolean (default: true)
    default: 3000       // must match the declared type
  }
});
```

## Required and Optional Variables

### Required (default)

By default, all variables are required. If a required variable is missing or empty, validation throws an `EnvValidationError`.

```javascript
// These are equivalent
validateEnv({ API_KEY: "string" });
validateEnv({ API_KEY: { type: "string", required: true } });
```

### Optional

Set `required: false` to make a variable optional. If the variable is not set and no default is provided, it is omitted from the returned object.

```javascript
const config = validateEnv({
  LOG_LEVEL: { type: "string", required: false }
});

if (config.LOG_LEVEL) {
  // LOG_LEVEL was set in the environment
}
```

## Default Values

Provide a fallback value when the environment variable is not set. The default must match the declared type — a type mismatch throws a `TypeError`.

```javascript
const config = validateEnv({
  PORT: { type: "number", default: 3000 },
  DEBUG: { type: "boolean", default: false },
  HOST: { type: "string", default: "localhost" }
});
```

## Error Handling

EnvGuard collects **all** validation errors before throwing, so you can fix every issue at once.

```javascript
import { validateEnv, EnvValidationError } from "envguard";

try {
  const config = validateEnv({
    PORT: "number",
    DATABASE_URL: "string",
    DEBUG: "boolean"
  });
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.error("Environment validation failed:");
    err.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  throw err;
}
```

### Error Types

| Scenario           | Error Type           | When                                           |
| ------------------ | -------------------- | ---------------------------------------------- |
| Invalid schema     | `TypeError`          | Schema is not a plain object                   |
| Invalid type       | `TypeError`          | Type is not `"string"`, `"number"`, or `"boolean"` |
| Invalid default    | `TypeError`          | Default value does not match the declared type |
| Validation failure | `EnvValidationError` | One or more variables fail validation          |

> **Note:** Environment variable values are never included in error messages to prevent leaking secrets.

## API Reference

### `validateEnv(schema)`

Validates environment variables against the provided schema.

**Parameters:**

- `schema` — A plain object where each key is an environment variable name and each value is either:
  - A type string: `"string"` | `"number"` | `"boolean"`
  - A schema rule object: `{ type?, required?, default? }`

**Returns:** A plain object with validated and type-converted values.

**Throws:**

- `TypeError` — if the schema is invalid or a default value has the wrong type.
- `EnvValidationError` — if one or more environment variables fail validation.

### `EnvValidationError`

Custom error class extending `Error`.

**Properties:**

| Property  | Type       | Description                            |
| --------- | ---------- | -------------------------------------- |
| `name`    | `string`   | Always `"EnvValidationError"`          |
| `message` | `string`   | `"Environment validation failed"`      |
| `errors`  | `string[]` | Individual validation error messages   |

## Limitations

- **Node.js only** — EnvGuard reads from `process.env` and is not designed for browsers, Cloudflare Workers, or other non-Node runtimes.
- **No `.env` file loading** — EnvGuard validates variables already in `process.env`. Use a package like [dotenv](https://www.npmjs.com/package/dotenv) to load `.env` files before calling `validateEnv`.
- **No nested objects** — The schema is a flat key-value map; nested configuration is not supported.

## Requirements

- Node.js >= 18.0.0

## License

MIT
