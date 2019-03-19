var httpSignature = require('http-signature');
var jsSHA = require("jssha");
var sshpk = require('sshpk');

// signing function as described at https://docs.cloud.oracle.com/Content/API/Concepts/signingrequests.htm
// BUT with 2 changes to support private keys encrypted with a passphrase
exports.sign = function (request, options) {

    var keyId = options.tenancyId + "/" + options.userId + "/" + options.keyFingerprint;
    // 1. Decrypt the private key using the passphrase
    let key = sshpk.parsePrivateKey(options.privateKey, 'auto', { passphrase: options.passphrase });

    var headersToSign = [
        "host",
        "date",
        "(request-target)"
    ];

    var methodsThatRequireExtraHeaders = ["POST", "PUT"];

    if (methodsThatRequireExtraHeaders.indexOf(request.method.toUpperCase()) !== -1) {
        options.body = options.body || "";

        var shaObj = new jsSHA("SHA-256", "TEXT");
        shaObj.update(options.body);

        request.setHeader("Content-Length", options.body.length);
        request.setHeader("x-content-sha256", shaObj.getHash('B64'));

        headersToSign = headersToSign.concat([
            "content-type",
            "content-length",
            "x-content-sha256"
        ]);
    }

    httpSignature.sign(request, {
        key: key.toBuffer('pem', {}), // 2. Format the decrypted Key as pem 
        keyId: keyId,
        headers: headersToSign
    });

    var newAuthHeaderValue = request.getHeader("Authorization").replace("Signature ", "Signature version=\"1\",");
    request.setHeader("Authorization", newAuthHeaderValue);
}
