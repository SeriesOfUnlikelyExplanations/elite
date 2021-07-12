/**
 * A minimal web server that converts the request
 * object to something the lambda-api module understands.
 */
const api = require('lambda-api')()
const https = require('https')
const fs = require('fs')
//~ const open = require('open');

api.register(require('./lambda/api'), { prefix: '/api' })
api.register(require('./static-routes'))

const options = {
  //https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/
  //~openssl genrsa -out key.pem
  //~openssl req -new -key key.pem -out csr.pem
  //~openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
  //~rm csr.pem
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const serverWrapper = https.createServer(options, function (request, response) {
  const url = new URL(request.url, `https://${request.headers.host}/`)
  var body = "";
  request.on("data", function (chunk) {
    body += chunk;
  });
  request.on("end", function(){
    // The event object we're faking is a lightweight based on:
    // https://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-api-gateway-request
    const event = {
      httpMethod: request.method.toUpperCase(),
      path: url.pathname,
      resource: '/{proxy+}',
      queryStringParameters: [...url.searchParams.keys()].reduce((output, key) => { output[key] = url.searchParams.get(key); return output }, {}),
      headers: request.headers,
      requestContext: {},
      pathParameters: {},
      stageVariables: {},
      isBase64Encoded: false,
      body: body,
    }

    api.run(event, {})
      .then((res) => {
        let {body, headers, statusCode } = res;
        console.log(headers);
        if (res.isBase64Encoded) {
          body = Buffer.from(body, 'base64')
        }
        if (!headers['content-length'] && body && body.length) {
          headers['content-length'] = body.length
        }
        response.writeHead(statusCode, headers)
        response.end(body)
      }).catch((err) => {
        console.log(err)
        console.error('Something went horribly, horribly wrong')
        response.writeHead(500, { 'content-length': 0 })
        response.end('')
        throw err
      })
  })
})

serverWrapper.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on https://localhost:${serverWrapper.address().port}/`)
  //~ open(`https://localhost:${serverWrapper.address().port}/`)
})
