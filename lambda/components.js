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
  }
};


