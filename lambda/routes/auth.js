// route - api/auth
var AWS = require("aws-sdk");
var ssm = new AWS.SSM({region: 'us-west-2'}); //{region: 'us-east-1'}

module.exports = (api, opts) => {
  api.get('/parameters', async (req,res) => {
    res.cors({
      origin: '*',
      methods: 'GET, POST, OPTIONS',
      headers: 'content-type, authorization',
      maxAge: 84000000
    })
    const data = await ssm.getParameters({ Names: ['/AlwaysOnward/UserPoolClientId', '/AlwaysOnward/AuthDomain'], WithDecryption: true }).promise()
    const config = {}
    for (const i of data.Parameters) {
      config[i.Name.replace("/AlwaysOnward/","")] = i.Value;
    }

    return {'url': 'https://' + config['AuthDomain'] + '/login?client_id='+config['clientId']
        +'&response_type=token&scope=email+openid+phone+profile&redirect_uri=https://'
        +req.headers.host }
  });

  api.get('/getTokens', async (req,res) => {
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
  });
}
