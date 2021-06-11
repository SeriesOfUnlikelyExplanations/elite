// route - api/auth
var AWS = require("aws-sdk");

module.exports = (api, opts) => {
  api.get('/parameters', async (req,res) => {
    res.cors({
      origin: '*',
      methods: 'GET, POST, OPTIONS',
      headers: 'content-type, authorization',
      maxAge: 84000000
    })
  const data = await ssm.getParameters({ Names: ['AlwaysOnward/UserPoolClientId', 'region', 'identityPoolId'],
    WithDecryption: true }).promise()
  const config = {}
  for (const i of data.Parameters) {
    config[i.Name.replace("AlwaysOnward/","")] = i.Value;
  }
  return config

    //~ return { clientId: '2st20dfpa6esj5hff65aoi9dua'
      //~ ,region: 'us-west-2'
      //~ ,identityPoolId: 'us-west-2:48eaf5af-7101-4d73-a749-229113a4a8e3'
      //~ ,UserPoolId: 'us-west-2_Re0YBqOJp'}

  api.get('/signin', async (req,res) => {
    res.cors({
      origin: '*',
      methods: 'GET, POST, OPTIONS',
      headers: 'content-type, authorization',
      maxAge: 84000000
    })
    return { clientId: '2st20dfpa6esj5hff65aoi9dua'
      ,region: 'us-west-2'
      ,identityPoolId: 'us-west-2:48eaf5af-7101-4d73-a749-229113a4a8e3'
      ,UserPoolId: 'us-west-2_Re0YBqOJp'}
  })
}
