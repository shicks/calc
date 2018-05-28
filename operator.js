const {ASSOCIATIVITY} = require('./precedence');

/** @abstract */
class Operator {
  /**
   * @param {number} precedence
   */
  constructor(precedence) {
    /** @const */
    this.precedence = precedence;
  }

  /**
   * @param {!Array<!Tree>} values
   * @abstract
   */
  run(values);

  /**
   * @param {!Operator} that New operation to push
   * @return {boolean}
   */
  bindsTighterThan(that) {
    if (this.precedence > that.precedence) {
      return true;
    } else if (this.precedence < that.precedence) {
      return false;
    } else if (ASSOCIATIVITY[this.precedence] == 0) {
      throw new Error('Not associative');
    } else {
      return ASSOCIATIVITY[this.precedence] > 0;
    }
  }

  /** @return {function(new: !Tree, ...?)} */
  get tree() {
    const t = this.getTreeInternal();
    Object.defineProperties(this, {tree: {get() { return t; }}});
    return t;
  }

  /**
   * @return {function(new: !Tree, ...?)}
   * @abstract
   */
  getTreeInternal() {}

  /** @return {!Parser} */
  get parser() {
    const p = this.getParserInternal();
    Object.defineProperties(this, {parser: {get() { return p; }}});
    return p;
  }

  /**
   * @return {!Parser}
   * @abstract
   */
  getParserInternal() {}
}


Operator.Unary = class extends Operator {
  /**
   * @param {number} precedence
   * @param {string} name
   */
  constructor(precedence, name) {
    super(precedence);
    /** @const */
    this.name = name;
  }

  /** @override */
  run(values) {
    if (values.length < 1) throw new Error('Value stack underflow');
    const arg = values.pop();
    values.push(new this.tree(arg));
  }

  /** @override */
  getTreeInternal() {
    const op = this;
    return new class extends Tree.Unary {
      /**
       * @param {!Visitor<P, R>} visitor
       * @param {P} arg
       * @return {R}
       */
      visit(visitor, arg) {
        const handler = op[visitor.symbol];
        const wrapped = visitor.wrap(this.args[0], arg);
        if (handler) {
          return handler.call(op, wrapped, arg);
        }
        return visitor.default([wrapped], arg);
      }
    };
  }
};

Operator.Prefix = class extends Operator.Unary {
  constructor(/** string */ name) { super(100, -1, name); }

  /** @override */
  getParserInternal() {
    return new Parser.Fixed('vv', this.name, Parser.pushOperator(this));
  }

  /**
   * @param {{tree: !Tree, visit: function(number): string}} arg
   * @param {number} precedence
   * @return {string}
   */
  [Visitor.show](arg, precedence) {
    const result = this.name + arg.visit(this.precedence);
    return precedence > this.precedence ? '(' + result + ')' : result;
  }
};

Operator.Postfix = class extends Operator.Unary {
  constructor(/** string */ name) { super(101, 1, name); }

  /** @override */
  getParserInternal() {
    return new Parser.Fixed('oo', this.name, Parser.pushOperator(this));
  }

  /**
   * @param {{tree: !Tree, visit: function(number): string}} arg
   * @param {number} precedence
   * @return {string}
   */
  [Visitor.show](arg, precedence) {
    const result = arg.visit(this.precedence) + this.name;
    return precedence > this.precedence ? '(' + result + ')' : result;
  }
};


Operator.Binary = class extends Operator {
  /**
   * @param {number} precedence
   * @param {string} name
   */
  constructor(precedence, name) {
    super(precedence);
    /** @const */
    this.name = name;
  }

  /** @override */
  run(values) {
    if (values.length < 2) throw new Error('Value stack underflow');
    const right = values.pop();
    const left = values.pop();
    values.push(new this.tree(left, right));
  }

  /** @override */
  getTreeInternal() {
    const op = this;
    return new class extends Tree.Binary {
      /**
       * @param {!Visitor<P, R>} visitor
       * @param {P} arg
       * @return {R}
       */
      visit(visitor, arg) {
        const handler = op[visitor.symbol];
        const left = visitor.wrap(this.args[0], arg);
        const right = visitor.wrap(this.args[1], arg);
        if (handler) {
          return handler.call(op, left, right, arg);
        }
        return visitor.default([left, right], arg);
      }
    };
  }

  /** @override */
  getParserInternal() {
    return new Parser.Fixed('ov', this.name, Parser.pushOperator(this));
  }

  [Visitor.show](left, right, precedence) {
    const assoc = ASSOCIATIVITY[this.precedence];
    left = left.visit(this.precedence + (assoc <= 0));
    right = right.visit(this.precedence + (assoc >= 0));
    const result = left + ' ' + this.name + ' ' + right;
    return precedence > this.precedence ? '(' + result + ')' : result;
  }
};


Operator.Binary.WithUnits = class extends Operator.Binary {
  /**
   * @param {!Dimension.Unit} left
   * @param {!Dimension.Unit} right
   * @return {!Dimension.Unit}
   * @abstract
   */
  operateUnits(left, right) {}

  /**
   * @param {number} left
   * @param {number} right
   * @return {number}
   * @abstract
   */
  operate(left, right) {}

  [Visitor.evaluate](left, right) {
    left = left.visit();
    right = right.visit();
    if (left instanceof Dimension || right instanceof Dimension) {
      const unit = operateUnits(Dimension.unit(left), Dimension.unit(right));
      const value = operate(Dimension.value(left), Dimension.value(right));
      return Dimension.of(value, unit);
    }
    return operate(left, right);
  }
}


Operator.Variadic = class extends Operator.Binary {
  /**
   * @param {number} precedence
   * @param {string} name
   */
  constructor(precedence, name) {
    super(precedence, 1);
    /** @const */
    this.name = name;
  }

  // NOTE: acts like a binop w.r.t. parsing (e.g. run).

  getTreeInternal() {
    const op = this;
    return new class extends Tree {
      /**
       * @param {!Visitor<P, R>} visitor
       * @param {P} arg
       * @return {R}
       * @template P, R
       */
      visit(visitor, arg) {
        const handler = op[visitor.symbol];
        if (handler) {
          return handler.call(
            op, args.map(a => visitor.wrap(a, arg)), arg);
        }
        return visitor.default(args, arg);
      }
    };
  }

  /** @override */
  getParserInternal() {
    return new Parser.Fixed('ov', this.name, Parser.pushOperator(this));
  }

  [Visitor.show](arg, precedence) {
     = name + args[0].visit(this.precedence);
    const right = name + args[1].visit(this.precedence);
    const result = left + ' ' + this.name + ' ' + right;
    return precedence > this.precedence ? '(' + result + ')' : result;
  }
};


module.exports = {Operator};
