# Xpresser/Env
##### This package can be used in any NodeJs related project.

- Loads your env file.
- Interpolates environment variables.
- Cast strings to boolean.
- Checks for required env variables.
- Validate env variables.


## Installation
```shell
npm i @xpresser/env@next
# OR
yarn add @xpresser/env@next
```

## Functions
Two functions are exported by the package.

- `LoadEnv` - Loads your env file with option for required keys (without validation).
- `Env` - Loads and validates your environment variables with a simple schema. (Typescript Friendly)

## Example File
Using this example **local.env** file

```dotenv
APP_DOMAIN=localhost
APP_FOLDER="/blog"
APP_PORT=3000
APP_URL="${AppDomain}:${AppPort}${AppFolder}"

CONNECT_TO_API=true
#API_KEY="somekey"
```

### LoadEnv
The `LoadEnv` function accepts the `path` to the env file as first argument and `options` object as the second argument.
The options object can have the following properties:

| Key           | Type      | Default | Description                                                                                                                                    |
|---------------|-----------|---------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `castBoolean` | `Boolean` | `true`  | if enabled, all string "true" or "false" will be converted to booleans.                                                                        |
| `required`    | `Array`   | `[]`    | The env loader will check if all the keys defined in this array exists in your specified env file else it stops the process and logs an error. |
| `endProcess`  | `Boolean` | `true`  | By default `process.exit()` is called when required keys are **missing**. to throw Error instead, set this to false.                           |


```javascript
const {LoadEnv} = require('@xpresser/env');
const env = LoadEnv('path/to/local.env', {
    castBoolean: true,
    required: ['API_KEY']
});

console.log(env);
```
##### Result:
```sh
The following ENV variables are REQUIRED but not found.
[ 'API_KEY' ]
```
If you uncomment the `API_KEY` line in your env file, your result will be
```
{
  APP_DOMAIN: 'localhost',
  APP_FOLDER: '/blog',
  APP_PORT: '3000',
  APP_URL: 'localhost:3000/blog',
  CONNECT_TO_API: true,
  API_KEY: 'somekey'
}
```

### Env
The `Env` function accepts the
  - `path` to the env file as first argument, 
  - `schema` object as the second argument 
  - `options` object as the third argument.

The options object can have the following properties:

| Key           | Type      | Default | Description                                                                                                                                    |
|---------------|-----------|---------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `required`    | `Array`   | `[]`    | The env loader will check if all the keys defined in this array exists in your specified env file else it stops the process and logs an error. |
| `endProcess`  | `Boolean` | `true`  | By default `process.exit()` is called when required keys are **missing**. to throw Error instead, set this to false.                           |


Note: The `options` object does not include the `castBoolean` property like the `LoadEnv` function.
This is because the `Env` schema requires and sets `castBoolean` to be **true**


```javascript
const {Env}  = require('@xpresser/env');

const env = Env('path/to/local.env', {
    APP_DOMAIN: Env.is.string('Localhost'), // can have defaults
    APP_FOLDER: Env.is.string(),
    APP_PORT: Env.is.number(3000),
    APP_URL: Env.is.string(),
    CONNECT_TO_API: Env.is.boolean(),
    // optional envs
    API_KEY: Env.optional.string()
});

// `env` will be typed and validated.
```

### Required Conditions
The required array also accepts functions to evaluate conditions.
For example, we want to require `API_KEY` only when: `CONNECT_TO_API===true`

```javascript
const {LoadEnv, Env} = require('@xpresser/env');

const required = [
     'CONNECT_TO_API',
     (envs) => {
         if (envs['CONNECT_TO_API'] === true) {
             return 'API_KEY';
         }
     }   
 ]

const env = envLoader('path/to/local.env', {required});
// OR
const env = Env('path/to/local.env', {
  // declare env variables schema
}, {required})

console.log(env);
```
This will check if `API_KEY` exists only if `CONNECT_TO_API` is true.
You can add as many functions as you want. The loader will run all of them and add returned values to the `required` array.

**Note:** The function can also return an array of strings. the loader will concatenate the strings with the required array.
