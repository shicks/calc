const {Functions} = require('./functions');
const {Module} = require('./module');
const {Parser} = require('./parser');
const {Operator} = require('./operator');

class Sin extends Functions.Unary {
  constructor(arg) {
    super('sin', arg);
  }
  compute(x) {
    return Math.sin(x);
  }
  computeDiff(arg) {
    return new Cos(arg);
  }
}

class Cos extends Functions.Unary {
  constructor(args) {
    super('cos', args);
  }
  run(x) {
    return Math.cos(x);
  }
  runDiff(arg) {
    return new Negate(new Sin(arg));
  }
}

class Rand extends Functions.Nullary {
  constructor() {
    super('rand', []);
  }
  compute() {
    return Math.rand();
  }
  computeDiff() {
    return null;
  }
}


/** @type {!Module} */
const MATH = new Module(
    'math',
    [],
    {
      // NOTE: maybe mix these with the parsers?
      // we don't need the dict if they have the
      // name built into them... which they should
      // for stringification purposes?
      'rand': Rand,
      'sin': Sin,
      'cos': Cos,
        // TODO - check DEG/RAD in state
        return Math.sin(arg.eval(state));
      }


module.exports = {MATH};
