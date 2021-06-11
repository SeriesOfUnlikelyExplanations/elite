// route - api/auth
var AWS = require("aws-sdk");
var ssm = new AWS.SSM({region: 'us-west-2'}); //{region: 'us-east-1'}
var https = require('https');
var querystring = require('querystring');

function httpRequest(params, postData) {
  return new Promise(function(resolve, reject) {
    var req = http.request(params, function(res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error('statusCode=' + res.statusCode));
        }
        var body = [];
        res.on('data', function(chunk) {
            body.push(chunk);
        });
        res.on('end', function() {
            try {
                body = JSON.parse(Buffer.concat(body).toString());
            } catch(e) {
                reject(e);
            }
            resolve(body);
        });
    });
    req.on('error', function(err) {
      reject(err);
    });
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

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
    const data = await ssm.getParameters({ Names: ['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId', '/AlwaysOnward/AuthDomain', '/AlwaysOnward/UserPoolClientSecret'], WithDecryption: true }).promise()
    console.log(req);
    var postData = querystring.stringify({
      'grant_type' : 'authorization_code',
      'code' : 'authorization_code',
      'client_id': config['UserPoolClientId'],
      'redirect_uri': 'https://'+req.headers.host
    });
    const options: https.RequestOptions = {
      hostname: 'https://' + config['AuthDomain'],
      port: 443,
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(requestBody),
        'Authorization': 'Basic '+ Buffer.from(config['UserPoolClientId']+':'+config['UserPoolClientSecret']).toString('base64'))
      }
    };
    var response = await httpRequest(option, postData)
    console.log(response);
    //~ redirect_uri – Same as from the request in step 1.
    //~ code_verifier (optional, is required if a code_challenge was specified in the original request) – The base64 URL-encoded representation of the unhashed, random string that was used to generate the PKCE code_challenge in the original request.

//~ If the client app that was used requires a secret, the Authorization header for this request is set as “Basic BASE64(CLIENT_ID:CLIENT_SECRET)“, where BASE64(CLIENT_ID:CLIENT_SECRET) is the base64 representation of the app client ID and app client secret, concatenated with a colon.

    return { clientId: '2st20dfpa6esj5hff65aoi9dua'
      ,region: 'us-west-2'
      ,identityPoolId: 'us-west-2:48eaf5af-7101-4d73-a749-229113a4a8e3'
      ,UserPoolId: 'us-west-2_Re0YBqOJp'}
  });
}
