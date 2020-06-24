const envLoader = require('../js');
const env = envLoader(__dirname + '/local.env', {
    castBoolean: true,
    required: ['ApiKey']
});

console.log(env)