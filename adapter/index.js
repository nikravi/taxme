const { Requester, Validator } = require("@chainlink/external-adapter");
require("dotenv").config();

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === "Error") return true;
  return false;
};

// Define custom parameters to be used by the adapter.
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
  endpoint: false,
};

const NORMALIZE_COEF = 100000;

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams);
  const jobRunID = validator.validated.id;
  const url = `http://api.salestaxapi.ca/v2/province/all`;

  const config = {
    url,
    params: {},
    headers: {},
  };

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then((response) => {
      const canadaTaxes = [];
      const { data: provinces } = response;
      let agreedGst = 0;

      for (let province in provinces) {
        const { gst, pst } = provinces[province];
        const normalizedPST = Math.floor(pst * NORMALIZE_COEF);
        const normalizedGST = Math.floor(gst * NORMALIZE_COEF);

        if (!agreedGst) agreedGst = normalizedGST;
        else if (agreedGst !== normalizedGST) {
          throw new Error("Multiple Gst Rates Found");
        }
        canadaTaxes.push(province.toUpperCase().concat(`.${normalizedPST}`));
      }
      canadaTaxes.push("GST".concat(`.${agreedGst}`));

      callback(
        response.status,
        Requester.success(jobRunID, {
          data: { serializedGst: canadaTaxes.toString() },
        })
      );
    })
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error));
    });
};

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data);
  });
};

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data);
  });
};

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false,
    });
  });
};

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest;
