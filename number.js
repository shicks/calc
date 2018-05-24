const {Module} = require('./module');
const {Parser} = require('./parser');


/** @type {!Module} */
const NUMBER = new Module(
    'number',
    [
      // Positive floating point numbers
      // NOTE: don't parse negative here because it binds looser than exponent.
      new Parser.RegExp(
          'vo', 
          /^[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/,
          ([str] => Parser.pushValue(Number(str)))),
      // Hex numbers (TODO: fractions?)
      new Parser.RegExp(
          'vo',
          /^0x([0-9a-f]+)/i,
          ([_, str] => Parser.pushValue(Number.parseInt(str, 16)))),
      // Octal numbers
      new Parser.RegExp(
          'vo',
          /^0o([0-7]+)/i,
          ([_, str] => Parser.pushValue(Number.parseInt(str, 8)))),
      // Binary numbers
      new Parser.RegExp(
          'vo',
          /^0b([01]+)/i,
          ([_, str] => Parser.pushValue(Number.parseInt(str, 2)))),
    ]);



module.exports = {NUMBER};
