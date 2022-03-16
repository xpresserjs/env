const { LoadEnv, Env } = require("../index");

// const loadedEnv = LoadEnv(__dirname + "/local.env", {
//     castBoolean: true,
//     required: [
//         // (envs) => envs['ConnectToApi'] === true ? ['ApiKey', 'Something'] : false
//     ]
// });

const env = Env(__dirname + "/local.env", {
    APP_DOMAIN: Env.is.string("localhost"),
    APP_FOLDER: Env.is.string(),
    APP_PORT: Env.is.number(),
    APP_URL: Env.is.string(),

    CONNECT_TO_API: Env.is.boolean(false),
    API_KEY: Env.is.string("hello")
});

console.log(env);
