const {Module} = require('./module');
const {Operator} = require('./operator');
const {Parser} = require('./parser');
const {Precedence} = require('./precedence');
const {Tree} = require('./tree');


const PARENTHESIS = new class extends Operator {
  constructor() {
    super(Precedence.INSIDE_PAREN);
  }
  /** @override */
  run(values) {
    values.push(new Paren(values.pop()));
  }
};


class Paren extends Tree.Unary {
  [Visitor.show](arg, precedence) {
    return arg.visit(this.precedence);
  }
}


const CALL = new Operator.Binary {
  
}


class Call extends Tree.Binary {
  /** @override */
  run(left, right) { throw new Error('Unused'); }
  /** @override */
  eval(state) {
    if (!(args[0] instanceof Name)) throw new Error('Not callable');
    const params = args[1] instanceof Comma ? args[1].args : [args[1]];
    const func = state.functions[args[0].name];
    if (!func) throw new Error('Unknown function: ' + args[0].name);
    return func(state, ...params);

    // this shouldn't be a tree - instead, push the
    // dedicated Tree for the call itself...
    // so state.functions: Object<function(new: Tree, ...!Tree)>


    // TODO(sdh): transform params via eval?  or save it for funcs?
    //  - if we ever want a macro, then we need to save for later...

    // TODO - for macros, it's not clear how this is supposed to work
    //  - i.e. if we;re doing this in eval, then the only option is to
    //    return a result, not a Tree - so if we pass to another macro,
    //    it will not be able to see the unevaluated version at all...?
  }
}


const CALL = new class extends Operator {
  constructor() {
    super(-Infinity, -1);
  }
  /** @override */
  run(values) {
    const args = values.pop();
    const func = values.pop();
    values.push(new Call(func, args));
  }
}



class Comma extends Tree.Variadic {
  /** @override */
  run(args) {
    return args;
  }
}


Comma.OPERATOR = new Operator.Variadic(-Infinity, Comma);



class Paren extends Tree.Unary {
  /** @override */
  run(arg) {
    return arg;
  }
}


/** @type {!Module} */
const PAREN = new Module(
    'paren',
    [
      new Parser.Fixed('vv', '(', (values, ops) => ops.push(LPAREN)),
      new Parser.Fixed('oo', ')', (values, ops) => {
        while (ops.length) {
          const top = ops.pop();
          top.run(values);
          if (top == LPAREN) break;
        }
      }),
      new Parser.Fixed('ov', ',', (values, ops) => ops.push(Comma.OPERATOR)),
      new Parser.Fixed('ov', '(', (values, ops) => ops.push(CALL)),
      // support nullary funcs
      new Parser.Fixed('oo', '()', (values, ops) => {
        values.push(new Comma([]));
        CALL.run(values);
      }),
    ]);



/**
 * Parser for parens.
 * @param {!Calculator<?>} calc
 */
function addParens(calc) {
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


module.exports = {PAREN};
