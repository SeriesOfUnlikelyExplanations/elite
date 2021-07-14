// route - api
module.exports = (api, opts) => {
  api.use((req,res,next) => {
    res.cors({
      origin: 'Access-Control-Allow-Origin',
      methods: 'GET, POST, OPTIONS',
      headers: 'content-type, authorization',
      maxAge: 84000000
    })
    next() // continue execution
  })

  api.get('/status', async (req,res) => {
    return { status: 'ok' }
  })

  // define the auth paths
  api.register(require('./routes/auth'), { prefix: '/auth' })

  //Register authenticated endpoints
  api.register((api, opts) => {
    api.use(Authorizer);
    api.register(require('./routes/contracts'), { prefix: '/contracts' })
  }, { prefix: '/private' })
}

async function Authorizer(req, res, next) {
  const {
    verifierFactory,
    errors: { JwtVerificationError, JwksNoMatchingKeyError },
  } = require('@southlane/cognito-jwt-verifier')
  const { getConfig } = require('./components');
  if (!('access_token' in req.cookies)) { return res.error(401, 'Not Authorized') }

  var config = await getConfig(['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId']);
  // Put your config values here. calls https://cognito-idp.us-west-2.amazonaws.com/us-west-2_wNXUdpnmK/.well-known/jwks.json
  const verifier = verifierFactory({
    region: 'us-west-2',
    userPoolId: config['UserPoolId'],
    appClientId: config['UserPoolClientId'],
    tokenType: 'access', // either "access" or "id"
  })

  try {
    const tokenPayload = await verifier.verify(req.cookies.access_token)
    console.log(tokenPayload)
    next()
  } catch (e) {
    return res.status(401).json({statusblag:'Not Authorized'});
  }
}
