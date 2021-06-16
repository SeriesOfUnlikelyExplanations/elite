// route - api/auth
var querystring = require('querystring');
var { httpRequest, getConfig } = require('../components');
const url = require('url');

module.exports = (api, opts) => {
  api.get('/get_auth', async (req,res) => {
    //get config variables & add them to promise
    var config = await getConfig(['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId', '/AlwaysOnward/AuthDomain', '/AlwaysOnward/UserPoolClientSecret']);
    //~ console.log(req.cookies);

    // if there is a code, get tokens
    if ('code' in req.query && req.query.code != 'null' ) {
      var postData = querystring.stringify({
        'grant_type' : 'authorization_code',
        'code' : req.query.code,
        'client_id': config['UserPoolClientId'],
        'redirect_uri': 'https://'+url.parse(req.headers.referer).host
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
        var date = new Date();
        //~ res.cookie('access_token',tokens.access_token+'; HttpOnly; Path=/; Secure; SameSite=Strict')
        //~ res.header('set-cookie', 'id_token='+tokens.id_token+'; HttpOnly; Path=/; Secure; SameSite=Strict', true)
        res.cookie('access_token', tokens.access_token,
          {httpOnly: true,
          sameSite: true,
          secure: true,
          expires: date + token.expires_in
          }
        )
        res.cookie('refresh_token', tokens.refresh_token,
          {httpOnly: true,
          sameSite: true,
          secure: true,
          expires: date.setDate(date.getDate() + 30) }
        )
        res.cookie('id_token', tokens.id_token,
          {httpOnly: true,
          sameSite: true,
          secure: true }
        )
        res.status(200).json({status: 'Logged in'})
      } catch (err) {
        res.status(401).json({status:'Not logged in'})
      }
    } else {
      const login_url = 'https://' + config['AuthDomain'] + '/login?client_id='+config['UserPoolClientId']
        +'&response_type=code&scope=email+openid+phone+profile&redirect_uri=https://'
        +url.parse(req.headers.referer).host
      res.json({'url': login_url})
    }
  });
}
