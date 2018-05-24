const {Module} = require('./module');
const {Parser} = require('./parser');
const {Operator} = require('./operator');

// rename to Func ? can we make this a base class?

class Functions {
  // should this be a class?!?
}


Functions.Unary = class extends Tree.Unary {
  /**
   * @param {string} name
   * @param {!Tree} arg
   */
  constructor(name, arg) {
    super(arg);
    this.name = name;
  }

  /**
   * @param {!Tree} g
   * @return {?Tree}
   * @abstract
   */
  runDiff(g) {}

  /**
   * @param {!Tree} x
   * @return {?Tree}
   */
  diff(x) {
    const argprime = arg.diff && arg.diff(x);
    const thisprime = argprime && this.computeDiff(arg);
    return thisprime && new Mul(thisprime, argprime);
  }

  /** @return {function(!State, !Tree): !Tree} */
  static toFunction() {
    return (state, arg) => new this(arg);
  }
}

