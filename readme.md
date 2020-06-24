# Xpresser/Env
##### This package can be used by in any project.

1. Loads your env file.
2. Interpolates environment variables.
3. Cast strings to boolean.
4. Checks for required env variables.

### Example
Using this **local.env** file
```dotenv
AppDomain=localhost
AppFolder="/blog"
AppPort=3000
AppUrl="${AppDomain}:${AppPort}${AppFolder}"

ConnectToApi=true
#ApiKey="somekey"
```

In env.js
```javascript
const envLoader = require('./js/index');
const env = envLoader('path/to/local.env', {
    castBoolean: true,
    required: ['ApiKey']
});

console.log(env);
```
Result.
```sh
The following ENV variables are REQUIRED but not found.
[ 'ApiKey' ]
```
If you uncomment the `ApiKey` line in your env file, your result will be
```json
{
  "AppDomain": "localhost",
  "AppFolder": "/blog",
  "AppPort": "3000",
  "AppUrl": "localhost:3000/blog",
  "ConnectToApi": true,
  "ApiKey": "somekey"
}
```

### Config
The envLoader function accepts the `path` to the env  file as first argument and `config` object as the second argument.

| Key | Type | Default | Description |
| --- | ---- | ------- | ----------- |
| castBoolean | `Boolean` | `true` | if enabled, all string "true" or "false" will be converted to booleans.
| required | `Array` | `[]` | The env loader will check if all the keys defined in this array exists in your specified env file else it stops the process and logs an error. |

