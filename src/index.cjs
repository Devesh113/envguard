"use strict";

/**
 * CommonJS entry point for envguard.
 *
 * This file mirrors the logic in validator.js (ESM) so that both
 * module systems expose identical functionality. The test suite
 * verifies that CJS and ESM produce the same results.
 */

class EnvValidationError extends Error {
  constructor(errors) {
    super("Environment validation failed");
    this.name = "EnvValidationError";
    this.errors = errors;
  }
}

const VALID_TYPES = ["string", "number", "boolean"];

function validateDefaultValue(key, type, defaultValue) {
  if (defaultValue === undefined) return;

  switch (type) {
    case "string":
      if (typeof defaultValue !== "string") {
        throw new TypeError(
          `Invalid default for ${key}: expected a string`
        );
      }
      break;
    case "number":
      if (typeof defaultValue !== "number" || !Number.isFinite(defaultValue)) {
        throw new TypeError(
          `Invalid default for ${key}: expected a finite number`
        );
      }
      break;
    case "boolean":
      if (typeof defaultValue !== "boolean") {
        throw new TypeError(
          `Invalid default for ${key}: expected a boolean`
        );
      }
      break;
  }
}

function validateEnv(schema) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new TypeError("Schema must be a plain object");
  }

  const config = {};
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const {
      type = "string",
      required = true,
      default: defaultValue,
    } = typeof rules === "string" ? { type: rules } : rules;

    if (!VALID_TYPES.includes(type)) {
      throw new TypeError(`Invalid type for ${key}: ${type}`);
    }

    validateDefaultValue(key, type, defaultValue);

    let value = process.env[key];

    if (value === undefined || value.trim() === "") {
      if (defaultValue !== undefined) {
        config[key] = defaultValue;
        continue;
      }

      if (required) {
        errors.push(`${key} is required`);
      }

      continue;
    }

    if (type === "string") {
      config[key] = value;
    } else if (type === "number") {
      const parsed = Number(value);

      if (!Number.isFinite(parsed)) {
        errors.push(`${key} must be a valid finite number`);
      } else {
        config[key] = parsed;
      }
    } else if (type === "boolean") {
      const normalized = value.toLowerCase();

      if (normalized === "true") {
        config[key] = true;
      } else if (normalized === "false") {
        config[key] = false;
      } else {
        errors.push(`${key} must be "true" or "false"`);
      }
    }
  }

  if (errors.length > 0) {
    throw new EnvValidationError(errors);
  }

  return config;
}

module.exports = { validateEnv, EnvValidationError };
