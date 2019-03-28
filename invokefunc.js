const fs = require('fs')
const os = require('os')
const yaml = require('yamljs')
const URL = require('url').URL
const https = require('https')
const jsSHA = require('jssha')
const sshpk = require('sshpk')
const httpSignature = require('http-signature')

// signing function as described at https://docs.cloud.oracle.com/Content/API/Concepts/signingrequests.htm
// BUT with 2 changes to support private keys encrypted with a passphrase
function sign (request, options) {
  var keyId = options.tenancyId + '/' + options.userId + '/' + options.keyFingerprint
  // 1. Decrypt the private key using the passphrase
  let key = sshpk.parsePrivateKey(options.privateKey, 'auto', { passphrase: options.passphrase })

  var headersToSign = [
    'host',
    'date',
    '(request-target)'
  ]

  var methodsThatRequireExtraHeaders = ['POST', 'PUT']

  if (methodsThatRequireExtraHeaders.indexOf(request.method.toUpperCase()) !== -1) {
    options.body = options.body || ''

    var shaObj = new jsSHA('SHA-256', 'TEXT')
    shaObj.update(options.body)

    request.setHeader('Content-Length', options.body.length)
    request.setHeader('x-content-sha256', shaObj.getHash('B64'))

    headersToSign = headersToSign.concat([
      'content-type',
      'content-length',
      'x-content-sha256'
    ])
  }

  httpSignature.sign(request, {
    key: key.toBuffer('pem', {}), // 2. Format the decrypted Key as pem
    keyId: keyId,
    headers: headersToSign
  })

  var newAuthHeaderValue = request.getHeader('Authorization').replace('Signature ', 'Signature version="1",')
  request.setHeader('Authorization', newAuthHeaderValue)
}

// generates a function to handle the https.request response object
function handleRequest (callback) {
  return function (response) {
    var responseBody = ''

    response.on('data', function (chunk) {
      responseBody += chunk
    })

    response.on('end', function () {
      callback(responseBody)
    })
  }
}

// Call the specified function invoke endpoint signing the request
function invokeFunction (ctx, functionInvokeURL, body, callback) {
  const url = new URL(functionInvokeURL)
  var options = {
    host: url.hostname,
    method: 'POST',
    path: url.pathname,
    headers: {
      'opc-compartment-id': ctx.compartmentId,
      'Content-Type': 'application/text'
    }
  }

  var request = https.request(options, handleRequest(callback))

  sign(request, {
    body: body,
    privateKey: ctx.privateKey,
    keyFingerprint: ctx.keyFingerprint,
    tenancyId: ctx.tenancyId,
    userId: ctx.userId,
    passphrase: ctx.passphrase
  })

  request.write(body)
  request.end()
}

if (!process.argv[2]) {
  console.error('usage: node ' + process.argv[1] + ' <function invoke endpoint>')
  process.exit(-1)
}

var fnInvokeEndpoint = process.argv[2]
var context = yaml.load('config.yaml') // load OCI context values
var keyPath = context.privateKeyPath
if (keyPath.indexOf('~/') === 0) {
  keyPath = keyPath.replace('~', os.homedir())
}

// read the private key
fs.readFile(keyPath, 'ascii', (err, data) => {
  if (err) {
    console.error("Can't read keyfile: " + keyPath)
    process.exit(-1)
  }
  context.privateKey = data
  var body = '' // TODO: add support for function body
  invokeFunction(context, fnInvokeEndpoint, body, function (response) {
    console.log(response)
  })
})
