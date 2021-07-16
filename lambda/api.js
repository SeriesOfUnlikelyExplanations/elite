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
    api.register(require('./routes/offers'), { prefix: '/offers' })
  }, { prefix: '/private' })
}

async function Authorizer(req, res, next) {
  const {
    verifierFactory,
    errors: { JwtVerificationError, JwksNoMatchingKeyError },
  } = require('@southlane/cognito-jwt-verifier')
  const { getConfig } = require('./components');
  if (!('access_token' in req.cookies)) { return res.error(401, 'Not Authorized') }

  var config = await getConfig(['/AlwaysOnward/UserPoolId', '/AlwaysOnward/UserPoolClientId', '/AlwaysOnward/offersBucket']);
  // Put your config values here. calls https://cognito-idp.us-west-2.amazonaws.com/us-west-2_wNXUdpnmK/.well-known/jwks.json
  const verifierCofig = {
    region: 'us-west-2',
    userPoolId: config['UserPoolId'],
    appClientId: config['UserPoolClientId'],
  }
  // tokenType: can be either "access" or "id"
  const accessVerifier = verifierFactory(Object.assign(verifierCofig, {tokenType: 'access'}))
  const idVerifier = verifierFactory(Object.assign(verifierCofig, {tokenType: 'id'}))

  try {
    const accessTokenPayload = accessVerifier.verify(req.cookies.access_token);
    const idTokenPayload = idVerifier.verify(req.cookies.id_token);
    req.accessTokenPayload = await accessTokenPayload;
    req.idTokenPayload = await idTokenPayload;
    req.offersBucket = config.offersBucket;
    req.region = config.region;
    next()
  } catch (e) {
    console.log(e)
    res.clearCookie('access_token', this.tokenOptions)
    return res.sendStatus(403)
  }
}
