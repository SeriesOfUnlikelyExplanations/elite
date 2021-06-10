// route - api
module.exports = (api, opts) => {
  api.register(require('./routes/auth'), { prefix: '/auth' })



}
