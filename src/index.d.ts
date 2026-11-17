/**
 * Error thrown when one or more environment variables fail validation.
 *
 * The `errors` array contains a human-readable message for each failure.
 * Environment variable values are never included in error messages.
 */
export class EnvValidationError extends Error {
  readonly name: "EnvValidationError";
  readonly errors: string[];
  constructor(errors: string[]);
}

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

type SchemaType = "string" | "number" | "boolean";

interface StringRule {
  type: "string";
  required?: boolean;
  default?: string;
}

interface NumberRule {
  type: "number";
  required?: boolean;
  default?: number;
}

interface BooleanRule {
  type: "boolean";
  required?: boolean;
  default?: boolean;
}

/** When `type` is omitted it defaults to `"string"`. */
interface ImplicitStringRule {
  type?: undefined;
  required?: boolean;
  default?: string;
}

type SchemaRule = StringRule | NumberRule | BooleanRule | ImplicitStringRule;

/**
 * A schema entry is either a type shorthand (`"string"`, `"number"`,
 * `"boolean"`) or an object with `type`, `required`, and `default` fields.
 */
type SchemaEntry = SchemaType | SchemaRule;

// ---------------------------------------------------------------------------
// Return-type inference
// ---------------------------------------------------------------------------

interface TypeMap {
  string: string;
  number: number;
  boolean: boolean;
}

/** Map a schema entry to its JavaScript value type. */
type InferValue<T extends SchemaEntry> =
  T extends keyof TypeMap ? TypeMap[T] :
  T extends { type: infer U extends SchemaType } ? TypeMap[U] :
  string;

/**
 * A key is guaranteed to be present when it is required (the default)
 * **or** when it has a default value.  A key is optional only when
 * `required: false` and no `default` is provided.
 */
type IsDefinite<T extends SchemaEntry> =
  T extends { required: false }
    ? T extends { default: string | number | boolean }
      ? true
      : false
    : true;

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type ValidateResult<S extends Record<string, SchemaEntry>> = Prettify<
  { [K in keyof S as IsDefinite<S[K]> extends true  ? K : never]:  InferValue<S[K]> } &
  { [K in keyof S as IsDefinite<S[K]> extends false ? K : never]?: InferValue<S[K]> }
>;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate environment variables against a declarative schema.
 *
 * @param schema — A plain object mapping environment variable names to
 *   type shorthands or rule objects.
 * @returns A typed configuration object with validated and converted values.
 * @throws {TypeError} If the schema itself is invalid.
 * @throws {EnvValidationError} If one or more variables fail validation.
 *
 * @example
 * ```ts
 * const config = validateEnv({
 *   PORT:         { type: "number" },
 *   DEBUG:        { type: "boolean", default: false },
 *   DATABASE_URL: "string",
 *   LOG_LEVEL:    { type: "string", required: false },
 * });
 *
 * config.PORT;         // number
 * config.DEBUG;        // boolean
 * config.DATABASE_URL; // string
 * config.LOG_LEVEL;    // string | undefined
 * ```
 */
export function validateEnv<S extends Record<string, SchemaEntry>>(
  schema: S
): ValidateResult<S>;
