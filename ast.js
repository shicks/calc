/**
 * A parsed tree of tokens.
 * @record
 * @template T
 */
class Tree {
  /**
   * Evaluates the tree.  Returns a value of type T.  May update the state.
   * @param {!Object} state
   * @return {T}
   */
  eval(state) {}
}



/**
 * Parser for parens.
 * @param {!Calculator<?>} calc
 */
function addParens(calc) {
  const LPAREN = {
    precedence: -Infinity,
    assoc: 1,
    run() {},
  };
  calc.addParser({
    expect: 'v',
    pattern: '(',
    push(values, ops) {
      ops.push(LPAREN);
      return 'v';
    },
  });
  calc.addParser({
    expect: 'o',
    pattern: ')',
    push(values, ops) {
      while (ops.length) {
        const top = ops.pop();
        if (top == LPAREN) break;
        top.run();
      };
      values.push(new UnaryOp(values.pop(), '()', x => x));
      return 'o';
    },
  });

  // TODO - commas, function calls?

}

/**
 * Parser for numbers.
 * @param {!Calculator<T>} calc
 * @param {function(number): T} generate
 */
function addNumbers(calc, generate = (x => x)) {
  calc.addValue(
      /^[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/,
      ([n]) => new Constant(generate(Number(n))));
}

/**
 * Parsers for arithmetic.
 * @param {!Calculator<number>} calc
 */
function addArithmetic(calc) {
  // TODO - consider wrapping this in a class with wrapNumber and unwrapNumber
  // methods?

  /**
   * @param {!Calculator<T>} calc
   * @param {number} precedence
   * @param {string} op
   * @param {function(T, T): T} func
   */
  function addInfixl(calc, precedence, op, func) {
    calc.addInfixl(
      precedence, op, (left, right) => new BinaryOp(left, right, op, func));
  }
  /**
   * @param {!Calculator<T>} calc
   * @param {number} precedence
   * @param {string} op
   * @param {function(T, T): T} func
   */
  function addInfixr(calc, precedence, op, func) {
    calc.addInfixr(
      precedence, op, (left, right) => new BinaryOp(left, right, op, func));
  }

  // Any way to add these as "libraries" so that we could write
  // :load exponent ^ and it installs it as ^ instead of ** ?
  //   - would probably need to iterate over parsers in reverse
  calc.addPrefix('-', (arg) => new UnaryOp(arg, '-', x => -x));
  calc.addPrefix('+', (arg) => new UnaryOp(arg, '+', x => +x));
  calc.addPrefix('!', (arg) => new UnaryOp(arg, '!', x => !x));
  calc.addPrefix('~', (arg) => new UnaryOp(arg, '~', x => ~x));
  addInfixr(calc, 14, '^', (a, b) => a ** b);
  addInfixl(calc, 13, '%', (a, b) => a % b);
  addInfixl(calc, 13, '*', (a, b) => a * b);
  addInfixl(calc, 13, '/', (a, b) => a / b);
  addInfixl(calc, 12, '-', (a, b) => a - b);
  addInfixl(calc, 12, '+', (a, b) => a + b);
  addInfixl(calc, 11, '<<', (a, b) => a << b);
  addInfixl(calc, 11, '>>>', (a, b) => a >>> b);
  addInfixl(calc, 11, '>>', (a, b) => a >> b);
  addInfixl(calc, 10, '<=>', (a, b) => a >> b);
  addInfixl(calc, 9, '<=', (a, b) => a <= b);
  addInfixl(calc, 9, '<', (a, b) => a < b);
  addInfixl(calc, 9, '>=', (a, b) => a >= b);
  addInfixl(calc, 9, '>', (a, b) => a > b);
  addInfixl(calc, 8, '==', (a, b) => a == b);
  addInfixl(calc, 8, '!=', (a, b) => a != b);
  // bitwise & 6, ^ 5, | 4, logical && 3, || 2
}

/**
 * @template T
 */
class Constant {
  /** @param {T} value */
  constructor(value) {
    /** @const */
    this.value = value;
  }

  /** @return {T} */
  eval() {
    return this.value;
  }
}

/**
 * @template T
 */
class BinaryOp {
  /**
   * @param {!Tree<T>} left
   * @param {!Tree<T>} right
   * @param {string} op
   * @param {function(T, T): T} func
   */
  constructor(left, right, op, func) {
    /** @const */
    this.left = left;
    /** @const */
    this.right = right;
    /** @const */
    this.op = op;
    /** @const */
    this.func = func;
  }

  /** @return {T} */
  eval() {
    return this.func(this.left.eval(), this.right.eval());
  }
}

/**
 * @template T
 */
class UnaryOp {
  /**
   * @param {!Tree<T>} arg
   * @param {string} op
   * @param {function(T): T} func
   */
  constructor(arg, op, func) {
    /** @const */
    this.arg = arg;
    /** @const */
    this.op = op;
    /** @const */
    this.func = func;
  }

  /** @return {T} */
  eval() {
    return this.func(this.arg.eval());
  }
}

module.exports = {
  addParens,
  addNumbers,
  addArithmetic,
};
