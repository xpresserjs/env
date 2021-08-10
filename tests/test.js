const envLoader = require('../js');
const env = envLoader(__dirname + '/local.env', {
    castBoolean: true,
    required: [
        // (envs) => envs['ConnectToApi'] === true ? ['ApiKey', 'Something'] : false
    ]
});

console.log(env)