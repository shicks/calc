const {Calculator} = require('./calc');
const {addNumbers, addParens, addArithmetic} = require('./ast');

const c = new Calculator();
addNumbers(c);
addArithmetic(c);
addParens(c);

console.log(c.evaluate('2 * (4 + 5)'));
