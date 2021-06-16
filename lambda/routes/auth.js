// route - api/auth
var querystring = require('querystring');
var { httpRequest, getConfig } = require('../components');
const url = require('url');

module.exports = (api, opts) => {
  api.get('/get_auth', async (req,res) => {
    //get config variables & add them to promise
    var config = await getConfig(['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId', '/AlwaysOnward/AuthDomain', '/AlwaysOnward/UserPoolClientSecret']);
    //~ console.log(req.cookies);
    var logout_response = {
      status: 'Logged in',
      url: 'https://' + config['AuthDomain'] + '/logout?client_id='+config['UserPoolClientId']
        +'&logout_uri=https://'+url.parse(req.headers.referer).host,
      title: 'Logout'
    }
    var login_response = {
      status:'Not logged in',
      url: 'https://'+config['AuthDomain']+'/login?client_id='+config['UserPoolClientId']
        +'&response_type=code&scope=email+openid+phone+profile&redirect_uri=https://'
        +url.parse(req.headers.referer).host,
      title: 'Login'
    }
    //If there is already an access token, then skip the rest
    console.log('access_token' in req.cookies)
    if ('access_token' in req.cookies) {
      return res.json(logout_response)
    }
    // if there is a code, get tokens
    if ('code' in req.query) {
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
        date.setDate(date.getDate() + 30)
        //~ res.cookie('access_token',tokens.access_token+'; HttpOnly; Path=/; Secure; SameSite=Strict')
        //~ res.header('set-cookie', 'id_token='+tokens.id_token+'; HttpOnly; Path=/; Secure; SameSite=Strict', true)
        res.cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          path: '/api/auth/refresh',
          sameSite: true,
          secure: true,
          expires: date
        })
        res.cookie('id_token', tokens.id_token, {
          httpOnly: false,
          sameSite: true,
          secure: true,
          expires: date
        })
        res.cookie('access_token', tokens.access_token, {
          httpOnly: false,
          sameSite: true,
          secure: true,
          expires: new Date(new Date().getTime() + tokens.expires_in*1000)
        })
        return res.status(200).json(logout_response)
      } catch (err) {
        console.log(err)
        return res.status(401).json({status:'Not logged in'})
      }
    } else {
      return res.json(login_response)
    }
  });
}
