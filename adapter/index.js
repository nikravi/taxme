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

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams);
  const jobRunID = validator.validated.id;
  const API_KEY = process.env.API_KEY;
  const url = `https://gstrate-cra-arc.api.canada.ca:443/ebci/ghnf/api/ext/v1/rates`;

  const params = {};

  headers = {
    "user-key": API_KEY,
  };

  // This is where you would add method and headers
  // you can add method like GET or POST and add it to the config
  // The default is GET requests
  // method = 'get'
  // headers = 'headers.....'
  const config = {
    url,
    params,
    headers,
  };

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then((response) => {
      // It's common practice to store the desired value at the top-level
      // result key. This allows different adapters to be compatible with
      // one another.

      const { GstRateProvinceList } = response.data;

      const provinceMapping = GstRateProvinceList.map((province) => {
        let gstArray = [];
        province.GstRateDatePairList.map((gst) => {
          if (gst.ExpiryDate === undefined) {
            gstArray.push(gst.GstRate);
          }
        });

        if (gstArray.length > 1) throw new Error("Multiple Gst Rates Found");
        return { province: province.ProvinceCode, gst: gstArray[0] * 100 };
      });

      callback(
        response.status,
        Requester.success(jobRunID, { data: provinceMapping })
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
