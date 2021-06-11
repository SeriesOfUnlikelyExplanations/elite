// route - api
module.exports = (api, opts) => {
  api.get('/status', async (req,res) => {
    return { status: 'ok' }
  })


  api.register(require('./routes/auth'), { prefix: '/auth' })



}
