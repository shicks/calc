const bigInt = require('big-integer');

function nativeBigInt() {
  return typeof BigInt == 'function';
  // TODO(sdh): more exhaustive eval testing?
}

module.exports = nativeBigInt() ? {
  of: BigInt,
  eq: (x, y) => x === y,
  ge: (x, y) => x >= y,
  gt: (x, y) => x > y,
  le: (x, y) => x <= y,
  lt: (x, y) => x < y,
  ne: (x, y) => x !== y,
  abs: (x) => x < 0 ? -x : x,
  add: (x, y) => x + y,
  and: (x, y) => x & y,
  cmp: (x, y) => x < y ? -1 : x > y ? 1 : 0,
  cpl: (x) => ~x,
  div: (x, y) => x / y,
  mod: (x, y) => x % y,
  mul: (x, y) => x * y,
  neg: (x) => -x,
  or:  (x, y) => x | y,
  pow: (x, y) => x ** y,
  shl: (x, y) => x << y,
  shr: (x, y) => x >>> y,
  sub: (x, y) => x - y,
  xor: (x, y) => x ^ y,
  test: (x) => !!x,
} : {
  of: bigInt,
  eq: (x, y) => x.equals(y),
  ge: (x, y) => x.greaterOrEquals(y),
  gt: (x, y) => x.greater(y),
  le: (x, y) => x.lesserOrEquals(y),
  lt: (x, y) => x.lesser(y),
  ne: (x, y) => x.notEquals(y),
  abs: (x) => x.abs(),
  add: (x, y) => x.add(y),
  and: (x, y) => x.and(y),
  cmp: (x, y) => x.compare(y),
  cpl: (x) => x.not(),
  div: (x, y) => x.divide(y),
  mod: (x, y) => x.mod(y),
  mul: (x, y) => x.multiply(y),
  neg: (x) => x.multiply(-1),
  or:  (x, y) => x.or(y),
  pow: (x, y) => x.pow(y),
  shl: (x, y) => x.shiftLeft(y),
  shr: (x, y) => x.shiftRight(y),
  sub: (x, y) => x.subtract(y),
  xor: (x, y) => x.xor(y),
  test: (x) => !x.isZero(),
  // Also available: bigInt.gcd, bigInt.lcm, bigInt.max, bigInt.min,
  // bigInt.prototype.modInv, bigInt.prototype.modPow
};
