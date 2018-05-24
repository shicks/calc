const {Tree} = require('./tree');

/**
 * Parses inputs into trees.
 * @abstract
 */
class Parser {
  /** @param {string} expect */
  constructor(expect) {
    /** @type {string} */
    this.expect;
  }

  /**
   * @param {string} expr
   * @return {?Parser.Match}
   * @abstract
   */
  match(expr) {}


  /**
   * @param {*} tree
   * @return {!Push}
   */
  static pushValue(tree) {
    return (values, ops) => {
      values.push(new Tree.Value(tree));
    };
  }


  /**
   * @param {!Op} op
   * @return {!Push}
   */
  static pushOperator(op) {
    return (values, ops) => {
      while (ops.length && ops[ops.length - 1].bindsTighterThan(op)) {
        ops.pop().run(values);
      }
      ops.push(op);
    };
  }
}


Parser.Fixed = class extends Parser {
  /**
   * @param {string} expectInOut
   * @param {string} name
   * @param {!Push} push
   */
  constructor(expectInOut, name, push) {
    super(expectInOut[0]);
    this.expectOut = expectInOut[1];
    this.name = name;
    this.push = push;
  }

  /** @override */
  match(expr) {
    if (!expr.startsWith(this.name)) return null;
    return {
      length: this.name.length,
      push: (values, ops) => {
        this.push(values, ops);
        return this.expectOut;
      },
    };
  }
}


Parser.RegExp = class extends Parser {
  /**
   * @param {string} expectInOut
   * @param {!RegExp} pattern
   * @param {function(!Array<string>): !Push} push
   */
  constructor(expectInOut, pattern, push) {
    super(expectInOut[0]);
    this.pattern = pattern;
  }

  /** @override */
  match(expr) {
    const match = this.pattern.exec(expr);
    if (!match) return null;
    return this.push(match);
  }
}



/** @record */
Parser.Match = class {
  constructor() {
    /** @type {number} */
    this.length;
  }
  /**
   * @param {!Array<!Tree>} values
   * @param {!Array<!Op>} ops
   * @return {string} New expectation
   */
  push(values, ops) {}
}


/** @typedef {function(!Array<!Tree>, !Array<!Op>)} */
let Push;

module.exports = {Parser};
