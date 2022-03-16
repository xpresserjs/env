import fs from "fs";
import dotEnv from "dotenv";
import { expand } from "dotenv-expand";

class EnvRequiredError extends Error {
    constructor(error: string) {
        super(error);
        this.name = "ENV_REQUIRED_ERROR";
    }
}

/**
 * Custom Error class
 */
class EnvError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EnvError";
    }
}

// Types
type StringIsAnyObject = { [key: string]: any };

/**
 * Cast True/False to booleans.
 * @param env
 * @returns {*}
 */
function castBooleans(env: StringIsAnyObject): StringIsAnyObject {
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
 * Load .env file
 * @param path - path to .env file.
 * @param {{castBoolean: boolean, required: []}} config - env options.
 * @returns {*}
 */
export function LoadEnv<ENV = any>(
    path: string,
    config: {
        castBoolean?: boolean;
        required?: any[];
    } = {}
): ENV {
    // Merge config with default values.
    config = {
        castBoolean: true,
        required: [],
        ...config
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
    if (config.castBoolean) env = castBooleans(env);

    /**
     * Check if required environment variables exists
     * else throw error.
     */
    let required = config.required;
    if (required && Array.isArray(required) && required.length) {
        const missing: string[] = [];
        // loop through arrays to find functions
        for (const key of required) {
            // if a function is found, run function and add the data returned to the required array
            if (typeof key === "function") {
                const functionValue: any = key(env);

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
            if (typeof key === "string" && !env.hasOwnProperty(key)) missing.push(key);
        }

        // If it has missing required keys log error and stop process.
        if (missing.length) {
            console.log(); // spacing
            console.error("The following ENV variables are REQUIRED but not found.");
            console.log(missing);
            console.log(); // spacing

            return process.exit(); // stop process
        }
    }

    return env as ENV;
}

/**
 * Env Typed Loader Function
 * @param file - Path to the .env file
 * @param env - Environment Declaration
 * @param required - Required Environment Variables
 * @constructor
 */
export function Env<T extends object>(file: string, env: T, required?: string[]): T {
    let $required = [] as string[];
    // Get the required keys
    for (let [key, rule] of Object.entries(env)) {
        if (["string", "number", "boolean"].includes(rule) || Array.isArray(rule)) {
            if (!$required.includes(key)) $required.push(key);
        }
    }

    if (required) $required = $required.concat(required);

    // Load the .env file
    const data = LoadEnv(file, { castBoolean: false, required: $required });

    // Validate the data
    for (const [key, rule] of Object.entries(env)) {
        let value = data[key];

        // if empty string, set to undefined
        if (value === "") value = undefined;

        if (Array.isArray(rule)) {
            // Validate Enum
            if (!rule.includes(value)) {
                throw new EnvError(
                    `${key} must be one of the following: [${rule.join(", ")}]`
                );
            }
        }

        // Validate Rule Type
        else if (typeof rule === "string") {
            // Validate for number
            if (rule === "number") {
                if (isNaN(value)) {
                    throw new EnvError(`${key} must be a number`);
                }

                // Cast to number
                value = Number(value);
            }
            // Validate for boolean
            else if (rule === "boolean") {
                if (!["string", "boolean"].includes(typeof value))
                    throw new EnvError(`${key} must be a boolean`);

                // Cast to boolean
                value =
                    value === "true" ||
                    value === "TRUE" ||
                    value === "1" ||
                    value === 1 ||
                    value === true;
            }
            // Validate for string
            else if (rule === "string") {
                if (typeof value !== "string")
                    throw new EnvError(`${key} must be a string`);

                // Cast to string and trim
                value = String(value).trim();

                // Validate for string length
                if (value.length === 0) throw new EnvError(`${key} must not be empty`);
            }
            // validate for optional string
            else if (rule === "string?") {
                if (value !== undefined) {
                    // Cast to string and trim
                    value = String(value).trim();

                    // Validate for string length
                    if (value.length === 0)
                        throw new EnvError(`${key} must not be empty`);
                }
            }
            // Validate for optional number
            else if (rule === "number?") {
                if (value !== undefined) {
                    if (isNaN(value)) {
                        throw new EnvError(`${key} must be a number`);
                    }

                    // Cast to number
                    value = Number(value);
                }
            } else {
                // test if is valid json
                // A valid json means that the type is an enum?
                let $enum = undefined;

                try {
                    $enum = JSON.parse(rule);
                } catch (e) {
                    throw new EnvError(`${key} must be a valid rule`);
                }

                if ($enum) {
                    if (!Array.isArray($enum))
                        throw new EnvError(`${key} enum must be an array`);

                    if (!$enum.includes(value)) {
                        throw new EnvError(
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
    string() {
        return "string" as Partial<string>;
    },

    number() {
        return "number" as unknown as number;
    },

    boolean() {
        return "boolean" as unknown as boolean;
    },

    enum<T extends string[] | readonly string[]>(options: T) {
        return options as unknown as T[number];
    }
};

// Extend Function: Add `optional` Method for optional types
Env.optional = {
    string() {
        return "string?" as string | undefined;
    },

    number() {
        return "number?" as unknown as number | undefined;
    },

    enum<T extends string[] | readonly string[]>(options: T) {
        return JSON.stringify(options) as unknown as T[number] | undefined;
    }
};
