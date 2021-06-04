exports.handler = async function(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Hello, CDK! You've hit ${event.path}\n`
  };
};


//~ // Require the framework and instantiate it
//~ const api = require('lambda-api')()

//~ // Define a route
//~ api.get('/status', async (req,res) => {
  //~ return { status: 'ok' }
//~ })

//~ // Declare your Lambda handler
//~ exports.handler = async (event, context) => {
  //~ // Run the request
  //~ return await api.run(event, context)
//~ }
