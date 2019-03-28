# Invoke Oracle Functions by its Endpoint

This example demonstrates how to invoke a function deployed to Oracle Functions
by its invoke endpoint URL.

## Pre-requisites

1. Install/update the Fn CLI

   `curl -LSs https://raw.githubusercontent.com/fnproject/cli/master/install |
   sh`

2. Setup your OCI config file as described in the Oracle Functions quick start guide.

3. Create a function to invoke.  You can follow these instructions for a [Node
   Hello World
   Function](https://github.com/abhirockzz/oracle-functions-hello-worlds/blob/master/node-hello-world.md)
   if you don't already have one.

## Setup

1. Clone this repository

   `git clone https://github.com/shaunsmith/fn-node-invokebyendpoint.git`

2. Cd into the directory where you cloned the example:

   `cd fn-node-invokebyendpoint`

3. Install the required Node modules:

    `npm install`

4. Copy `config.template` to `config.yaml` and add your OCI details.  (NOTE: If
   you've configured the fn CLI to work with Oracle Functions you can copy
   values from your `~/.oci/config` and fn context file).

    ```yaml
    tenancyId: <ocid>
    compartmentId: <ocid>
    userId: <ocid>
    keyFingerprint:
    privateKeyPath:
    passphrase:
    ```

5. Inspect a function to get its invoke endpoint.  For example, if you have a
   function "hello" in the "quickstart" application, you can inspect the function
   with:

    `fn inspect f quickstart hello`

   This will return JSON similar to the following:

   ```json
   {
     "annotations": {
       "fnproject.io/fn/invokeEndpoint": "https://iagu5qcq6iq.us-phoenix-1.functions.oci.oraclecloud.com/20181201/functions/ocid1.fnfunc.oc1.phx.aaaaaaaaac4lertr6bwpulbgqogsv753afil4zytaazomqxlebdfov2isnoq/actions/invoke",
       "oracle.com/oci/compartmentId": "ocid1.compartment.oc1..aaaaaaaaokbzj2jn3hf5kwdwqoxl2dq7u54p3tsmxrjd7s3uu7x23tkegiua"
     },
     "app_id": "ocid1.fnapp.oc1.phx.aaaaaaaaafqfe5nuqtxw4lyjf3wf7vbzwqzmcll3pf3bztcwviagu5qcq6iq",
     "created_at": "2019-03-21T16:33:46.989Z",
     "id": "ocid1.fnfunc.oc1.phx.aaaaaaaaac4lertr6bwpulbgqogsv753afil4zytaazomqxlebdfov2isnoq",
     "idle_timeout": 30,
     "image": "phx.ocir.io/oracle-serverless-devrel/shaunsmith/hello:0.0.9",
     "memory": 128,
     "name": "hello",
     "timeout": 30,
     "updated_at": "2019-03-21T18:16:27.729Z"
   }
   ```

   To get just the invoke endpoint URL, add `--endpoint` to the inspect command:

   `fn inspect f quickstart hello --endpoint`

   Running this command for the example function above, the response would be:

   `https://iagu5qcq6iq.us-phoenix-1.functions.oci.oraclecloud.com/20181201/functions/ocid1.fnfunc.oc1.phx.aaaaaaaaac4lertr6bwpulbgqogsv753afil4zytaazomqxlebdfov2isnoq/actions/invoke`

6. You can now invoke the function using `invokefunc.js` with its endpoint.
   The command syntax is:

   `node invokefunc.js <invoke endpoint url>`

   For example using the invoke endpoint for our `hello` function:

   `node invokefunc.js https://iagu5qcq6iq.us-phoenix-1.functions.oci.oraclecloud.com/20181201/functions/ocid1.fnfunc.oc1.phx.aaaaaaaaac4lertr6bwpulbgqogsv753afil4zytaazomqxlebdfov2isnoq/actions/invoke`

## Understanding `invokefunc.js`

The `invokefunc.js` example is based on the [OCI Node.js request signing
example](https://docs.cloud.oracle.com/iaas/Content/API/Concepts/signingrequests.htm#NodeJS).
The only difference between this code and the signing example is the addition of
code to decrypt the private key using a passphrase.  The changes are noted in
comments in the `sign` function.