const {Module} = require('./module');
const {Operator} = require('./operator');
const {Parser} = require('./parser');
const {Precedence} = require('./precedence');
const {Visitor} = require('./visitor');

const PLUS = new class extends Operator.Binary {
  constructor() { super(Precedence.ADDITION, '+'); }

  [Visitor.evaluate](left, right) {
    return left.visit() + right.visit();
  }



  operate(left, right) {
    // TODO(sdh): consider breaking this out with a sort of
    // visitor pattern?  operateNumber(), operateTree(),
    // etc.  We'd need to upcast if there's a mismatch,
    // so number+tree -> tree+tree
    // This probably means we need a lattice of value types?
    return left + right;
  }

  

}



class Plus extends Tree.Binary {
  constructor(left, right) {
    super(left, right);
  }

  run(left, right) {
    // TODO - need to check args are numbers?
    // what to do with others?  dimensions?  variadics?
    return left + right;
  }

  static parserInternal() {
    return this.infixl(10, '+');
  }
}


const ARITHMETIC = new Module(
  'arithmetic',
  [
    Plus.parser(),
    Minus.parser(),
    Mul.parser(),
    Div.parser(),
    Exponent.parser(),


///////

name.js:

class Name extends Tree.Value {

}


///////

operators.js:

/** @return {Parser.Unary}
static parser() {

}

// or else

/** @param {function(new: Tree.Binary, !Tree, !Tree)} @return {!Parser.Unary} */
