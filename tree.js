const {Precedence} = require('./precedence');

/**
 * Base class for all trees.
 * @abstract
 */
class Tree {
  /** @param {!Array<!Tree>} args */
  constructor(args) {
    this.args = args;
  }

  /**
   * @param {!Visitor<P, R>} visitor
   * @param {P} arg
   * @return {R}
   * @abstract
   */
  visit(visitor, arg) {}
}


Tree.Value = class extends Tree {
  /** @param {*} value */
  constructor(value) {
    super([]);
    /** @const */
    this.value = value;
  }

  // TODO(sdh): This boilerplate get repeated over and over again - can we reduce it?
  //  - the issue is in whether it's wrapped, and whether a delegate is used,
  //    but also in handling the varargs vs array destructuring?
  //  - we could move the arg first, or else just always pass an array?
  //  - as it is, we can't use @override on the implementations...
  //    alternatively, just don't use a symbol - then we're back to ordinary methods.
  //    if we just define a common interface for Tree and Operator to implement,
  //    with optional methods, then it should be fine???

  /**
   * @param {!Visitor<P, R>} visitor
   * @param {P} arg
   * @return {R}
   * @template P, R
   */
  visit(visitor, arg) {
    const handler = this[visitor.symbol];
    return handler ? handler.call(this, arg) : return visitor.default([], arg);
  }

  [Visitor.evaluate]() {
    return this.value;
  }

  [Visitor.differentiate]() {
    return new Tree.Value.ZERO;
  }

  [Visitor.show](/** number */ precedence) {
    return precedence > Precedence.PREFIX ?
        '(' + this.value + ')' :
        String(this.value);
  }
};


/** @const */
Tree.Value.ZERO = new Tree.Value(0);
/** @const */
Tree.Value.ONE = new Tree.Value(1);


Tree.Name = class extends Tree {
  /** @param {string} name */
  constructor(name) {
    super([]);
    /** @const */
    this.name = name;
  }

  /**
   * @param {!Visitor<P, R>} visitor
   * @param {P} arg
   * @return {R}
   * @template P, R
   */
  visit(visitor, arg) {
    const handler = this[visitor.symbol];
    return handler ? handler.call(this, arg) : return visitor.default([], arg);
  }

  [Visitor.evaluate](/** !State */ state) {
    if (this.name in state.vars) {
      return state.vars[this.name];
    } else {
      throw new Error('No such variable: ' + this.name);
    }
  }

  [Visitor.differentiate](/** string */ x) {
    return this.name == x ? Tree.Value.ONE : Tree.Value.ZERO;
  }

  [Visitor.show]() {
    return this.name;
  }
};


// TODO(sdh): find a common path whereby args sent to Operation
// trees can be checked for NaN-ness and have that shunt the entire
// result to NaN?  Or just let it happen on eval.


/** @abstract */
Tree.Unary = class extends Tree {
  /**
   * @param {!Tree} arg
   * @param {!Operator.Unary} op
   */
  constructor(arg, op) {
    super([arg]);
    /** @const */
    this.op = op;
  }

  /**
   * @param {!Visitor<P, R>} visitor
   * @param {P} arg
   * @return {R}
   * @template P, R
   */
  visit(visitor, arg) {
    const handler = this[visitor.symbol];
    return handler ? handler.call(this, visitor.wrap(args[0])) : visitor.default([], arg);
  }
};


/** @abstract */
Tree.Binary = class extends Tree {
  // TODO - tree needs to know precedence and associativity in order
  // to stringify and tree-ify correctly...

  /**
   * @param {!Tree} left
   * @param {!Tree} right
   * @param {!Operator.Binary} op
   */
  constructor(left, right) {
    super([left, right]);
    /** @const */
    this.op = op;
  }

  /**
   * @param {!Visitor<P, R>} visitor
   * @param {P} arg
   * @return {R}
   * @template P, R
   */
  visit(visitor, arg) {
    const handler = this[visitor.symbol];
    return handler ?
        handler.call(this, visitor.wrap(args[0]), visitor.wrap(args[1])) :
        visitor.default([], arg);
  }
};


module.exports = {Tree};
