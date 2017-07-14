const USER_DATA_KEY = 'userData'
const CONVERSATION_DATA_KEY = 'conversationData'
const PRIVATE_CONVERSATION_DATA_KEY = 'privateConversationData'

const conversationKey = (context) => {
  return `${CONVERSATION_DATA_KEY}:conversation:${context.conversationId}`
}

const privateConversationKey = (context) => {
  return `${PRIVATE_CONVERSATION_DATA_KEY}:user:${context.userId}:conversation:${context.conversationId}`
}

const userKey = (context) => {
  return `${USER_DATA_KEY}:user:${context.userId}`
}

class RedisStorage {
  constructor (redisClient) {
    this.redis = redisClient
  }

  async getData (context, callback) {
    const data = {}
    const operations = []

    if (context.userId) {
      // Read userData
      if (context.persistUserData) {
        operations.push({
          key: userKey(context),
          type: USER_DATA_KEY
        })
      }

      if (context.conversationId) {
        // Read privateConversationData
        operations.push({
          key: privateConversationKey(context),
          type: PRIVATE_CONVERSATION_DATA_KEY
        })
      }
    }

    if (context.persistConversationData && context.conversationId) {
      // Read conversationData
      operations.push({
        key: conversationKey(context),
        type: CONVERSATION_DATA_KEY
      })
    }

    Promise.all(operations.map((entry) => {
      return new Promise((resolve, reject) => {
        this.redis.get(entry.key, (err, obj) => {
          if (err) reject(err)

          data[entry.type] = JSON.parse(obj || '{}')

          resolve()
        })
      })
    })).then(() => {
      callback(null, data)
    }).catch((error) => {
      callback(error, {})
    })
  }

  saveData (context, data, callback) {
    const operations = []

    if (context.userId) {
      // Write userData
      if (context.persistUserData) {
        operations.push({
          key: userKey(context),
          data: data[USER_DATA_KEY]
        })
      }

      if (context.conversationId) {
        // Write privateConversationData
        operations.push({
          key: privateConversationKey(context),
          data: data[PRIVATE_CONVERSATION_DATA_KEY]
        })
      }
    }

    if (context.persistConversationData && context.conversationId) {
      // Write conversationData
      operations.push({
        key: conversationKey(context),
        data: data[CONVERSATION_DATA_KEY]
      })
    }

    Promise.all(operations.map((entry) => {
      return new Promise((resolve, reject) => {
        const value = JSON.stringify(entry.data)

        this.redis.set(entry.key, value, (err) => {
          if (err) reject(err)

          resolve()
        })
      })
    })).then(() => {
      callback(null)
    }).catch((error) => {
      callback(error)
    })
  }
}

module.exports = RedisStorage
