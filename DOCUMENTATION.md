# Documentation 
 
## Table of Contents

* [API Tools](#api-tools)
  * [General](#general)
    * [createLogger](#createlogger)
    * [createCallContext](#createcallcontext)
    * [createServiceLocator](#createservicelocator)
    * [createFieldSelector](#createfieldselector)
    * [createBaseResponse](#createbaseresponse)
  * [Time services](#time-services)
    * [createFixedTimeService](#createfixedtimeservice)
    * [createCurrentTimeService](#createcurrenttimeservice)
  * [Number](#number)
    * [number.isInt32](#numberisint32)
    * [number.parseInt32](#numberparseint32)
    * [number.isFloat](#numberisfloat)
    * [number.parseFloat](#numberparsefloat)
  * [UUID](#uuid)
    * [uuid.isUuid](#uuidisuuid)
  * [Date](#date)
    * [date.isDate](#dateisdate)
    * [date.parseDate](#dateparsedate)
  * [Express](#express)
    * [express.createCallContextMiddleware](#expresscreatecallcontextmiddleware)
    * [express.createMorganMiddleware](#expresscreatemorganmiddleware)
    * [express.createLowercaseQueryMiddleware](#expresscreatelowercasequerymiddleware)
    * [express.createTrimQueryValueMiddleware](#expresscreatetrimqueryvaluemiddleware)
  * [Promise](#promise)
    * [promise.any](#promiseany)
  * [Cassandra](#cassandra)
    * [cassandra.cql](#cassandracql)
    * [cassandra.client](#cassandraclient)
    * [cassandra.consistencies](#cassandraconsistencies)
    * [cassandra.createBatchQueryBuilder](#cassandracreatebatchquerybuilder)
    * [cassandra.converter.map](#cassandraconvertermap)
* [Commands](#commands)
  * [license](#license)

----

## API Tools

----

### General

This section describes general use tools that can solve common needs of Node.js applications.

#### `createLogger`
Creates a [Bunyan](https://github.com/trentm/node-bunyan) logger, which works with log levels and has a really flexible [logging style](https://github.com/trentm/node-bunyan#log-method-api).

This function takes an options object which accepts the properties described in the table below.

| Property     | Type | Required | Description                                       | Default value                        |
| ------------ |-|-| ---------------------------------------------------- | ------------------------------------ |
| `name`         | string | No | The name of the application. | `app log name`|
| `logLevels`    | string array | No | The log levels that will be sent to the output. Messages logged in other levels will be ignored. The levels are `fatal`, `error`, `warn`, `info`, `debug` and `trace.` | [`fatal`, `error`, `warn`, `info`] |
| `logOutput`    | string | No | The log output type. For using the standard output, specify `standard-streams`. For saving logs in a file system folder, specify `rotating-file`.| `standard-streams`|
| `logDirectory` | string | No | The directory in which logs files must be stored (relative to the application start directory). This parameter is only used if the selected log output is `rotating-file`. | `./logs`|

```javascript
const tools = require('itaas-nodejs-tools');

let logger = tools.createLogger({
  name: 'your-app',
  logLevels: ['fatal', 'error', 'warn'],
  logOutput: 'rotating-file',
  logDirectory: './logs'
});

logger.error('A terrible error has occurred!'); // logged in "./logs"
logger.info('Doing everyday things'); // not logged because info level is not enabled
```

#### `createServiceLocator`
Creates an empty service locator.

A service locator is a collection of keys and values with the specific purpose of acting as a dependency injection tool.

Constructing an application in a layer-based structure lets you easily replace layers (depending on business rules, or for test purposes), and the service locator helps with that by keeping references to layer implementations.

```javascript
const tools = require('itaas-nodejs-tools');

class UserService {
  getUser(id) {
    // complicated requests and database queries
    return user;
  }
}

class MockUserService{
  getUser(id){
    let user = fakeUsersInMemory[id];
    return user;
  }
}

let serviceLocator = tools.createServiceLocator();

// for application setup
serviceLocator.addService('user-service', new UserService());

// for unit test setup
serviceLocator.addService('user-service', new MockUserService());

// for either of the above, the code that uses the service is the same
let userService = serviceLocator.getService('user-service');
userService.getUser(id);
```

#### `createCallContext`
Creates a call context with configuration, logger and service locator for a single request or execution.

Call context is one of the most important concepts of iTaaS components. It concentrates generally useful things in a single object, which should be passed around as a parameter throughout the execution.

| Parameter      | Type | Required | Description | Default value |
| -------------- | ---- | --------- | ---------- | ------------- |
| `callId`         | string | Yes      | A unique ID for the request/execution. It is useful to identify the request/execution in logs. | - |
| `config`         | object | Yes      | An object containing all settings your application needs. | - |
| `logger`         | object | Yes      | A logger for the request/execution. See [createLogger](#createlogger). | - |
| `serviceLocator` | object | Yes      | A service locator for the request/execution. See [createServiceLocator](#createservicelocator). | - |

```javascript
const tools = require('itaas-nodejs-tools');
const uuid = require('uuid').v4;

let callId = uuid();
let config = { key: "value" };
let logger = tools.createLogger();
let serviceLocator = tools.createServiceLocator();

let context = tools.createCallContext(callId, config, logger, serviceLocator);
```

*Using a call context*
```javascript
function anyFunction(context /* , otherParameters, ... */) {

  console.log(context.callId); // some UUID

  console.log(context.config.key); // "value"

  context.logger.info('Now I can log anywhere in the code!');

  context.serviceLocator.getService('service-accessible-anywhere');

  otherFunction(context /* , otherParameters, ... */);

}
```

#### `createFieldSelector`

Creates a field selector, a tool that selects properties recursively in a Javascript object, creating a new object with only the selected properties.

The only parameter is a string description of the properties which must be selected, with a specific syntax. The created selector has a function `select`, whose single parameter is the source object to select properties from.

**Notes**
* Properties are case-insensitive and must be separated by comma (`,`)
* Nested properties can be selected by joining the property names with dots (`.`)
* Properties or nested properties that don't exist will never cause an error
* Selections on arrays are done for each of their elements.

```javascript
const tools = require('itaas-nodejs-tools');

let source = {
  name: 'Don Vito Corleone',
  age: 53,
  address: {
    country: 'United States',
    city: 'New York',
    street: { name: 'Mott Street', postalCode: '10012' }
  },
  actors: [
    { name: 'Robert De Niro', startAge: 25, endAge: 31 },
    { name: 'Marlon Brando', startAge: 53, endAge: 63 }
  ]
};

let selector = tools.createFieldSelector('address.city,address.street.postalCode,potato,actors.name');
let selection = selector.select(source); 

console.log(selection);
  /* {
  address: {
    city: 'New York'
    street: { postalCode: '10012' }
  },
  actors: [
    { name: 'Robert De Niro' },
    { name: 'Marlon Brando' }
  ]
} */
```  

The field selector is particularly useful for letting application clients choose which fields of the resource they want returned. A query string parameter can be exposed for that purpose.

```
GET /users/1234?fields=name

{
  "name": "Michael Jackson"
}


GET /users/1234?fields=name,job

{
  "name": "Michael Jackson",
  "job": "musician"
}
```

#### `createBaseResponse` // TODO: remove this from Tools?
This class should be used to return all responses. Please does not change/add any attribute from it. This will allow the build from typed languages clients easier

| Property     | Mandatory | Definition                               |
| ------------ | --------- | ---------------------------------------- |
| status       | true      | Mnemonic Message.                        |
| message      | true      | Descritive message.                      |
| result       | false     | Result from call. It should be an object |
| error        | false     | Error from call. It should be an object  |

```javascript
const tools = require('itaas-nodejs-tools');
let response = tools.createBaseResponse('MNEMONIC_MESSAGE', 'Descritive message from result', { a: 1, b: 2 });

/* *********************
 * Result
 * *********************
{
  'status' : 'MNEMONIC_MESSAGE',
  'message' : 'Descritive message from result',
  'result' : { a: 1, b: 2 },
  'error' : undefined
} 
 * *********************/
```

----

### Time services

The time services from iTaaS Node.js Tools are objects with a `getNow` parameterless function which returns a Javascript Date object.

You can easily replace a time service using a [service locator](#createservicelocator).

You can implement your own time services, but iTaaS Node.js Tools provides two simple ones for convenience.

#### `createFixedTimeService`
Creates a time service which always responds the specified date.
It is useful for testing applications with time-related rules, such as token expiration, resource expiration, date filters, etc.

```javascript
const tools = require('itaas-nodejs-tools');

let fixedTimeService = tools.createFixedTimeService(new Date('2016-06-27T04:54:32Z'));

let now = fixedTimeService.getNow();

console.log(now.toISOString());
// "2016-06-27T04:54:32Z"
```

#### `createCurrentTimeService`
Creates a time service which responds the current date.

```javascript
const tools = require('itaas-nodejs-tools');

let currentTimeService = tools.createCurrentTimeService();

let now = currentTimeService.getNow();

console.log(now.toISOString());
// <current date in ISO-8601 format>
```

----

### `number`

Under `number`, there are some handy functions for interpreting numbers, which sometimes reach the application as strings.

#### `number.isInt32`

Returns `true` if the parameter is a 32-bit integer or a string that can be parsed into a 32-bit integer, `false` otherwise.

```javascript
const tools = require('itaas-nodejs-tools');

console.log(tools.number.isInt32(-2147483648)); // true
console.log(tools.number.isInt32('10'));        // true

console.log(tools.number.isInt32('eleven'));    // false
console.log(tools.number.isInt32(1.2));         // false
```

#### `number.parseInt32`

Returns the integer value of the parameter if it's acceptable by `isInt32`, throws an `Error` otherwise.

```javascript
const tools = require('itaas-nodejs-tools');

console.log(tools.number.parseInt32('10'));     // 10

tools.number.parseInt32('eleven'); // Error!
```

#### `number.isFloat`

Returns `true` if the parameter is a single-precision floating point number or a string that can be parsed into a single-precision floating point number, `false` otherwise.

```javascript
const tools = require('itaas-nodejs-tools');

console.log(tools.number.isFloat('10'));      // true
console.log(tools.number.isFloat('1.2'));     // true

console.log(tools.number.isFloat('eleven'));  // false
```

#### `number.parseFloat`

Returns the float value of the parameter if it's acceptable by `isFloat`, throws an `Error` otherwise.

```javascript
const tools = require('itaas-nodejs-tools');

console.log(tools.number.parseFloat('1.2'));    // 1,2

tools.number.parseFloat('eleven'); // Error!
```

----

### `uuid`

Under `uuid`, there are UUID validation functions.

#### `uuid.isUuid`

Returns `true` if the string is a valid UUID, `false` otherwise.

```javascript
const tools = require('itaas-nodejs-tools');

console.log(tools.uuid.isUuid('6423df02-340c-11e6-ac61-9e71128cae77')); // true

console.log(tools.uuid.isUuid(null));                                   // false
console.log(tools.uuid.isUuid('this is not a UUID'));                   // false
console.log(tools.uuid.isUuid('6423df02340c11e6ac619e71128cae77'));     // false
```

----

### `date`

Under `date`, there are some handy functions for interpreting dates, which often reach the application as strings.

**Important**: these functions only accept the [ISO 8601] format and use [Moment](https://github.com/moment/moment) strictly to validate and parse dates in that format.

#### `date.isDate`

Returns `true` if the parameter is a valid Javascript `Date` object or a string in ISO 8601 date format, `false` otherwise.

```javascript
const tools = require('itaas-nodejs-tools');

console.log(tools.date.isDate(new Date()));             // true
console.log(tools.date.isDate('2016-06-24T23:56:37Z')); // true
console.log(tools.date.isDate('2016-06-24 23:56'));     // true
console.log(tools.date.isDate('2016-06-24'));           // true

console.log(tools.date.isDate(new Date('random')));     // false
console.log(tools.date.isDate(null))                    // false
console.log(tools.date.isDate('24/06/2016 23:56:37'));  // false
console.log(tools.date.isDate('2016-24-06'));           // false
```

#### `date.parseDate`

Returns a Javascript `Date` object equivalent to the parameter if it's acceptable by `isDate`, throws an `Error` otherwise.

```javascript
const tools = require('itaas-nodejs-tools');

let date = tools.date.parseDate('2016-06-24 23:56');
console.log(date.toISOString());    // 2016-06-24T23:56:00.000Z

tools.date.parseDate('2016-24-06'); // Error!
tools.date.parseDate(null);         // Error!
```

----

## `express`

This section contains middlewares for APIs built on top of [Express](https://github.com/expressjs/express), one of the most popular web frameworks for Node.js.

### `express.createCallContextMiddleware`

Returns an Express middleware that creates a [call context](#createcallcontext) for each request received.

In order to make the context available to other middlewares and to all routes, this should be the first middleware in the middleware stack and it should be applied globally, not just to a path.

This function accepts these parameters:

| Parameter | Type | Required | Description | Default value |
|-----------|------|----------|-------------|---------------|
| config | object | Yes | An object containing the application configuration | - |
| logger | logger | Yes | A logger created by [createLogger](#createlogger) for the application. | - |
| serviceLocator | service locator | Yes | A service locator created by [createServiceLocator](#createservicelocator) | - |
| setContext | function | Yes | Function that will store the context somewhere of your choice. It must have 3 parameters: the first is the `req` from Express, the second is `res`, and the third is the context. We recommend placing the context inside the `res.locals` object. | - |

The context call ID is automatically extracted from the HTTP header `uux-call-context-id` if it exists. If it doesn't, a random UUID is generated for it.

The logger inside each context created by this middleware is a child of the logger specified in the parameters. Each child logs the respective call ID automatically to make it easier to track log messages from each request.

```javascript
const express = require('express');
const tools = require('itaas-nodejs-tools');

let app = express();

let logger = tools.createLogger(/* ... */);
let serviceLocator = tools.createServiceLocator();

let contextMiddleware = tools.express.createCallContextMiddleware(
  config,
  logger,
  serviceLocator,
  (req, res, context) => { res.locals.context = context; }));

app.use(contextMiddleware);

// all other middlewares and routes
```

### `express.createMorganMiddleware`

Returns an Express middleware that logs formatted HTTP request information at `info` level. It uses [Morgan](https://github.com/expressjs/morgan) to generate the formatted log message, but still uses the [Bunyan](https://github.com/trentm/node-bunyan) logger for the actual logging.

This function accepts these parameters:

| Parameter | Type | Required | Description | Default value |
|-----------|------|----------|-------------|---------------|
| getLogger | function | Yes | Function that returns the logger to be used. It can have 2 parameters: the first is the `req` from Express, the second is `res`. If the [call context middleware] is also being used, this function should return the logger within the context. | - |
| format | string | No | The format to use for the HTTP requests log messages. It must be one of the [predefined formats from Morgan](https://github.com/expressjs/morgan#predefined-formats) | `combined` |

```javascript
const tools = require('itaas-nodejs-tools');

let morganMiddleware = tools.express.createMorganMiddleware(
  (req, res) => res.locals.context.logger, 'common');

app.use(morganMiddleware);
```

Example of requests logged (`common` format):
```
127.0.0.1 xyz - [01/Feb/1998:01:08:39 -0800] "GET /bannerad/ad.htm HTTP/1.0" 200 198
```



### `express.createLowercaseQueryMiddleware`

Returns an Express middleware that 

Express is query case-sensitive. In order to avoid it, this middleware changes all query parameters to lowercase. 
E.g.: www.myapi.com/contents?Query1=x&queryTwo=y. It will be available to controllers the query 'query1' and 'querytwo'. 

```javascript
const tools = require('itaas-nodejs-tools');
app.use(tools.express.createLowercaseQueryMiddleware());
```

### `express.createTrimQueryValueMiddleware`
This middleware remove start and end space characters from queryString values. 

```javascript
const tools = require('itaas-nodejs-tools');
app.use(tools.express.createTrimQueryValueMiddleware());
```

## API Tools - Promise 
### promise.any
Promise.then will be executed if any function run successfully. 
If none catch block will be called.

```javascript
const tools = require('itaas-nodejs-tools');
let promise1 = Promise.resolve(1);
let promise2 = Promise.resolve(2);
let promise3 = Promise.resolve(3);

tools.promise.any([promise1, promise2, promise3])
  .then(myFunction);
```

## API Tools - Cassandra

### `cassandra.client`

It's a Cassandra.Client encapsulation from 'cassandra-driver'.

```javascript
const tools = require('itaas-nodejs-tools');
const CassandraClient = tools.cassandra.client;

/* See params list below */
let params = { ... }
let cassandraClient = new CassandraClient(params);  // return Cassandra.Client
let cql = 'SELECT * FROM testtable where testid = :id;';
let parameters = { id: '5' };
let queryRunner = tools.cassandra.cql;
queryRunner.executeQuery(callContext, cassandraClient, cql, parameters);

```

[ClientOptions reference](http://docs.datastax.com/en/developer/nodejs-driver/3.2/api/type.ClientOptions)

| Params                 | Definition                                                                       |
| -----------------------| -------------------------------------------------------------------------------- |
| cassandraUser          | User to connect in Cassandra.                                                    |
| cassandraPassword      | Password to connect in Cassandra.                                                |
| contactPoints          | Array of addresses or host names of the nodes to add as contact points.          |
| consistency            | See [Consistency Level](http://docs.datastax.com/en/developer/nodejs-driver/3.2/api/module.types/#member.consistencies). Default: localOne.                                            |
| socketOptions          | See [ClientOptions](http://docs.datastax.com/en/developer/nodejs-driver/3.2/api/type.ClientOptions/) |
| policies               | See [ClientOptions](http://docs.datastax.com/en/developer/nodejs-driver/3.2/api/type.ClientOptions/) |
| pooling                | See [ClientOptions](http://docs.datastax.com/en/developer/nodejs-driver/3.2/api/type.ClientOptions/) |


### `cassandra.consistencies`

It's a enum of consistency levels in Cassandra. See [Consistency Level](http://docs.datastax.com/en/developer/nodejs-driver/3.2/api/module.types/#member.consistencies).

```javascript
const tools = require('itaas-nodejs-tools');
const CassandraClient = tools.cassandra.client;
const CassandraConsistencies = tools.cassandra.consistencies;

let params = { queryOptions : { consistency : CassandraConsistencies.quorum } };
let cassandraClient = new CassandraClient(params); 
let cql = 'SELECT * FROM testtable where testid = :id;';
let parameters = { id: '5' };
let queryRunner = tools.cassandra.cql;
queryRunner.executeQuery(callContext, cassandraClient, cql, parameters);

```



### `cassandra.cql`
It is a helper class which specify a little more the result from 'execute' function from Cassandra driver  

#### `canConnect() `
Check if there is a connection between your client and a Cassandra database. It does not check if keyspace was created.

| Property       | Mandatory | Definition                                                                                                                       |
| -------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| callContext    | true      | Call Context. Also check [callContext](#createCallContext)                                                                       | 
| cassandraClient| true      | Your Cassandra Client. It must be one for application. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)  |                 

```javascript
const tools = require('itaas-nodejs-tools');

let cassandraClient = yourCassandraClient; 
let queryRunner = tools.cassandra.cql;
let canConnect = queryRunner.canConnect(callContext, cassandraClient)
// If could connect, canConnect = true
```

#### `executeQuery()`
Execute a query (SELECT) on Cassandra. It returns an array with result

| Property        | Mandatory | Definition                                                                                                                        |
| --------------  | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| callContext     | true      | Call Context. Also check [callContext](#createCallContext)                                                                        |
| cassandraClient | true      | Your Cassandra Client. It must be one for application. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)   |
| cql             | true      | Desired query to be executed. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)                            |
| parameters      | false     | Key-value pair object containing parameters from query. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)  |
| routingNames    | false     | Array of Routing Names. Also check [Routing Queries](https://docs.datastax.com/en/developer/nodejs-driver/3.0/nodejs-driver/reference/routingQueries.html) |
| consistency     | false     | Consistency Level. Also check [Consistency Level](http://docs.datastax.com/en/developer/nodejs-driver/3.2/api/module.types/#member.consistencies) |

```javascript
const tools = require('itaas-nodejs-tools');

let cassandraClient = yourCassandraClient; 
let cql = 'SELECT * FROM testtable where testid = :id;';
let parameters = { id: '5' };
let queryRunner = tools.cassandra.cql;
queryRunner.executeQuery(callContext, cassandraClient, cql, parameters);

/* *********************
 * Result
 * *********************
[
  {
    'testid': '5',
    'value': 'my-value5'
  }
]
 * *********************/
```

#### `executeNonQuery()`
Execute a NonQuery (E.g.: INSERT, DELETE) on Cassandra. It returns a boolean with the result.
It also check result in case of "IF EXISTS / IF NOT EXISTS" clause to return correct boolean.

| Property        | Mandatory | Definition                                                                                                                        |
| --------------  | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| callContext     | true      | Call Context. Also check [callContext](#createCallContext)                                                                        |
| cassandraClient | true      | Your Cassandra Client. It must be one for application. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)   |
| cql             | true      | Desired query to be executed. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)                            |
| parameters      | false     | Key-value pair object containing parameters from query. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)  |
| routingNames    | false     | Array of Routing Names. Also check [Routing Queries](https://docs.datastax.com/en/developer/nodejs-driver/3.0/nodejs-driver/reference/routingQueries.html)|
| consistency     | false     | Consistency Level. Also check [Consistency Level](http://docs.datastax.com/en/developer/nodejs-driver/3.2/api/module.types/#member.consistencies) |

```javascript
const tools = require('itaas-nodejs-tools');

let cassandraClient = yourCassandraClient;
let cql = 'INSERT INTO testtable (testid, value) VALUES (:id, \'my-value5\');';
let parameters = { id: '5' };
let queryRunner = tools.cassandra.cql;
queryRunner.executeNonQuery(callContext, cassandraClient, cql, parameters)
if(!result){
  throw new Error('Insert was not executed successfully');
}
/* Insert done*/
```

#### `executeBatch()`
A batch statement on Cassandra combines more than one DML statement (INSERT, UPDATE, DELETE) into a single logical operation. 
For further information, check [Cassandra Batch Page](https://docs.datastax.com/en/cql/3.3/cql/cql_reference/batch_r.html).
This method executes batch statement.

| Property        | Mandatory | Definition                                                                                                                             |
| --------------  | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| callContext     | true      | Call Context. Also check [callContext](#createCallContext)                                                                             |
| cassandraClient | true      | Your Cassandra Client. It must be one for application. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)        |
| builderQueries  | true      | Key-value pair object containing query and parameters. To make it easier check [Batch Query Buider](cassandra.createBatchQueryBuilder) |

```javascript
const tools = require('itaas-nodejs-tools');

let cassandraClient = yourCassandraClient;

let builder = tools.cassandra.createBatchQueryBuilder();
builder.add(
  'INSERT INTO testtable (testid, value) VALUES (:id, \'my-value3\');',
  { id: '3' }
);
builder.add(
  'INSERT INTO testtable (testid, value) VALUES (:id, \'my-value4\');',
  { id: '4' }
);

let queryRunner = tools.cassandra.cql;
queryRunner.executeBatch(callContext, cassandraClient, builder.getQueries())
```

### `cassandra.createBatchQueryBuilder`
To execute batch statement, Cassandra asks for a particular object format. 
To make it easier, use this method and insert new queries. 
After all, use getQueries() to generate desired object, sending it to [executeBatch()](#executeBatch)  

#### `add()`
| Property        | Mandatory | Definition                                                                                                                        |
| --------------  | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| cql             | true      | Desired query to be executed. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)                            |
| parameters      | false     | Key-value pair object containing parameters from query. Also check [Cassandra Client](https://github.com/datastax/nodejs-driver)  |

#### getQueries
Generates object to batch statement (is the same as client.batch from 
[Datastax Cassandra Driver](https://docs.datastax.com/en/developer/nodejs-driver/3.0/nodejs-driver/reference/batchStatements.html))

```javascript
const tools = require('itaas-nodejs-tools');

let builder = tools.cassandra.createBatchQueryBuilder();
builder.add(
  'INSERT INTO testtable (testid, value) VALUES (:id, \'my-value3\');',
  { id: '3' }
);
builder.add(
  'INSERT INTO testtable (testid, value) VALUES (:id, \'my-value4\');',
  { id: '4' }
);

console.log(builder.getQueries());

/* *********************
 * Result
 * *********************
[
  {
    'query' : 'INSERT INTO testtable (testid, value) VALUES (:id, \'my-value3\');',
    'params' : { id: '3' }
  },
  {
    'query' : 'INSERT INTO testtable (testid, value) VALUES (:id, \'my-value4\');',
    'params' : { id: '4' }
  }
] 
 * *********************/
```

### `cassandra.converter.map`

#### `mapToArray()`
Converts a Map to Array

```javascript
const tools = require('itaas-nodejs-tools');
let MapConverter = tools.cassandra.converter.map;

let map = {
  myId1: { myKey11: 'MyValue11', myKey12: 'MyValue12' },
  myId2: { myKey21: 'MyValue21', myKey22: 'MyValue22', myKey23: 'MyValue23' }
};
MapConverter.mapToArray(map, 'myId');

/* *********************
 * Result
 * *********************
[
  { myId: 'myId1', myKey11: 'MyValue11', myKey12: 'MyValue12' },
  { myId: 'myId2', myKey21: 'MyValue21', myKey22: 'MyValue22', myKey23: 'MyValue23' }
];
 * *********************/
```

#### `arrayToMap()`
Converts an Array to Map

```javascript
const tools = require('itaas-nodejs-tools');
let MapConverter = tools.cassandra.converter.map;

let array = [
  { myId: 'myId1', myKey11: 'MyValue11', myKey12: 'MyValue12' },
  { myId: 'myId2', myKey21: 'MyValue21', myKey22: 'MyValue22', myKey23: 'MyValue23' }
];

let arrayToMapResult = MapConverter.arrayToMap(array, 'myId');

/* *********************
 * Result
 * *********************
{
  myId1: { myKey11: 'MyValue11', myKey12: 'MyValue12' },
  myId2: { myKey21: 'MyValue21', myKey22: 'MyValue22', myKey23: 'MyValue23' }
};
 * *********************/
```
### Commands
Run in npm context to get access to the commands

#### license
Generates licenses of third party dependencies

Params:

--header: Add a header in license file

--allow: Comma separated list of allowed license names to be verified

--file: File to write the license list.

--skipPrefix: Skip licenses of dependencies that start with this