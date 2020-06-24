const fs = require("fs");
const dotEnv = require("dotenv");
const dotEnvExpand = require("dotenv-expand");

// Types
type StringIsAnyObject = { [key: string]: any };

/**
 * Cast True/False to booleans.
 * @param env
 * @returns {*}
 */
const castBooleans = (env: StringIsAnyObject): StringIsAnyObject => {
    // Get Keys of each env variable.
    const envKeys: string[] = Object.keys(env);

    // Loop through Each envKey and cast 'true'=true or 'false'=false
    for (let i = 0; i < envKeys.length; i++) {
        const envKey: string = envKeys[i];
        const envVal = env[envKey].toLowerCase();

        if (envVal === 'true') {
            env[envKey] = true;
        } else if (envVal === 'false') {
            env[envKey] = false;
        }
    }

    return env;
};

/**
 * Load .env file
 * @param path - path to .env file.
 * @param {{castBoolean: boolean, required: []}} config - env options.
 * @returns {*}
 */
export = (path: string, config: {
    castBoolean?: boolean,
    required?: []
} = {}) => {

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
    let env = dotEnvExpand(dotEnv.config({path})).parsed;

    // Cast string to booleans if castBoolean is set to true.
    if (config.castBoolean) env = castBooleans(env);

    /**
     * Check if required environment variables exists
     * else throw error.
     */
    const required = config.required;
    if (required && Array.isArray(required) && required.length) {

        const missing: string[] = [];
        // loop through required array and add missing keys in missing array.
        for (const key of required) {
            if (!env.hasOwnProperty(key)) missing.push(key);
        }

        // If has missing required keys log error and stop process.
        if (missing.length) {
            console.log(); // spacing
            console.error('The following ENV variables are REQUIRED but not found.');
            console.log(missing);
            console.log(); // spacing

            return process.exit(); // stop process
        }
    }

    return env;
};