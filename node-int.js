try {

  const bignum = require('bignum');

  // TODO(sdh): provide a better parse that supports 0x prefix (just pass 16 as
  // second arg to bignum()) and 0o prefix (needs a by-hand implementation)

  // TODO(sdh): toString only supports 10,16 as well - make a more general version

  module.exports = {
    of: bignum,
    eq: (x, y) => x.eq(y),
    ge: (x, y) => x.ge(y),
    gt: (x, y) => x.gt(y),
    le: (x, y) => x.le(y),
    lt: (x, y) => x.lt(y),
    ne: (x, y) => x.ne(y),
    abs: (x) => x.abs(),
    add: (x, y) => x.add(y),
    and: (x, y) => x.and(y),
    cmp: (x, y) => x.cmp(y),
    cpl: (x) => x.not(),
    div: (x, y) => x.div(y),
    mod: (x, y) => x.mod(y),
    mul: (x, y) => x.mul(y),
    neg: (x) => x.neg(),
    or:  (x, y) => x.or(y),
    pow: (x, y) => x.pow(y),
    shl: (x, y) => x.shiftLeft(y),
    shr: (x, y) => x.shiftRight(y),
    sub: (x, y) => x.sub(y),
    xor: (x, y) => x.xor(y),
    test: (x) => x.ne(0),
    // Also available: sqrt(), root(n), gcd(n), powm(n, m), invertm(m)
  };

} catch (err) {
  module.exports = undefined;
}
