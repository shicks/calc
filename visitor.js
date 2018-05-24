/** @template P, R */
class Visitor {
  // This pattern generates a new symbol for every subclass....
  static get symbol() {
    const s = Symbol(this.name);
    Object.defineProperties(this, {symbol: {get() { return s; }}});
    Visitor.handlers[s] = true;
    return s;
  }

  /** @return {function(!Tree, P): R} */
  default() {
    return () => { throw new Visitor.NotImplemented(); }
  }

  /**
   * @param {!Object} delegate
   * @param {!Tree} tree
   * @param {P} arg
   * @param {R}
   */
  visit(delegate, tree, arg) {
    delegate[this.symbol] || this.default
  }

  /**
   * @param {!Object} delegate
   * @param {!Tree} tree
   * @param {P} arg
   * @return {{tree: !Tree, visit: function(P=): R}}
   */
  wrap(delegate, tree, arg) {
    const visitor = this;
    return {
      tree,
      visit(newArg) {
        return visitor.visit(
            delegate, tree, newArg !== undefined ? newArg : arg);
      }
    };
  }
}

/** @const {!Visitor<number, string>} */
Visitor.SHOW = new class extends Visitor {
  constructor() { super('show'); }
  default() {
    return () => '[unknown]';
  }
}
/** @const {symbol} */
Visitor.show = Visitor.SHOW.symbol;


/** @const {!Visitor<!State, *>} */
Visitor.EVALUATE = new Visitor('evaluate');
/** @const {symbol} */
Visitor.evaluate = Visitor.EVALUATE.symbol;


/** @const {!Visitor<string, !Tree>} */
Visitor.DIFFERENTIATE = new class extends Visitor {
  constructor() { super('differentiate'); }
  default() {
    throw new Visitor.NotDifferentiable();
  }
}
/** @const {symbol} */
Visitor.differentiate = Visitor.DIFFERENTIATE.symbol;



Visitor.NotImplemented = class extends Error {
  constructor() {
    super('NotImplemented');
  }
}

Visitor.NotDifferentiable = class extends Error {
  constructor() {
    super('NotDifferentiable');
  }
}


// class Plus {

//   [Evaluate.HANDLER](left, right) {
//     return left.visit() + right.visit();
//     //return Evaluate.visit(left, state) + Evaluate.visit(right, state);
//   }

//   [Differentiate.HANDLER]() {
//     return new Plus.Tree(left.visit(), right.visit());
//     // return new Plus.Tree(
//     //     Differentiate.visit(left, x), Differentiate.visit(right, x));
//   }

//   // Implement
//   [Show.HANDLER]() {
    
//   }

// }


  // /** @return {!Iterable<{symbol: symbol, visitor: !Visitor, handler: !Function}>} */
  // static * getHandlers(obj) {
  //   while (obj) {
  //     for (const symbol of Object.getOwnPropertySymbols(obj)) {
  //       const visitor = Visitor.owner[symbol];
  //       if (visitor) {
  //         yield {symbol, visitor, handler: obj[symbol]};
  //       }
  //     }
  //     obj = Reflect.getPrototypeOf(obj);
  //   }
  // }
