// route - api/auth
module.exports = (api, opts) => {
  api.get('/parameters', async (req,res) => {
    res.cors({
      origin: '*',
      methods: 'GET, POST, OPTIONS',
      headers: 'content-type, authorization',
      maxAge: 84000000
    })
    return { clientId: '2st20dfpa6esj5hff65aoi9dua'
      ,region: 'us-west-2'
      ,identityPoolId: 'us-west-2:48eaf5af-7101-4d73-a749-229113a4a8e3'}
  })
}
