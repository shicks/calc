// Represent different kinds of numbers.
//   Floats: number
//   Ints and rationals: class Rat { num: number[], den: number[] }
//   Complex: class Complex { re: number, im: number }
//   Dimensions: class Dimen { val: number. unit: string }


// TODO - how to abstract over bigint (available behind flag latest chrome),
// bignum (only on node), or our own JS implementation?  - how to even use
// bigint without syntax issues?  Could use an eval() to produce some helpers.

//   - a wrapper object seems not great.
//   - isInt method - checks instanceof and typeof?
//   - int.* methods
//   - probably want to do a quick test at start and guarantee only one kind
//     of bigint is floating around in the wild.

// OR... do something more like a polyfill - preprocess to avoid?
//  - if we're on node, no reason to use bigint at all? just stick w/ bignum
//  - for browser, pull in different file which uses one or the other via
//    static methods, including an 'isInt' method...
//  - may not want to always trim - keep better track of int vs float?

// Long.isSafeInteger() method?


// OR... just wait on longs until language support lands in Node and browsers.
//  - may be a couple years, but we're going pretty slow anyway.

// webpack has a ProvidePlugin:
//  https://stackoverflow.com/questions/35061399/bignumber-usage-with-webpack-angular
//  where we could link to a polyfill that uses es2019 bigint but falls back on
//  https://www.npmjs.com/package/big-integer if necessary...?


class Rat {
  /**
   * @param {!Array<number>} num
   * @param {!Array<number>} den
   */
  constructor(num, den) {
    /** @const */
    this.num = num;
    /** @const */
    this.den = den;
  }
}



const ADD = new DynamicFunctionBuilder(2, 'add');
ADD.handle(BigInt, BigInt).with((x, y) => x + y);
ADD.handle(Rat, Rat).coercing(BigInt, Rat, Rat.of).with(Rat.add);
ADD.handle(Number, Number)
    .coercing([BigInt, Rat], Number, Number)
    .with((x, y) => x + y);

// NOTE - we have a lot of redundancy here with extra coercions.
// It would be nice to specify them once and just chain them?
// But in that case we really want to precompile it, since it's
// a lot of chaining.  We could use Function.prototype.toString
// to optionally precompile when possible without breaking when
// we can't.  Note: this will be 36 functions per operation, with
// 50 operations -> thousands of functions -> megabytes of RAM,
// though this isn't any worse than using closures (and may be
// better).  We can parse ("x => Number(x)" and "function Number()
// { [native code] }", but passing "Dimension.unitless" will map
// to "unitless(x) { return new Dimension(x, UNITLESS); }" which
// is useless with the module-scoped variables... but we *can* tell
// that it's a method and so just use that, assuming the eval
// closes over it correctly (which might be tricky if we're chaining).

ADD(Dimension, Dimension)
    .coercing(Number, Dimension, Dimension.unitless)
    .coercing(BigInt, Dimension, x => Dimension.unitless(Number(x)))
    .with(Dimension.add);


// We could possibly avoid extra closures by storing an array in the table:
//   'ni' => [(x, y) => x + y, null, Number]
// Then we iterate over the args and call them to convert - maybe avoid chaining
// with a factory across multiple builders:

const base = new DynamicFunctionFactory()
    .coerce(Number, Tree, Tree.constant)
    .coerce(BigInt, Tree, Tree.constant)
    .coerce(Rat, Tree, Tree.constant)
    .coerce(Dimension, Tree, Tree.constant)
    .coerce(Complex, Tree, Tree.constant)
    .coerce(Number, Complex, Complex.real)
    .coerce(Number, Dimension, Dimension.unitless)

const safeBigInt = (x) => {
  if (Number.isSafeInteger(x)) return BigInt(x);
  x = String(Math.trunc(x));
  // TODO - If there's a (decimal and)? 'e+' then we need to normalize it away.
  return BigInt(x);
};

const intOp = base
    .coerce(Number, BigInt, safeBigInt)
    .coerce(Rat, BigInt, Rat.trunc);

const floatOp = base
    .coerce(Rat, Number, Number)
    .coerce(BigInt, Number, Number)
    .coerce(BigInt, Rat, Rat.of);


const op = {
  add: (x, y) => x + y,
};

ADD = floatOp.create();
ADD.handle(BigInt, BigInt).with(op.add);
ADD.handle(Rat, Rat).with(Rat.add);
ADD.handle(Number, Number).with(op.add);
ADD.handle(Dimension, Dimension).with(Dimension.add);
ADD.handle(Complex, Complex).with(Complex.add);
ADD.handle(Tree, Tree).with(Tree.add);

SUB = floatOp.make([
  [BigInt, BigInt, op.sub],
  [Rat, Rat, Rat.sub],
  [Number, Number, op.sub],
  [Dimension, Dimension, Dimension.sub],
  [Complex, Complex, Complex.sub],
  [Tree, Tree, Tree.sub],
]);

// Generally these binops are homogeneous
// Let's think about one that isn't - pow
// or scalar multiplication?
// or matrix-vector math?

POW = floatOp.make([
  [Rat, BigInt, whatGoesHere],
]);



// What about integer ops?

GCD = intOp.make([
  [BigInt, BigInt, gcd],
]);

// will call this instead of POW if there's a mod set?
// what does the Tree version do?  Maybe nothing - maybe
// it can't happen because it doesn't eval, or maybe we
// just fall back on not caring what the mod is so that
// it just reevaluates when necessary...?
POWM = intOp.make([
  [BigInt, BigInt, BigInt, powm], // a^b (mod m)
]);



Tree.pow = Tree.binary(
  (state, x, y) => {
    return state.modulus ? POWM(x, y, state.modulus) : POW(x, y);
  });


// or maybe we need a totally separate set of ops for mod?

Tree.pow = Tree.binary(Op.POW);

// and then when we load the modulus we swap in
state.operatorTable = modulusTable(m)

// ... that seems reasonable?



ADD.handle(Number, Number).with((x, y) => x + y);
ADD.handle(Number, BigInt).with((x, y) => x + Number(y));
ADD.handle(BigInt, Number).with((x, y) => Number(x) + y);

ADD.handle(Number, BigInt).with((x, y) => x + Number(y)).commutatively();
ADD.handle(Number, BigInt).commutative().with((x, y) => x + Number(y));




/** @abstract */
class BinOp {
  
}

const cmp = (x, y) => x < y ? -1 : x > y ? 1 : 0;

const OPS = Symbol`OPS`;
Number.prototype[OPS] = {
  // Binary math ops
  '+n': (x, y) => x + y,
  '+i': (x, y) => x + Number(y),
  '+r': (x, y) => x + Number(y),
  '+d': (x, y) => Dimension.add(Dimension.unitless(x), y),
  '+c': (x, y) => Complex.add(Complex.real(x), y),
  '+t': (x, y) => Tree.add(Tree.constant(x), y);
  '-n': (x, y) => x - y,
  '-i': (x, y) => x - Number(y),
  '-r': (x, y) => x - Number(y),
  '-d': (x, y) => Dimension.sub(Dimension.unitless(x), y),
  '-c': (x, y) => Complex.sub(Complex.real(x), y),
  '-t': (x, y) => Tree.sub(Tree.constant(x), y),
  '*n': (x, y) => x * y,
  '*i': (x, y) => x * Number(y),
  '*r': (x, y) => x * Number(y),
  '*d': (x, y) => y.scalarMul(x),
  '*c': (x, y) => y.scalarMul(x),
  '*t': (x, y) => Tree.mul(Tree.constant(x), y),
  '/n': (x, y) => x / y,
  '/i': (x, y) => x / Number(y),
  '/r': (x, y) => x / Number(y),
  '/d': (x, y) => Dimension.div(Dimension.unitless(x), y),
  '/c': (x, y) => Complex.div(Complex.real(x), y),
  '/t': (x, y) => Tree.div(Tree.constant(x), y),
  '%n': (x, y) => x % y,
  '%i': (x, y) => x % Number(y),
  '%r': (x, y) => x % Number(y),
  '%d': (x, y) => Dimension.mod(Dimension.unitless(x), y),
  '%c': notAllowed('Modulo arithmetic with complex numbers'),
  '%t': (x, y) => Tree.mod(Tree.constant(x), y),
  '**n': (x, y) => x ** y,
  '**i': (x, y) => x ** Number(y),
  '**r': (x, y) => x ** Number(y),
  '**d': (x, y) => x ** y.ensureUnitless(),
  '**c': (x, y) => Complex.exp(y.scalarMul(Math.log(x))),
  '**t': (x, y) => Tree.pow(Tree.constant(x), y),
  // Binary number thoery ops
    // ??? gcd, invm, 
    // -- should these be defined only for int types?
    // -- what about global state for mod M pow?
    // -- how does this work w/ declarative / trees / etc?
    // ----- assignment is still maybe okay?
  // Calculus operations?
    // where does diff go?  it's a prop of the op, not the number...
  // Binary comparators
    // - note: we could get by with just == and <> for most cases,
    //   but we can't post-process tree results, so we need all 6?
    // - it's also possible we skip the tree versions from this list,
    //   since it *does* create a circular dependency, where Tree.add
    //   needs to call num.add, but num.add calls Tree.add for trees...
    // - but without this, it's a pain because we need to explicitly
    //   check if either arg is a tree and if so then take a special
    //   path with Tree.constants...
  '==n': (x, y) => x == y,
  '==i': (x, y) => x == Number(y),
  '==r': (x, y) => x == Number(y),
  '==d': (x, y) => y.isUnitless() && x == y.ensureUnitless(),
  '==c': (x, y) => x == y.re && y.im == 0,
  '==t': (x, y) => Tree.eq(Tree.constant(x), y),
  '!=n': (x, y) => x != y,
  '!=i': (x, y) => x != Number(y),
  '!=r': (x, y) => x != Number(y),
  '!=d': (x, y) => !y.isUnitless() || x != y.ensureUnitless(),
  '!=c': (x, y) => x != y.re || y.im != 0,
  '!=t': (x, y) => !Tree.eq(Tree.constant(x), y),
  '<>n': (x, y) => cmp(x, y),
  '<>i': (x, y) => cmp(x, Number(y)),
  '<>r': (x, y) => cmp(x, Number(y)),
  '<>d': (x, y) => cmp(x, y.ensureUnitless()),
  '<>c': notAllowed('Inequality with complex numbers'),
  '<>t': (x, y) => Tree.cmp(Tree.constant(x), y),
  '<n': (x, y) => cmp(x, y) < 0,
  '<i': (x, y) => cmp(x, Number(y)) < 0,
  '<r': (x, y) => cmp(x, Number(y)) < 0,
  '<d': (x, y) => cmp(x, y.ensureUnitless()) < 0,
  '<c': notAllowed('Inequality with complex numbers'),
  '<t': (x, y) => Tree.lt(Tree.constant(x), y),
  '<=n': (x, y) => cmp(x, y) <= 0,
  '<=i': (x, y) => cmp(x, Number(y)) <= 0,
  '<=r': (x, y) => cmp(x, Number(y)) <= 0,
  '<=d': (x, y) => cmp(x, y.ensureUnitless()) <= 0,
  '<=c': notAllowed('Inequality with complex numbers'),
  '<=t': (x, y) => Tree.le(Tree.constant(x), y),
  '>n': (x, y) => cmp(x, y) > 0,
  '>i': (x, y) => cmp(x, Number(y)) > 0,
  '>r': (x, y) => cmp(x, Number(y)) > 0,
  '>d': (x, y) => cmp(x, y.ensureUnitless()) > 0,
  '>c': notAllowed('Inequality with complex numbers'),
  '>t': (x, y) => Tree.gt(Tree.constant(x), y),
  '>=n': (x, y) => cmp(x, y) >= 0,
  '>=i': (x, y) => cmp(x, Number(y)) >= 0,
  '>=r': (x, y) => cmp(x, Number(y)) >= 0,
  '>=d': (x, y) => cmp(x, y.ensureUnitless()) >= 0,
  '>=c': notAllowed('Inequality with complex numbers'),
  '>=t': (x, y) => Tree.ge(Tree.constant(x), y),
  // Binary bitwise ops
  '&n': (x, y) => x & y,
  '&i': (x, y) => BigInt(x) & y,
  '&r': notAllowed('Bitwise operations with rationals'),
  '&d': notAllowed('Bitwise operations with dimensions'),
  '&c': notAllowed('Bitwise operations with complex numbers'),
  '&t': (x, y) => Tree.and(Tree.constant(x), y),
  '|n': (x, y) => x | y,
  '|i': (x, y) => BigInt(x) | y,
  '|r': notAllowed('Bitwise operations with rationals'),
  '|d': notAllowed('Bitwise operations with dimensions'),
  '|c': notAllowed('Bitwise operations with complex numbers'),
  '|t': (x, y) => Tree.or(Tree.constant(x), y),
  '^n': (x, y) => x ^ y,
  '^i': (x, y) => BigInt(x) ^ y,
  '^r': notAllowed('Bitwise operations with rationals'),
  '^d': notAllowed('Bitwise operations with dimensions'),
  '^c': notAllowed('Bitwise operations with complex numbers'),
  '^t': (x, y) => Tree.xor(Tree.constant(x), y),
  // Unary ops
  '-': x => -x,
  '!': x => !x,
  '~': x => ~x,
  'sin': Math.sin,
  'cos': Math.cos,
  'tan': Math.tan,
  'sinh': Math.sinh,
  'cosh': Math.cosh,
  'tanh': Math.tanh,
  'exp': Math.exp,
  'log': Math.log,
  'log2': Math.log2,
  'log10': Math.log10,
  'abs': Math.abs,
  'sqrt': Math.sqrt,
  'floor': Math.floor,
  'ceil': Math.ceil,
  'min': Math.min,
  'max': Math.max,
};





const TYPE = Symbol`TYPE`;

const WITH_NUM = Symbol`WITH_NUM`;
const WITH_INT = Symbol`WITH_INT`;
const WITH_RAT = Symbol`WITH_RAT`;
const WITH_DIMEN = Symbol`WITH_DIMEN`;
const WITH_COMPLEX = Symbol`WITH_COMPLEX`;
const WITH_TREE = Symbol`WITH_TREE`;

const WITH = Symbol`WITH`;

const ADD = Symbol`ADD`;

Number.prototype[WITH_DIMEN] = x => Dimension.unitless(x);
Number.prototype[WITH_COMPLEX] = x => Complex.real(x);

Number.prototype[TYPE] = 'n';
Rat.prototype[TYPE] = 'r';
Complex.prototype[TYPE] = 'c';
Dimension.prototype[TYPE] = 'd';
Tree.prototype[TYPE] = 't';

if (typeof BigInt == 'function') {
  BigInt.prototype[TYPE] = 'i';
  BigInt.prototype[WITH_NUM] = x => Number(x);
  BigInt.prototype[WITH_RAT] = x => Rat.of(x, 1);
  BigInt.prototype[WITH_DIMEN] = x => Dimension.unitless(Number(x));
  BigInt.prototype[WITH_COMPLEX] = x => Complex.real(Number(x));
  BigInt.prototype[ADD] = (x, y) => x + y;
  BigInt.prototype[SUB] = (x, y) => x - y;
  BigInt.prototype[MUL] = (x, y) => x * y;
  BigInt.prototype[DIV] = (x, y) => x / y;
  BigInt.prototype[MOD] = (x, y) => x % y;
}

Rat.prototype[WITH_NUM] = x => Number(x);
Rat.prototype[WITH_DIMEN] = x => Dimension.unitless(Number(x));
Rat.prototype[WITH_COMPLEX] = x => Complex.real(Number(x));

Dimension.prototype[WITH_COMPLEX] = incompatible('dimension and complex');



Number.prototype[WITH] = WITH_NUM;
BigInt.prototype[WITH] = WITH_INT;
Rat.prototype[WITH] = WITH_RAT;
Dimension.prototype[WITH] = WITH_DIMEN;
Complex.prototype[WITH] = WITH_COMPLEX;
Tree.prototype[WITH] = WITH_TREE;

Number.prototype[ADD] = (x, y) => x + y;

const op = (sym) => (x, y) => {
  let w = x[y[WITH]];
  if (w) {
    x = w(x);
  } else {
    w = y[x[WITH]];
    if (w) y = w(y);
  }
  return x[sym](y);
};



const num = {
  add: op(ADD),
  sub: op(SUB),
};
