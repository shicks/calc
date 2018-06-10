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



/** @abstract */
class BinOp {
  
}
