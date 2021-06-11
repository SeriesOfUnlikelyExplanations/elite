// route - api/auth
var AWS = require("aws-sdk");
var ssm = new AWS.SSM({region: 'us-west-2'}); //{region: 'us-east-1'}
var https = require('https');
var querystring = require('querystring');

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
    const data = await ssm.getParameters({ Names: ['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId', '/AlwaysOnward/AuthDomain'], WithDecryption: true }).promise()
    console.log(req);
    var postData = querystring.stringify({
      'grant_type' : 'authorization_code',
      'code' : 'authorization_code'
    });
    const options: https.RequestOptions = {
      hostname: 'example.url.com',
      port: 443,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };
    //~ https.post('https://' + config['AuthDomain'] + '/oauth2/token',

    //~ The custom application that’s hosted at the redirect URL can then extract the authorization code from the query parameters and exchange it for user pool tokens.
    //~ The exchange occurs by submitting a POST request to
     //~ https://AUTH_DOMAIN/oauth2/token with the following

     //~ application/x-www-form-urlencoded parameters:

    //~ grant_type – Set to “authorization_code” for this grant.
    //~ code – The authorization code that’s vended to the user.
    //~ client_id – Same as from the request in step 1.
    //~ redirect_uri – Same as from the request in step 1.
    //~ code_verifier (optional, is required if a code_challenge was specified in the original request) – The base64 URL-encoded representation of the unhashed, random string that was used to generate the PKCE code_challenge in the original request.

//~ If the client app that was used requires a secret, the Authorization header for this request is set as “Basic BASE64(CLIENT_ID:CLIENT_SECRET)“, where BASE64(CLIENT_ID:CLIENT_SECRET) is the base64 representation of the app client ID and app client secret, concatenated with a colon.

    return { clientId: '2st20dfpa6esj5hff65aoi9dua'
      ,region: 'us-west-2'
      ,identityPoolId: 'us-west-2:48eaf5af-7101-4d73-a749-229113a4a8e3'
      ,UserPoolId: 'us-west-2_Re0YBqOJp'}
  });
}
