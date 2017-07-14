var redis = require('redis')
var RedisStorage = require('../')

describe('RedisStorage', () => {
  let redisClient
  let storage
  let context

  beforeEach((done) => {
    redisClient = redis.createClient(process.env.REDIS_URL, { prefix: 'test-bot-storage' });
    storage     = new RedisStorage(redisClient)
    context     = { userId: 'U1', conversationId: 'C1', persistUserData: true, persistConversationData: true }

    redisClient.flushdb((err, succeeded) => {
      if (succeeded) done()
    })
  })

  describe('getData', () => {
    describe('when redis doesn\'t have the key', () => {
      it('returns the data with the basic keys', (done) => {
        storage.getData(context, (error, data) => {
          expect(data).toEqual({
            userData: {}, privateConversationData: {}, conversationData: {}
          })

          done()
        })
      })
    })

    describe('when redis has the key', () => {
      let newData

      beforeEach((done) => {
        newData =  { userData: { a: 'b' }, privateConversationData: { c: 'd' }, conversationData: { e: 'f' } }
        storage.saveData(context, newData, (err) => {
          if (!err) done()
        })
      })

      it('returns the previously saved data', (done) => {
        storage.getData(context, (error, data) => {
          expect(data).toEqual(newData)

          done()
        })
      })
    })
  })

  describe('saveData', () => {
    describe('when redis doesn\'t have the key', () => {
      let newData

      beforeEach(() => {
        newData =  { userData: { a: 'b' }, privateConversationData: { c: 'd' }, conversationData: { e: 'f' } }
      })

      it('saves the data correctly', (done) => {
        storage.saveData(context, newData, (err) => {
          if (err) return

          storage.getData(context, (error, data) => {
            expect(data).toEqual(newData)

            done()
          })
        })
      })
    })
  })
})
