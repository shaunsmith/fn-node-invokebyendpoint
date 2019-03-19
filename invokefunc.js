const fs = require('fs');
const yaml = require('yamljs');
const sign = require('./ocisign').sign;
const URL = require('url').URL;
const https = require('https');

// generates a function to handle the https.request response object
function handleRequest(callback) {

  return function (response) {
    var responseBody = "";

    response.on('data', function (chunk) {
      responseBody += chunk;
    });

    response.on('end', function () {
      callback(responseBody);
    });
  }
}

// Call the specified function invoke endpoint signing the request 
function invokeFunction(ctx, functionInvokeURL, body, callback) {
  const url = new URL(functionInvokeURL);
  var options = {
    host: url.hostname,
    method: 'POST',
    path: url.pathname,
    headers: {
      "opc-compartment-id": ctx.compartmentId,
      "Content-Type": "application/text"
    }
  };

  var request = https.request(options, handleRequest(callback));

  sign(request, {
    body: body,
    privateKey: ctx.privateKey,
    keyFingerprint: ctx.keyFingerprint,
    tenancyId: ctx.tenancyId,
    userId: ctx.userId,
    passphrase: ctx.passphrase
  });

  request.write(body);
  request.end();
};


if (!process.argv[2]) {
  console.log("usage: node " + process.argv[1] + " <function invoke endpoint>")
  process.exit(-1);
}

var fnInvokeEndpoint = process.argv[2];
var context = yaml.load('config.yaml');
var keyPath = context.privateKeyPath;
if (keyPath.indexOf("~/") === 0) {
  keyPath = keyPath.replace("~", os.homedir());
}
context.privateKey = fs.readFileSync(keyPath, 'ascii');

//TODO: add support for function body
invokeFunction(context, fnInvokeEndpoint, "", function (response) {
  console.log(response);
})



