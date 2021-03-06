# Xpresser/Env
##### This package can be used in any project, must not be xpresser framework related.

1. Loads your env file.
2. Interpolates environment variables.
3. Cast strings to boolean.
4. Checks for required env variables.

### Config
The envLoader function accepts the `path` to the env  file as first argument and `config` object as the second argument.

| Key | Type | Default | Description |
| --- | ---- | ------- | ----------- |
| castBoolean | `Boolean` | `true` | if enabled, all string "true" or "false" will be converted to booleans.
| required | `Array` | `[]` | The env loader will check if all the keys defined in this array exists in your specified env file else it stops the process and logs an error. |


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
const envLoader = require('@xpresser/env');
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
```
{
  AppDomain: 'localhost',
  AppFolder: '/blog',
  AppPort: '3000',
  AppUrl: 'localhost:3000/blog',
  ConnectToApi: true,
  ApiKey: 'somekey'
}
```
#### Required Conditions
The required array also accepts functions to evaluate conditions.
For example, we want to require `ApiKey` only when: `ConnectToApi===true`
```javascript
const envLoader = require('@xpresser/env');
const env = envLoader('path/to/local.env', {
    castBoolean: true,
    required: [
        'ConnectToApi',
        (envs) => {
            if (envs['ConnectToApi'] === true) {
                return 'ApiKey'
            }
        }   
    ]
});

console.log(env);
```
This will check if `Apikey` exists only if `ConnectToApi` is true.
You can add as many functions as you want. The loader will run all of them and add returned values to the `required` array.

**Note:** The function can also return an array of strings. the loader will concatenate the strings with the required array.
