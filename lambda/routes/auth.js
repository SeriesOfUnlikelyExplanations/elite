// route - api/auth
var querystring = require('querystring');
var { httpRequest, getConfig } = require('../components');
const url = require('url');

function callTokenApi(postData, config) {
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
  //make the API call
  return httpRequest(options, postData)
}

module.exports = (api, opts) => {
  api.get('/get_auth/:type', async (req,res) => {
    //get config variables & add them to promise
    var config = await getConfig(['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId', '/AlwaysOnward/AuthDomain', '/AlwaysOnward/UserPoolClientSecret']);
    const host = url.parse(req.headers.referer || req.headers.host).host
    var logout_response = {
      status: 'Logged in',
      redirect_url: 'https://' + config['AuthDomain'] + '/logout?client_id='+config['UserPoolClientId']
        +'&logout_uri=https://'+host,
      title: 'Logout'
    }
    var login_response = {
      status:'Not logged in',
      redirect_url: 'https://'+config['AuthDomain']+'/login?client_id='+config['UserPoolClientId']
        +'&response_type=code&scope=email+openid+phone+profile&redirect_uri=https://'
        +host,
      title: 'Login'
    }
    //If there is already an access token, then skip the rest
    if ('access_token' in req.cookies) {
      return res.json(logout_response)
    }
    if ('refresh_token' in req.cookies || 'code' in req.query) {
      var tokens = {}
      if ('refresh_token' in req.cookies) {
        // get a new access token from the refresh token
        var postData = querystring.stringify({
          'grant_type' : 'refresh_token',
          'refresh_token' : req.cookies.refresh_token,
          'client_id': config['UserPoolClientId'],
        });
        tokens = await callTokenApi(postData, config)
        console.log(tokens)
      }
      if (tokens instanceof Error && 'code' in req.query) {
        // if there is a code, get tokens
        var postData = querystring.stringify({
          'grant_type' : 'authorization_code',
          'code' : req.query.code,
          'client_id': config['UserPoolClientId'],
          'redirect_uri': 'https://'+host
        });
        tokens = await callTokenApi(postData, config)
        console.log(tokens)
      }
      if (tokens instanceof Error) {
        console.log(err)
        return res.status(401).json(login_response)
      }
      var date = new Date();
      date.setDate(date.getDate() + 30)
      if ('refresh_token' in tokens) {
        res.cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          path: '/api/auth/get_auth/refresh',
          sameSite: true,
          secure: true,
          expires: date
        })
      }
      if ('id_token' in tokens) {
        res.cookie('id_token', tokens.id_token, {
          httpOnly: false,
          sameSite: true,
          secure: true,
          expires: date
        })
      }
      if ('access_token' in tokens) {
        res.cookie('access_token', tokens.access_token, {
          httpOnly: false,
          sameSite: true,
          secure: true,
          expires: new Date(new Date().getTime() + tokens.expires_in*1000)
        })
      }
      return res.status(200).json(logout_response)
    }
    return res.status(200).json(login_response)
  });
}
