const mongoose = require("mongoose");

const phoneSchema = mongoose.Schema({
  number: String,
  internationalNumber: String,
  nationalNumber: String,
  e164Number: String,
  countryCode: String,
  dialCode: String

});

module.exports.phoneSchema = phoneSchema;