import fs from "fs";
import dotEnv from "dotenv";
import { expand } from "dotenv-expand";
import { EOL } from "os";

type Rule = {
    def: any;
    type: string | any[];
};

type RequiredEnvs<T> = (
    | string
    | ((env: Record<keyof T, any>) => string | string[] | false)
)[];

class EnvRequiredError extends Error {
    public missing: string[];

    constructor(error: string) {
        super(error);
        this.name = "ENV_REQUIRED_ERROR";
        this.missing = [];
    }
}

/**
 * Custom Error class
 */
class EnvSchemaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ENV_SCHEMA_ERROR";
    }
}

/**
 * Cast True/False to booleans.
 * @param env
 * @returns {*}
 */
function castBooleans(env: Record<string, any>) {
    // Get Keys of each env variable.
    const envKeys: string[] = Object.keys(env);

    // Loop through Each envKey and cast 'true'=true or 'false'=false
    for (let i = 0; i < envKeys.length; i++) {
        const envKey: string = envKeys[i];
        const envVal = env[envKey].toLowerCase();

        if (envVal === "true") {
            env[envKey] = true;
        } else if (envVal === "false") {
            env[envKey] = false;
        }
    }

    return env;
}

/**
 * Check RequiredKeys
 * @param envs
 * @param options
 */
function checkRequiredKeys<T extends Record<string, any>>(
    envs: T,
    options: { required?: RequiredEnvs<T>; endProcess?: boolean }
) {
    let required = options.required;
    if (required && Array.isArray(required) && required.length) {
        const missing: string[] = [];

        // loop through arrays to find functions
        for (const key of required) {
            // if a function is found, run function and add the data returned to the required array
            if (typeof key === "function") {
                const functionValue: any = key(envs);

                if (functionValue !== undefined) {
                    // check the type of value returned
                    const functionValueIsString = typeof functionValue === "string";
                    const functionValueIsArray =
                        !functionValueIsString && Array.isArray(functionValue);

                    if (
                        functionValue !== false &&
                        !functionValueIsString &&
                        !functionValueIsArray
                    ) {
                        throw new EnvRequiredError(
                            "Function in {required} array must return either type: (String | Array | False)"
                        );
                    }

                    /**
                     * If functionValue is string, add to required array
                     * Else if is an array, merge into required array
                     */
                    if (functionValueIsString) {
                        required.push(functionValue);
                    } else if (functionValueIsArray) {
                        required = <string[]>required.concat(functionValue);
                    }
                }
            }
        }

        // loop through required array and add missing keys in missing array.
        for (const key of required) {
            if (typeof key === "string" && !envs.hasOwnProperty(key)) missing.push(key);
        }

        // If it has missing required keys log error and stop process.
        if (missing.length) {
            if (options.endProcess) {
                console.log(); // spacing
                console.error("The following ENV variables are REQUIRED but not found!");
                console.log(missing);
                console.log(); // spacing

                return process.exit(); // stop process
            } else {
                const error = new EnvRequiredError(
                    `The following ENV variables are REQUIRED but not found: ${EOL} [${missing.join(
                        ", "
                    )}] ${EOL}`
                );

                error.missing = missing;

                throw error;
            }
        }
    }
}

/**
 * Load .env file
 * @param path - path to .env file.
 * @param options - env options.
 * @returns {*}
 */
function LoadEnv<T extends Record<string, any>>(
    path: string,
    options: {
        castBoolean?: boolean;
        required?: RequiredEnvs<T>;
        endProcess?: boolean;
    } = {}
): T {
    // Merge config with default values.
    options = {
        castBoolean: true,
        required: [],
        endProcess: true,
        ...options
    };

    // Check if env path exists.
    if (!fs.existsSync(path)) {
        throw new Error(`Env file: {${path}} does not exists!`);
    }

    // If path is a directory, automatically add '.env' to it.
    let isDir = false;
    if (fs.lstatSync(path).isDirectory()) {
        path = path + "/.env";
        isDir = true;
    }

    // If path is a directory, Recheck if path.env exists
    if (isDir && !fs.existsSync(path)) {
        throw new Error(`Env file: {${path}} does not exists!`);
    }

    /**
     * Get parsed env variables
     * @type {{}}
     */
    let env = expand(dotEnv.config({ path })).parsed as any;

    // Cast string to booleans if castBoolean is set to true.
    if (options.castBoolean) env = castBooleans(env);

    /**
     * Check if required environment variables exists
     * else throw error.
     */
    checkRequiredKeys(env, options);

    return env as T;
}

/**
 * Env Typed Loader Function
 * @param file - Path to the .env file
 * @param schema - Environment Declaration
 * @param options
 * @constructor
 */

function Env<T>(
    file: string,
    schema: T,
    options: {
        required?: RequiredEnvs<T>;
        endProcess?: boolean;
    } = {}
): T {
    // Set default options
    options = {
        endProcess: true,
        ...options
    };

    let $required: RequiredEnvs<T> = [];

    // Get the required keys
    for (let [key, rule] of Object.entries(schema)) {
        const { type, def } = rule as Rule;
        if (def !== undefined) continue;

        if (
            ["string", "number", "boolean"].includes(type as string) ||
            Array.isArray(type as string)
        ) {
            if (!$required.includes(key)) $required.push(key);
        }
    }

    if (options.required) $required = $required.concat(options.required);

    // Load the .env file
    const data = LoadEnv(file, {
        castBoolean: true,
        required: $required,
        endProcess: options.endProcess
    }) as any;

    // Validate the data
    for (const [key, $rule] of Object.entries(schema)) {
        const { def, type } = $rule as Rule;

        let value = data[key];

        // if empty string, set to undefined
        if ((!value && typeof value !== "boolean") || value === "") value = def;

        if (Array.isArray(type)) {
            // Validate Enum
            if (!type.includes(value)) {
                throw new EnvSchemaError(
                    `${key} must be one of the following: [${type.join(", ")}]`
                );
            }
        }

        // Validate Rule Type
        else {
            // Validate for number
            if (type === "number") {
                if (isNaN(value)) {
                    throw new EnvSchemaError(`${key} must be a number`);
                }

                // Cast to number
                value = Number(value);
            }
            // Validate for boolean
            else if (type === "boolean") {
                if (!["string", "boolean"].includes(typeof value))
                    throw new EnvSchemaError(`${key} must be a boolean`);

                // Cast to boolean
                value =
                    value === "true" ||
                    value === "TRUE" ||
                    value === "1" ||
                    value === 1 ||
                    value === true;
            }
            // Validate for string
            else if (type === "string") {
                if (typeof value !== "string")
                    throw new EnvSchemaError(`${key} must be a string`);

                // Cast to string and trim
                value = String(value).trim();

                // Validate for string length
                if (value.length === 0)
                    throw new EnvSchemaError(`${key} must not be empty`);
            }
            // validate for optional string
            else if (type === "string?") {
                if (value !== undefined) {
                    // Cast to string and trim
                    value = String(value).trim();

                    // Validate for string length
                    if (value.length === 0)
                        throw new EnvSchemaError(`${key} must not be empty`);
                }
            }
            // Validate for optional number
            else if (type === "number?") {
                if (value !== undefined) {
                    if (isNaN(value)) {
                        throw new EnvSchemaError(`${key} must be a valid number`);
                    }

                    // Cast to number
                    value = Number(value);
                }
            } else {
                // test if is valid json
                // A valid json means that the type is an enum?
                let $enum = undefined;

                try {
                    $enum = JSON.parse(type);
                } catch (e) {
                    throw new EnvSchemaError(`${key} must be a valid Env schema rule`);
                }

                if ($enum) {
                    if (!Array.isArray($enum))
                        throw new EnvSchemaError(`${key} enum must be an array`);

                    if (!$enum.includes(value)) {
                        throw new EnvSchemaError(
                            `${key} must be one of the following: [${$enum.join(", ")}]`
                        );
                    }
                }
            }
        }

        data[key] = value;
    }

    return data as T;
}

// Extend Function: Add `is` Method for required types
Env.is = {
    string(def?: string) {
        return { def, type: "string" } as unknown as string;
    },

    number(def?: number) {
        return { def, type: "number" } as unknown as number;
    },

    boolean(def?: boolean) {
        return { def, type: "boolean" } as unknown as boolean;
    },

    enum<T extends any[] | readonly any[]>(options: T, def?: T[number]) {
        return { def, type: options } as unknown as T[number];
    }
};

// Extend Function: Add `optional` Method for optional types
Env.optional = {
    string(def?: string) {
        return { def, type: "string?" } as unknown as string | undefined;
    },

    number(def?: number) {
        return { def, type: "number?" } as unknown as number | undefined;
    },

    enum<T extends any[] | readonly any[]>(options: T, def?: T[number]) {
        return { def, type: JSON.stringify(options) } as unknown as T[number] | undefined;
    }
};

export { LoadEnv, Env };
