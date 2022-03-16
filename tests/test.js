const { LoadEnv, Env } = require("../index");

const loadedEnv = LoadEnv(__dirname + "/local.env", {
    castBoolean: true,
    required: [
        // (envs) => envs['ConnectToApi'] === true ? ['ApiKey', 'Something'] : false
    ]
});

const env = Env(__dirname + "/local.env", {
    APP_DOMAIN: Env.is.string()
});

console.log(loadedEnv);
console.log(env.APP_DOMAIN);
