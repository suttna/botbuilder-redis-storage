import "jest"
import { createClient, RedisClient } from "redis"
import { RedisStorage } from "../src/storage"

// 10s timeout to test expired TTL
jest.setTimeout(10000)

describe("RedisStorage", () => {
  let redisClient
  let storage
  let context

  beforeEach((done) => {
    let options = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || '6379',
        prefix: "test-bot-storage:"
    }
    if(process.env.REDIS_AUTH) {
        options.password = process.env.REDIS_AUTH
    }

    redisClient = createClient(options)
    storage     = new RedisStorage(redisClient)
    context     = { userId: "U1", conversationId: "C1", persistUserData: true, persistConversationData: true }

    redisClient.flushdb((err, succeeded) => {
      if (succeeded) { done() }
    })
  })

  describe("getData", () => {
    describe("when redis doesn't have the key", () => {
      it("returns the data with the basic keys", (done) => {
        storage.getData(context, (error, data) => {
          expect(data).toEqual({
            conversationData: {},
            userData: {},
            privateConversationData: {},
          })

          done()
        })
      })
    })

    describe("when redis has the key", () => {
      let newData

      beforeEach((done) => {
        newData =  { userData: { a: "b" }, privateConversationData: { c: "d" }, conversationData: { e: "f" } }
        storage.saveData(context, newData, (err) => {
          if (!err) { done() }
        })
      })

      it("returns the previously saved data", (done) => {
        storage.getData(context, (error, data) => {
          expect(data).toEqual(newData)

          done()
        })
      })

    })
  })

  describe("saveData", () => {
    describe("when redis doesn't have the key", () => {
      let newData

      beforeEach(() => {
        newData =  { userData: { a: "b" }, privateConversationData: { c: "d" }, conversationData: { e: "f" } }
      })

      it("saves the data correctly", (done) => {
        storage.saveData(context, newData, (err) => {
          if (err) { return }

          storage.getData(context, (error, data) => {
            expect(data).toEqual(newData)

            done()
          })
        })
      })
    })

    describe("when there is a TTL set", () => {
      let newData

      beforeEach(() => {
        newData = {userData: {a: "b"}, privateConversationData: {c: "d"}, conversationData: {e: "f"}}
      })

      it("sets the TTL correctly", (done) => {
        storage.setConversationTTL(100)
        storage.saveData(context, newData, (err) => {
          if (err) {
            return
          }

          storage.redis.ttl(
            `privateConversationData:user:${context.userId}:conversation:${context.conversationId}`,
            (err, data) => {
              expect(data).toEqual(100)
              done()
            })
        })
      })
      it("ignores invalid TTL", (done) => {
        storage.setConversationTTL(0)
        storage.saveData(context, newData, (err) => {
          if (err) {
            return
          }

          storage.redis.ttl(
            `privateConversationData:user:${context.userId}:conversation:${context.conversationId}`,
            (err, data) => {
              expect(data).toEqual(-1)
              done()
            })
        })
      })
      it("ignores missing TTL", (done) => {
        storage.saveData(context, newData, (err) => {
          if (err) {
            return
          }

          storage.redis.ttl(
            `privateConversationData:user:${context.userId}:conversation:${context.conversationId}`,
            (err, data) => {
              expect(data).toEqual(-1)
              done()
            })
        })
      })
      it("data expires", (done) => {
        storage.setConversationTTL(1) // 1s expire
        storage.saveData(context, newData, (err) => {
          if (err) {
            return
          }
          setTimeout(() => {
            storage.redis.get(
              `privateConversationData:user:${context.userId}:conversation:${context.conversationId}`,
              (err, data) => {
                expect(data).toEqual(null)
                done()
              })
          }, 2000) // 2s delay to let it expire
        })
      })
    })
  })
})
