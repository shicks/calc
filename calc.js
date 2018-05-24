const State = require('./state');

/** The main calculator class. */
class Calculator {
  /** @param {!State=} state */
  constructor(state = new State()) {
    /** @private @const */
    this.state_ = state;
    /** @private @const {!Object<string, !Set<Parser>>} */
    this.parsers_ = {'v': new Set(), 'o': new Set()};
  }

  /** @param {!Parser} parser */
  addParser(parser) {
    this.parsers_[parser.expect].add(parser);
  }

  /** @param {!Parser} parser */
  removeParser(parser) {
    this.parsers_[parser.expect].delete(parser);
  }

  /**
   * @param {string} name
   * @param {function(...?): *} func
   */
  addFunction(name, func) {
    // TODO(sdh): check first?
    this.state_.functions[name] = func;
  }

  /**
   * @param {string} name
   * @param {function(...?): *} func
   */
  removeFunction(name, func) {
    if (this.state_.functions[name] == func) {
      delete this.state_.functions[name];
    }
  }

  // /**
  //  * @param {string|!RegExp} pattern
  //  * @param {function(!Array<string>): !Tree<T>} generator
  //  * @return {!Calculator<T>}
  //  */
  // addValue(pattern, generator) {
  //   return this.addParser(valueParser(pattern, generator));
  //   // {parser, run: runValue(generator), expectValue: false});
  // }

  // /**
  //  * @param {number} precedence
  //  * @param {string} op
  //  * @param {function(!Tree<T>, !Tree<T>): !Tree<T>} generator
  //  * @return {!Calculator<T>}
  //  */
  // addInfixl(precedence, op, generator) {
  //   return this.addInfix_(precedence, 1, op, generator);
  // }

  // /**
  //  * @param {number} precedence
  //  * @param {string} op
  //  * @param {function(!Tree<T>, !Tree<T>): !Tree<T>} generator
  //  * @return {!Calculator<T>}
  //  */
  // addInfixr(precedence, op, generator) {
  //   return this.addInfix_(precedence, -1, op, generator);
  // }

  // /**
  //  * @param {number} precedence
  //  * @param {string} op
  //  * @param {function(!Tree<T>, !Tree<T>): !Tree<T>} generator
  //  * @return {!Calculator<T>}
  //  */
  // addInfix(precedence, op, generator) {
  //   return this.addInfix_(precedence, 0, op, generator);
  // }

  // /**
  //  * @param {number} precedence
  //  * @param {number} assoc
  //  * @param {string} op
  //  * @param {function(!Tree<T>, !Tree<T>): !Tree<T>} generator
  //  * @return {!Calculator<T>}
  //  * @private
  //  */
  // addInfix_(precedence, assoc, op, generator) {
  //   return this.addParser(infixParser(precedence, assoc, op, generator));
  // }

  // /**
  //  * @param {string} op
  //  * @param {function(!Tree<Tree<T>): !Tree<T>} generator
  //  * @return {!Calculator<T>}
  //  */
  // addPrefix(op, generator) {
  //   return this.addParser(prefixParser(op, generator));
  // }

  // /**
  //  * @param {string} op
  //  * @param {function(!Tree<Tree<T>): !Tree<T>} generator
  //  * @return {!Calculator<T>}
  //  */
  // addPostfix(op, generator) {
  //   return this.parsers.push(postfixParser(op, generator));
  // }

  /**
   * @param {string} expr
   * @return {!Tree<T>}
   */
  parse(expr) {
    return parse(this, expr);
  }

  /**
   * @param {string} expr
   * @return {T}
   */
  evaluate(expr) {
    return parse(this, expr).eval(this.state_);
  }
}


/**
 * @param {!Calculator} calc
 * @param {string} expr
 * @return {!Tree}
 * @template T
 */
function parse(calc, expr) {
  /** @type {!Array<!Tree>} */ 
  let values = [];
  /** @type {!Array<!Op>} */ 
  let ops = [];
  /** @type {string} */
  let expect = 'v';

  function next() {
    // skip whitespace
    expr = expr.replace(/^\s+/, '');
    if (!expr) return;

    // find the longest match
    let best = null;
    for (const parser of this.parsers) {
      const match = parser.match(expr);
      if (match && (!best || best.length <= match.length)) {
        best = match;
      }
    }
    if (!best) throw new Error('Could not parse "' + expr + '"');

    expr = expr.substring(best.length);
    best.push(values, ops);
  }

  while (expr) {
    next();
  }

  while (ops.length > 0) {
    ops.pop().run();
  }

  if (values.length != 1) {
    for (const v of values) console.dir(v);
    throw new Error('Invalid stack state');
  }
  return values[0];
}


module.exports = {Calculator};


// /**
//  * @param {!RegExp|string} pattern
//  * @param {function(!Array<string>): !Tree<T>} generator
//  * @return {!Parser<T>}
//  * @template T
//  */
// function valueParser(pattern, generator) {
//   return {
//     expect: 'v',
//     pattern,
//     push(values, ops, match) {
//       values.push(generator(match));
//       return 'o';
//     },
//   };
// }


// /**
//  * @param {number} precedence
//  * @param {number} assoc
//  * @param {string} op
//  * @param {function(!Tree<T>, !Tree<T>): !Tree<T>} generator
//  * @return {!Parser<T>}
//  * @template T
//  */
// function infixParser(precedence, assoc, op, generator) {
//   return {
//     expect: 'o',
//     pattern: op,
//     push(values, ops) {
//       pushOp(values, ops, {
//         precedence,
//         assoc,
//         run() {
//           if (values.length < 2) throw new Error('Value stack underflow');
//           const right = values.pop();
//           const left = values.pop();
//           values.push(generator(left, right));
//         },
//       });
//       return 'v';
//     },
//   };
// }


// /**
//  * @param {!Array<!Tree<T>> values
//  * @param {!Array<!Op<T>> ops
//  * @param {!Op<T>} op
//  * @template T
//  */
// function pushOp(values, ops, op) {
//   while (ops.length && faster(ops[ops.length-1], op)) {
//     ops.pop().run();
//   }
//   ops.push(op);
// }


// /**
//  * Returns whether top is faster than next.
//  * @param {!Op<T>} top
//  * @param {!Op<T>} next
//  */
// function faster(top, next) {
//   if (top.precedence > next.precedence) return true;
//   if (top.precedence < next.precedence) return false;
//   if (top.assoc != next.assoc) throw new Error('Incompatible associativity');
//   if (top.assoc == 0) throw new Error('Non-associative operator');
//   return top.assoc > 0;
// }


// /**
//  * @param {string} op
//  * @param {function(!Tree<T>): !Tree<T>} generator
//  * @return {!Parser<T>}
//  * @template T
//  */
// function prefixParser(op, generator) {
//   return {
//     pattern: op,
//     expect: 'v',
//     push(values, ops, match) {
//       pushOp(values, ops, {
//         precedence: Infinity,
//         assoc: -1,
//         run() {
//           if (values.length < 1) throw new Error('Value stack underflow');
//           const arg = values.pop();
//           values.push(generator(arg));
//         },
//       });
//       return 'v';
//     },
//   };
// }


// /**
//  * @param {string} op
//  * @param {function(!Tree<T>): !Tree<T>} generator
//  * @return {!Parser<T>}
//  * @template T
//  */
// function postfixParser(op, generator) {
//   return {
//     pattern: op,
//     expect: 'o',
//     expectValue: false,
//     push(values, ops, match) {
//       if (values.length < 1) throw new Error('Value stack underflow');
//       const arg = values.pop();
//       values.push(generator(arg));
//       return 'o';
//     },
//   };
// }


// // TODO - how to handle function calls and commas?
// //  - comma should be the slowest thing ever?
// //  - but it's all lazy, so functions can pull apart the comma
// //  ... need a reasonably consistent AST structure
// //      and will mess up either f((a, b), c) or f(a, (b, c)) dep on assoc
// // Unless comma is smart enough to curry properly...
// //   infix ( pushes a partially-applied function with high precedence
// //   infix , looks to see if such a func is at top of stack (after resolving)
// //      if so, then adds to it, otherwise just does a normal comma
// //   ) also looks...
// // Comma as tuple operator?  Then paren is significant...


// /** @record @template T */
// class Parser {
//   constructor() {
//     /** @type {string} */
//     this.expect;
//     /** @type {!RegExp|string} */
//     this.pattern;
//     /** @type {
//         function(!Array<Tree<T>>, !Array<Op<T>>, !Array<string>): string} */
//     this.push;
//   }
// }


// /** @record @template T */
// class Op {
//   constructor() {
//     /** @type {number} */
//     this.precedence;
//     /** @type {number} */
//     this.assoc;
//     /** @type {function()} */
//     this.run;
//   }
// }
