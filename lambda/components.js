// List of component functions
module.exports = {

  // function to call an API
  httpRequest: function(params, postData) {
    var https = require('https');
    return new Promise(function(resolve, reject) {
      var req = https.request(params, function(res) {
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
  },

  // function to get config data from SSM
  getConfig: async (names) => {
    var AWS = require("aws-sdk");
    var ssm = new AWS.SSM({region: 'us-west-2'});
    const data = await ssm.getParameters({ Names: names, WithDecryption: true }).promise()
    const config = {}
    for (const i of data.Parameters) {
      config[i.Name.replace("/AlwaysOnward/","")] = i.Value;
    }
    return config
  },

  //token validation middleware
  checkAuth: async (req, res, next) => {
    const {
      verifierFactory,
      errors: { JwtVerificationError, JwksNoMatchingKeyError },
    } = require('@southlane/cognito-jwt-verifier')
    const { getConfig } = require('./components');

    var config = await getConfig(['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId']);
    // Put your config values here. calls https://cognito-idp.us-west-2.amazonaws.com/us-west-2_wNXUdpnmK/.well-known/jwks.json
    const verifier = verifierFactory({
      region: 'us-west-2',
      userPoolId: config['UserPoolId'],
      appClientId: config['UserPoolClientId'],
      tokenType: 'access', // either "access" or "id"
    })

    try {
      if (!('access_token' in req.cookies)) { return res.error(401, 'Not Authorized') }
      const tokenPayload = await verifier.verify(req.cookies.access_token)
      console.log(tokenPayload)
      next()
    } catch (e) {
      console.error(e);
      return res.error(401, 'Not Authorized');
    }
  }
}
