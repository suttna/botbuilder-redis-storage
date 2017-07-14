# botbuilder-redis-storage [![npm version](https://badge.fury.io/js/botbuilder-redis-storage.svg)](https://badge.fury.io/js/botbuilder-redis-storage) [![CircleCI](https://circleci.com/gh/suttna/botbuilder-redis-storage.svg?style=svg)](https://circleci.com/gh/suttna/botbuilder-redis-storage)

Redis storage adapter for Microsoft BotBuilder. This class implements the `IBotStorage` interface.

## Install

```
yarn add botbuilder-redis-storage redis
```

## Usage

The storage depends on a redis client instance.

```javascript
var redis = require('redis')
var RedisStorage = require('botbuilder-redis-storage')
var builder = require('botbuilder')

// Initialize redis client
var redisClient = redis.createClient(process.env.REDIS_URL, { prefix: 'bot-storage:' });

// Create new storage with redis client
var storage = new RedisStorage(redisClient)

var connector = new builder.ChatConnector()
var bot = new builder.UniversalBot(connector)

// Configure bot to use the RedisStorage
bot.set('storage', storage)
```

## Test

To run the tests:

```
yarn install
yarn test
```

## Contact

- Martín Ferández <martin@suttna,com>
- Santiago Doldán <santiago@suttna,com>
