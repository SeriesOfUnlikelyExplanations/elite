
// routes/v1/products.js
module.exports = (api, opts) => {
  api.get('/clientId', async (req,res) => {
    res.cors({
      origin: '*',
      methods: 'GET, POST, OPTIONS',
      headers: 'content-type, authorization',
      maxAge: 84000000
    })
    return { clientId: '2st20dfpa6esj5hff65aoi9dua' }
  })
}
