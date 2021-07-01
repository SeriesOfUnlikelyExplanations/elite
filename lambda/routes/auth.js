// route - api/auth
var querystring = require('querystring');
var { httpRequest, getConfig } = require('../components');
const url = require('url');

module.exports = (api, opts) => {
  api.get('/get_auth', async (req,res) => {
    //get config variables & add them to promise
    var config = await getConfig(['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId', '/AlwaysOnward/AuthDomain', '/AlwaysOnward/UserPoolClientSecret']);
    //~ console.log(req.cookies);

    console.log(req.query)
    // if there is a code, get tokens
    if (code in req.query && req.query.code != null) {
      var postData = querystring.stringify({
        'grant_type' : 'authorization_code',
        'code' : req.query.code,
        'client_id': config['UserPoolClientId'],
        'redirect_uri': 'https://'+req.headers.host
      });
      var options = {
        hostname: config['AuthDomain'],
        port: 443,
        path: '/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': 'Basic '+ Buffer.from(config['UserPoolClientId']+':'+config['UserPoolClientSecret']).toString('base64')
        }
      };
      try {
        var tokens = await httpRequest(options, postData)
        console.log(tokens)
        tokens.expires_at =  Date.now() + tokens.expires_in
        res.cookie('tokens', {id_token: tokens.id_token},
          {httpOnly: true, sameSite: true, secure: true }
          ).status(200).json({status: 'Logged in'})
      } catch {
        res.status(401).json({status:'Not logged in'})
      }
    } else {
      const url = 'https://' + config['AuthDomain'] + '/login?client_id='+config['UserPoolClientId']
        +'&response_type=code&scope=email+openid+phone+profile&redirect_uri=https://'
        +req.headers.host
      res.json({'url': url})
    }
  });
}
