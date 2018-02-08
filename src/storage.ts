import { IBotStorage, IBotStorageContext, IBotStorageData } from "botbuilder"
import { RedisClient } from "redis"

type StorageKeys = "userData" | "conversationData" | "privateConversationData"

const USER_DATA_KEY: StorageKeys = "userData"
const CONVERSATION_DATA_KEY: StorageKeys = "conversationData"
const PRIVATE_CONVERSATION_DATA_KEY: StorageKeys = "privateConversationData"

interface IRedisOperation {
  type: StorageKeys
  key: string
}

const conversationKey = (context: IBotStorageContext): string => {
  return `${CONVERSATION_DATA_KEY}:conversation:${context.conversationId}`
}

const privateConversationKey = (context: IBotStorageContext): string  => {
  return `${PRIVATE_CONVERSATION_DATA_KEY}:user:${context.userId}:conversation:${context.conversationId}`
}

const userKey = (context: IBotStorageContext): string => {
  return `${USER_DATA_KEY}:user:${context.userId}`
}

export class RedisStorage implements IBotStorage {
  public redis: RedisClient
  public ttl: number

  constructor(client: RedisClient) {
    this.redis = client
    this.ttl = null
  }

  public setConversationTTL(ttl: number) {
    this.ttl = ttl
  }

  public getData(context: IBotStorageContext, callback: (err: Error, data: IBotStorageData) => void) {
    const data: IBotStorageData = {}
    const operations: IRedisOperation[] = []

    if (context.userId) {
      // Read userData
      if (context.persistUserData) {
        operations.push({
          key: userKey(context),
          type: USER_DATA_KEY,
        })
      }

      if (context.conversationId) {
        // Read privateConversationData
        operations.push({
          key: privateConversationKey(context),
          type: PRIVATE_CONVERSATION_DATA_KEY,
        })
      }
    }

    if (context.persistConversationData && context.conversationId) {
      // Read conversationData
      operations.push({
        key: conversationKey(context),
        type: CONVERSATION_DATA_KEY,
      })
    }

    Promise.all(operations.map((entry) => {
      return new Promise((resolve, reject) => {
        this.redis.get(entry.key, (err, obj) => {
          if (err) { reject(err) }

          data[entry.type] = JSON.parse(obj || "{}")

          resolve()
        })
      })
    })).then(() => {
      callback(null, data)
    }).catch((error) => {
      callback(error, {})
    })
  }

  public saveData(context: IBotStorageContext, data: IBotStorageData, callback?: (err: Error) => void) {
    const operations = []

    if (context.userId) {
      // Write userData
      if (context.persistUserData) {
        operations.push({
          data: data[USER_DATA_KEY],
          key: userKey(context),
        })
      }

      if (context.conversationId) {
        // Write privateConversationData
        operations.push({
          data: data[PRIVATE_CONVERSATION_DATA_KEY],
          key: privateConversationKey(context),
        })
      }
    }

    if (context.persistConversationData && context.conversationId) {
      // Write conversationData
      operations.push({
        data: data[CONVERSATION_DATA_KEY],
        key: conversationKey(context),
      })
    }

    Promise.all(operations.map((entry) => {
      return new Promise((resolve, reject) => {
        const value = JSON.stringify(entry.data)

        this.redis.set(entry.key, value, (err) => {
          if (err) { reject(err) }
          resolve()
        })
        if(this.ttl && this.ttl > 0) {
          this.redis.expire(entry.key, this.ttl)
        }
      })
    })).then(() => {
      callback(null)
    }).catch((error) => {
      callback(error)
    })
  }
}
