// route - api
module.exports = (api, opts) => {
  api.use((req,res,next) => {
    res.cors({
      origin: '*',
      methods: 'GET, POST, OPTIONS',
      headers: 'content-type, authorization',
      maxAge: 84000000
    })
    next() // continue execution
  })

  api.get('/status', async (req,res) => {
    return { status: 'ok' }
  })
  api.register(require('./routes/auth'), { prefix: '/auth' })



}
