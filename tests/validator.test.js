
import { describe, it, expect, afterEach } from "vitest";
import { createRequire } from "module";
import {
  validateEnv,
  EnvValidationError
} from "../src/index.js";

const require = createRequire(import.meta.url);

// All env var keys used across tests — cleaned up after every test
const TEST_VARS = [
  "TEST_PORT", "TEST_DEBUG", "TEST_NAME", "TEST_URL",
  "TEST_VALUE", "TEST_OPTIONAL", "TEST_HOST",
  "MISSING_VARIABLE", "VAR_A", "VAR_B", "VAR_C",
];

describe("EnvGuard", () => {
  afterEach(() => {
    for (const key of TEST_VARS) {
      delete process.env[key];
    }
  });

  // =========================================================================
  // Original tests (preserved as-is, adapted to updated error messages)
  // =========================================================================

  it("should validate string variables", () => {
    process.env.TEST_NAME = "Devesh";

    const result = validateEnv({
      TEST_NAME: "string"
    });

    expect(result.TEST_NAME).toBe("Devesh");
  });

  it("should convert numbers", () => {
    process.env.TEST_PORT = "3000";

    const result = validateEnv({
      TEST_PORT: "number"
    });

    expect(result.TEST_PORT).toBe(3000);
  });

  it("should convert booleans", () => {
    process.env.TEST_DEBUG = "true";

    const result = validateEnv({
      TEST_DEBUG: "boolean"
    });

    expect(result.TEST_DEBUG).toBe(true);
  });

  it("should throw if a required variable is missing", () => {
    expect(() => {
      validateEnv({
        MISSING_VARIABLE: "string"
      });
    }).toThrow(EnvValidationError);
  });

  it("should support default values", () => {
    const result = validateEnv({
      TEST_PORT: {
        type: "number",
        default: 3000
      }
    });

    expect(result.TEST_PORT).toBe(3000);
  });

  // =========================================================================
  // Schema validation
  // =========================================================================

  describe("schema validation", () => {
    it("should reject null schema", () => {
      expect(() => validateEnv(null)).toThrow(TypeError);
      expect(() => validateEnv(null)).toThrow("Schema must be a plain object");
    });

    it("should reject array schema", () => {
      expect(() => validateEnv([])).toThrow(TypeError);
      expect(() => validateEnv([])).toThrow("Schema must be a plain object");
    });

    it("should reject primitive schema", () => {
      expect(() => validateEnv("string")).toThrow(TypeError);
      expect(() => validateEnv(42)).toThrow(TypeError);
      expect(() => validateEnv(true)).toThrow(TypeError);
      expect(() => validateEnv(undefined)).toThrow(TypeError);
    });

    it("should reject invalid variable type", () => {
      expect(() => {
        validateEnv({ TEST_VALUE: "integer" });
      }).toThrow(TypeError);
      expect(() => {
        validateEnv({ TEST_VALUE: "integer" });
      }).toThrow("Invalid type for TEST_VALUE: integer");
    });
  });

  // =========================================================================
  // Required variables
  // =========================================================================

  describe("required variables", () => {
    it("should throw for missing required variable", () => {
      expect(() => {
        validateEnv({ MISSING_VARIABLE: "string" });
      }).toThrow(EnvValidationError);
    });

    it("should include variable name in error", () => {
      try {
        validateEnv({ MISSING_VARIABLE: "string" });
      } catch (err) {
        expect(err.errors).toContain("MISSING_VARIABLE is required");
      }
    });
  });

  // =========================================================================
  // Optional variables
  // =========================================================================

  describe("optional variables", () => {
    it("should omit optional variable with no value and no default", () => {
      const result = validateEnv({
        TEST_OPTIONAL: { type: "string", required: false }
      });
      expect(result).not.toHaveProperty("TEST_OPTIONAL");
    });

    it("should include optional variable when present", () => {
      process.env.TEST_OPTIONAL = "hello";
      const result = validateEnv({
        TEST_OPTIONAL: { type: "string", required: false }
      });
      expect(result.TEST_OPTIONAL).toBe("hello");
    });
  });

  // =========================================================================
  // Empty and whitespace handling
  // =========================================================================

  describe("empty and whitespace handling", () => {
    it("should treat empty string as missing", () => {
      process.env.TEST_NAME = "";
      expect(() => {
        validateEnv({ TEST_NAME: "string" });
      }).toThrow(EnvValidationError);
    });

    it("should treat whitespace-only string as missing", () => {
      process.env.TEST_NAME = "   ";
      expect(() => {
        validateEnv({ TEST_NAME: "string" });
      }).toThrow(EnvValidationError);
    });

    it("should use default for empty string", () => {
      process.env.TEST_PORT = "";
      const result = validateEnv({
        TEST_PORT: { type: "number", default: 8080 }
      });
      expect(result.TEST_PORT).toBe(8080);
    });
  });

  // =========================================================================
  // Number validation
  // =========================================================================

  describe("number validation", () => {
    it("should convert valid integer string", () => {
      process.env.TEST_PORT = "8080";
      const result = validateEnv({ TEST_PORT: "number" });
      expect(result.TEST_PORT).toBe(8080);
    });

    it("should convert valid float string", () => {
      process.env.TEST_VALUE = "3.14";
      const result = validateEnv({ TEST_VALUE: "number" });
      expect(result.TEST_VALUE).toBeCloseTo(3.14);
    });

    it("should convert negative numbers", () => {
      process.env.TEST_VALUE = "-42";
      const result = validateEnv({ TEST_VALUE: "number" });
      expect(result.TEST_VALUE).toBe(-42);
    });

    it("should reject non-numeric string", () => {
      process.env.TEST_PORT = "abc";
      expect(() => {
        validateEnv({ TEST_PORT: "number" });
      }).toThrow(EnvValidationError);
    });

    it("should reject NaN", () => {
      process.env.TEST_PORT = "NaN";
      expect(() => {
        validateEnv({ TEST_PORT: "number" });
      }).toThrow(EnvValidationError);
    });

    it("should reject Infinity", () => {
      process.env.TEST_PORT = "Infinity";
      expect(() => {
        validateEnv({ TEST_PORT: "number" });
      }).toThrow(EnvValidationError);
    });

    it("should reject -Infinity", () => {
      process.env.TEST_PORT = "-Infinity";
      expect(() => {
        validateEnv({ TEST_PORT: "number" });
      }).toThrow(EnvValidationError);
    });
  });

  // =========================================================================
  // Boolean validation
  // =========================================================================

  describe("boolean validation", () => {
    it("should convert 'true' to true", () => {
      process.env.TEST_DEBUG = "true";
      const result = validateEnv({ TEST_DEBUG: "boolean" });
      expect(result.TEST_DEBUG).toBe(true);
    });

    it("should convert 'false' to false", () => {
      process.env.TEST_DEBUG = "false";
      const result = validateEnv({ TEST_DEBUG: "boolean" });
      expect(result.TEST_DEBUG).toBe(false);
    });

    it("should handle case-insensitive 'TRUE'", () => {
      process.env.TEST_DEBUG = "TRUE";
      const result = validateEnv({ TEST_DEBUG: "boolean" });
      expect(result.TEST_DEBUG).toBe(true);
    });

    it("should handle case-insensitive 'False'", () => {
      process.env.TEST_DEBUG = "False";
      const result = validateEnv({ TEST_DEBUG: "boolean" });
      expect(result.TEST_DEBUG).toBe(false);
    });

    it("should reject invalid boolean value", () => {
      process.env.TEST_DEBUG = "yes";
      expect(() => {
        validateEnv({ TEST_DEBUG: "boolean" });
      }).toThrow(EnvValidationError);
    });

    it("should reject '1' as boolean", () => {
      process.env.TEST_DEBUG = "1";
      expect(() => {
        validateEnv({ TEST_DEBUG: "boolean" });
      }).toThrow(EnvValidationError);
    });
  });

  // =========================================================================
  // Default values
  // =========================================================================

  describe("default values", () => {
    it("should use string default", () => {
      const result = validateEnv({
        TEST_URL: { type: "string", default: "http://localhost" }
      });
      expect(result.TEST_URL).toBe("http://localhost");
    });

    it("should use number default", () => {
      const result = validateEnv({
        TEST_PORT: { type: "number", default: 3000 }
      });
      expect(result.TEST_PORT).toBe(3000);
    });

    it("should use boolean default", () => {
      const result = validateEnv({
        TEST_DEBUG: { type: "boolean", default: false }
      });
      expect(result.TEST_DEBUG).toBe(false);
    });

    it("should prefer env value over default", () => {
      process.env.TEST_PORT = "8080";
      const result = validateEnv({
        TEST_PORT: { type: "number", default: 3000 }
      });
      expect(result.TEST_PORT).toBe(8080);
    });

    it("should reject string default for number type", () => {
      expect(() => {
        validateEnv({ TEST_PORT: { type: "number", default: "oops" } });
      }).toThrow(TypeError);
    });

    it("should reject number default for string type", () => {
      expect(() => {
        validateEnv({ TEST_NAME: { type: "string", default: 42 } });
      }).toThrow(TypeError);
    });

    it("should reject string default for boolean type", () => {
      expect(() => {
        validateEnv({ TEST_DEBUG: { type: "boolean", default: "true" } });
      }).toThrow(TypeError);
    });

    it("should reject NaN default for number type", () => {
      expect(() => {
        validateEnv({ TEST_PORT: { type: "number", default: NaN } });
      }).toThrow(TypeError);
    });

    it("should reject Infinity default for number type", () => {
      expect(() => {
        validateEnv({ TEST_PORT: { type: "number", default: Infinity } });
      }).toThrow(TypeError);
    });
  });

  // =========================================================================
  // Multiple errors
  // =========================================================================

  describe("multiple errors", () => {
    it("should collect multiple validation errors before throwing", () => {
      expect(() => {
        validateEnv({
          VAR_A: "string",
          VAR_B: "number",
          VAR_C: "boolean"
        });
      }).toThrow(EnvValidationError);

      try {
        validateEnv({
          VAR_A: "string",
          VAR_B: "number",
          VAR_C: "boolean"
        });
      } catch (err) {
        expect(err.errors).toHaveLength(3);
        expect(err.message).toBe("Environment validation failed");
      }
    });
  });

  // =========================================================================
  // Module compatibility
  // =========================================================================

  describe("module compatibility", () => {
    it("should work via ESM import", () => {
      expect(typeof validateEnv).toBe("function");
      expect(typeof EnvValidationError).toBe("function");
      expect(new EnvValidationError([])).toBeInstanceOf(Error);
    });

    it("should work via CommonJS require", () => {
      const cjs = require("../src/index.cjs");
      expect(typeof cjs.validateEnv).toBe("function");
      expect(typeof cjs.EnvValidationError).toBe("function");
      expect(new cjs.EnvValidationError([])).toBeInstanceOf(Error);
    });

    it("should produce identical results from CJS and ESM", () => {
      const cjs = require("../src/index.cjs");
      process.env.TEST_NAME = "Devesh";
      process.env.TEST_PORT = "3000";
      process.env.TEST_DEBUG = "true";

      const schema = {
        TEST_NAME: "string",
        TEST_PORT: "number",
        TEST_DEBUG: "boolean"
      };

      const esmResult = validateEnv(schema);
      const cjsResult = cjs.validateEnv(schema);

      expect(esmResult).toEqual(cjsResult);
    });
  });

  // =========================================================================
  // EnvValidationError
  // =========================================================================

  describe("EnvValidationError", () => {
    it("should be an instance of Error", () => {
      const err = new EnvValidationError(["test error"]);
      expect(err).toBeInstanceOf(Error);
    });

    it("should have correct name", () => {
      const err = new EnvValidationError(["test error"]);
      expect(err.name).toBe("EnvValidationError");
    });

    it("should have errors array", () => {
      const errors = ["VAR_A is required", "VAR_B is required"];
      const err = new EnvValidationError(errors);
      expect(err.errors).toEqual(errors);
    });

    it("should have correct message", () => {
      const err = new EnvValidationError(["test"]);
      expect(err.message).toBe("Environment validation failed");
    });
  });
});
