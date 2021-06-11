// route - api/auth
var AWS = require("aws-sdk");
var ssm = new AWS.SSM({region: 'us-west-2'}); //{region: 'us-east-1'}

module.exports = (api, opts) => {
  api.get('/parameters', async (req,res) => {
    const data = await ssm.getParameters({ Names: ['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId', '/AlwaysOnward/AuthDomain'], WithDecryption: true }).promise()
    const config = {}
    for (const i of data.Parameters) {
      config[i.Name.replace("/AlwaysOnward/","")] = i.Value;
    }
    config.url = 'https://' + config['AuthDomain'] + '/login?client_id='+config['UserPoolClientId']
        +'&response_type=code&scope=email+openid+phone+profile&redirect_uri=https://'
        +req.headers.host
    return config
  });

  api.post('/getTokens', async (req,res) => {


    return { clientId: '2st20dfpa6esj5hff65aoi9dua'
      ,region: 'us-west-2'
      ,identityPoolId: 'us-west-2:48eaf5af-7101-4d73-a749-229113a4a8e3'
      ,UserPoolId: 'us-west-2_Re0YBqOJp'}
  });
}
