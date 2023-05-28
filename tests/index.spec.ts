import test from "japa";
import { Env, LoadEnv } from "../index";

// Declare Path to env
const envPath = __dirname + "/local.env";

test.group("LoadEnv", () => {
    test("Should load env", (assert) => {
        const env = LoadEnv(envPath);

        assert.isObject(env);

        assert.deepEqual(env, {
            APP_DOMAIN: "localhost",
            APP_FOLDER: "/blog",
            APP_PORT: "3000",
            APP_URL: ":",
            CONNECT_TO_API: true
        });
    });

    test.failing("Should throw error if missing required keys", () => {
        LoadEnv(envPath, {
            required: ["API_KEY"],
            endProcess: false
        });
    });

    test.failing("Required with conditions", () => {
        LoadEnv(envPath, {
            required: [
                (envs) => {
                    return envs["CONNECT_TO_API"] === true
                        ? ["API_KEY", "SOME_OTHER_KEY"]
                        : false;
                }
            ],
            endProcess: false
        });
    });

    test("castBoolean: false", (assert) => {
        const env = LoadEnv(envPath, { castBoolean: false });

        assert.isObject(env);
        assert.isString(env.CONNECT_TO_API);
        assert.equal(env.CONNECT_TO_API, "true");
    });

    test("Allow Absent env file", (assert) => {
        const env = LoadEnv(null, {
            castBoolean: false,
            fileIsOptional: true
        });

        // return empty object
        assert.deepEqual(env, {});
    });

    test("Allow Absent env file with Schema", (assert) => {
        process.env.APP_DOMAIN = "localhost";

        const env = Env(null, { APP_DOMAIN: Env.is.string() }, { useProcessEnv: true });

        // return empty object
        // assert.deepEqual(env, {});
        console.log(env);
    });
});

test.group("Env", () => {
    test("Should load env", (assert) => {
        const env = Env(envPath, {
            APP_DOMAIN: Env.is.string(),
            APP_FOLDER: Env.is.string(),
            APP_PORT: Env.is.number(),
            APP_URL: Env.is.string(),
            CONNECT_TO_API: Env.is.boolean()
        });

        assert.isObject(env);
        assert.deepEqual(env, {
            APP_DOMAIN: "localhost",
            APP_FOLDER: "/blog",
            APP_PORT: 3000,
            APP_URL: ":",
            CONNECT_TO_API: true
        });
    });

    test.failing("Should throw error if missing required keys", (assert) => {
        Env(
            envPath,
            {
                API_KEY: Env.is.string()
            },
            { endProcess: false }
        );
    });

    test.failing("Required with conditions", () => {
        Env(
            envPath,
            {
                CONNECT_TO_API: Env.is.boolean()
            },
            {
                required: [
                    (envs) => {
                        return envs["CONNECT_TO_API"] === true
                            ? ["API_KEY", "SOME_OTHER_KEY"]
                            : false;
                    }
                ],
                endProcess: false
            }
        );
    });

    test("Env with expose true", (assert) => {
        const env = Env(
            envPath,
            {
                APP_DOMAIN: Env.is.string(),
                APP_FOLDER: Env.is.string(),
                APP_PORT: Env.is.number(),
                APP_URL: Env.is.string(),
                CONNECT_TO_API: Env.is.boolean(),
                CONNECT_TO_TO: Env.optional.string("d")
            },
            { expose: true }
        );

        assert.isTrue(Object.keys(env).every((key) => process.env.hasOwnProperty(key)));
    });
});
