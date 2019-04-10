// Continued logarithms
const {BitSet} = require('./bitset.js');

let LOG = false;

/**
 * A continued logarithm.
 * @implements {Iterable<boolean>}
 */
class CL {
  /**
   * @param {!Iterable<boolean|number|string>} data
   * @param {boolean=} finite
   */
  constructor(data, finite = false) {
    /** @type {?Iterator<boolean>} */
    this.iter = data[Symbol.iterator]();
    /** @const */
    this.bits = new BitSet(); // TODO(sdh): allow passing in initial data?
    /** @const */
    this.finite = finite;
  }

  [Symbol.iterator]() {
    return this.skip(0);
  }

  /**
   * @param {number} index
   * @return {!IterableIterator<boolean>}
   */
  skip(index) {
    if (index < this.bits.size() && this.iter) this.get(index);
    return {
      [Symbol.iterator]() { return this; },
      next: () => {
        if (index < this.bits.size()) {
          return {value: this.bits.get(index++), done: false};
        } else if (!this.iter) {
          return {value: undefined, done: true};
        }
        let {value, done} = this.iter.next();
        value = Number(value); // allow '0' for false.
        if (done) {
          this.iter = null;
        } else {
          this.bits.add(value);
        }
        index++;
        return {value, done};
      },
    };
  }

  /**
   * @param {number} index
   * @return {?boolean}
   */
  get(index) {
    let size = this.bits.size();
    if (index < size) {
      return this.bits.get(index);
    } else if (!this.iter) {
      return null;
    }
    let last = null;
    while (size++ <= index) {
      const {value, done} = this.iter.next();
      if (done) {
        this.iter = null;
        break;
      } else {
        this.bits.add(last = value);
      }
    }
    return last;
  }

  // only shows the currently computed terms
  toDebugString() {
    // NOTE: toDebugString changes as more terms are realized
    if (this.finite) this.toString();
    let parts = ['['];
    const size = this.bits.size();
    for (let index = 0; index < size; index++) {
      let term = this.bits.get(index);
      parts.push(term ? '1' : '0');
    }
    if (this.iter) parts.push('...');
    parts.push(']');
    return parts.join('');
  }

  toString(radix = 10, digits = CL.DIGITS) {
    // NOTE: even finite CLs need a cap on digits, since they might repeat.
    // We could possibly represent the repeat as '3.(142857)'
//console.log('toString('+radix+', '+digits+')');
    digits += 3; // whole, decimal, appprox
    radix = BigInt(radix);
    let parts = []
    let a = 1n;
    let b = 0n;
    let c = 0n;
    let d = 1n;
    let last = null;
    let next = null;
    let index = 0;
    let decimal = '';
    let approx = false;
    for (const e of this) {
      if (approx) break;
//console.log('a='+a+', b='+b+', c='+c+', d='+d+', e='+e);
      index++;
      if (index == 1) {
        parts.push(e ? '' : '-');
        continue;
      } else if (index == 2) {
        if (!e) [a, b, c, d] = [b, a, d, c];
        continue;
      }
      // NOTE: this is slow, might only be worth doing every so often
      // const g = gcd(a, gcd(b, gcd(c, d)));
      // if (g > 1n) {
      //   console.log('reduce by ' + g);
      //   a /= g; b /= g; c /= g; d /= g;
      // }
      if (e) {
        if (!(b & 1n) && !(d & 1n)) {
          b >>= 1n;
          d >>= 1n;
        } else {
          a <<= 1n;
          c <<= 1n;
        }
      } else {
        [a, b, c, d] = [a + b, a, c + d, c];
        // TODO(sdh): check for gcd? may never get one...
      }
      while (c && d && (a || b) && !approx) {
        last = b / d;
        next = a / c;
//console.log('last='+last+', next='+next);
        if (last == next) {
          if (parts.length == 2) parts.push(decimal = '.');
          parts.push(last.toString(Number(radix)));
          a = radix * (a - c * last);
          b = radix * (b - d * last);
          if (last < 0n) {
            [a, b] = [-a, -b]
          }
          // Note: it's possible that the first few digits can be reduced if
          // there's a GCD != 1 after multiplying the radix - but once we reach
          // unity, there's no point checking going forward since it will never
          // happen again.
          if (parts.length > digits) approx = true;
        } else break;
      }
    }
    if (index == 0) {
      return '0';
    } else if (index == 1) {
      return parts[0] + '1';
    }
    b += 2n * a;
    d += 2n * c;
    while (!approx && b && d) {
      next = b / d;
      if (parts.length == 2) parts.push('.');
      parts.push(next.toString(Number(radix)));
      b = radix * (b - d * next);
      if (parts.length > digits) approx = true;
    }
    // TODO - if the last digit was >= half, round up
    // the previous one - may cause chaining carries!
    //   -- basically we need to sit on all (radix-1) terms, plus one term
    //      preceding, until we either see a smaller term or else finish.
    //      If we finish with >=radix/2 then just increment the last smaller
    //      term and drop all the radix-1 terms.  This should be a generator.
    if (approx) {
      radix = Number(radix);
      const nine = (radix - 1).toString(radix);
      const incr = (digit) => {
        const whole = parts[1];
        parts.splice(1, 1, ...whole.split(''));
        while (true) {
          if (digit == 0) {
            parts.splice(1, 0, '1');
            break;
          } else if (parts[digit] == nine) {
            parts[digit] = '0';
            digit--;
          } else if (parts[digit] == '.') {
            digit -= 2;
          } else {
            break;
          }
        }
      }
      // if (Number.parseInt(parts.pop(), radix) * 2 >= radix) {
      //   incr(parts.length - 1);
      // }
      if (approx) parts.push('...');
    }
    while (parts[parts.length - 1] == '0' && decimal) {
      parts.pop();        
    }
    if (parts[parts.length - 1] == '.') {
      parts.pop();
    }
    return parts.join('');
  }

  toFrac(radix = 10, terms = this.finite ? Infinity : CL.PRECISION) {
//console.log('toString('+radix+', '+digits+')');
    radix = Number(radix);
    let a = 1n;
    let b = 0n;
    let c = 0n;
    let d = 1n;
    let index = 0;
    for (const e of this) {
//console.log('a='+a+', b='+b+', c='+c+', d='+d+', e='+e);
      if (index++ >= terms) break;
      if (index == 1) {
        if (!e) a = -a;
        continue;
      } else if (index == 2) {
        if (!e) [a, b, c, d] = [b, a, d, c];
        continue;
      }
      if (e) {
        if (!(b & 1n) && !(d & 1n)) {
          b >>= 1n;
          d >>= 1n;
        } else {
          a <<= 1n;
          c <<= 1n;
        }
      } else {
        [a, b, c, d] = [a + b, a, c + d, c];
        // TODO(sdh): check for gcd? may never get one...
      }
    }
    const x = BigInt(Math.min(2, index));
    b += a * x;
    d += c * x;
    const g = gcd(b, d);
    b /= g;
    d /= g;
    if (d == 1n) return b.toString(radix);
    return b.toString(radix) + '/' + d.toString(radix);
  }

  valueOf() {
    let a = 1n;
    let b = 0n;
    let c = 0n;
    let d = 1n;
    let last = NaN;
    let next = NaN;
    let index = 0n;
    for (const e of this) {
      if (index == 0n) {
        a = e ? 1n : -1n;
        index++;
        continue;
      } else if (index == 1n) {
        if (!e) [a, b, c, d] = [b, a, d, c];
        index++;
        continue;
      }
      if (e) {
        if ((b & 1n) || (d & 1n)) {
          a <<= 1n;
          c <<= 1n;
        } else {
          b >>= 1n;
          d >>= 1n;
        }
      } else {
        [a, b, c, d] = [a + b, a, c + d, c];
        // TODO(sdh): check for gcd? may never get one...
      }
      if ((next = Number(2n * a + b) / Number(2n * c + d)) == last) {
        return next;
      }
      last = next;
    }
    return Number(index * a + b) / Number(index * c + d);
  }

  reciprocal() {
    const iter = this[Symbol.iterator]();
    return new CL(function * () {
      let result = iter.next();
      if (result.done) {
        // infinity
        while (true) yield 1;
      }
      yield result.value;
      result = iter.next();
      if (result.done) return;
      yield 1 - result.value;
      yield * iter;
    }(), this.finite && this.get(0) != null);
  }

  negate() {
    const iter = this[Symbol.iterator]();
    return new CL(function * () {
      let result = iter.next();
      if (result.done) return;
      yield 1 - result.value;
      yield * iter;
    }(), this.finite);
  }

  abs() {
    const iter = this[Symbol.iterator]();
    return new CL(function * () {
      let result = iter.next();
      if (result.done) return;
      yield 1;
      yield * iter;
    }(), this.finite);
  }

  cmp(that) {
    const precision = this.finite || that.finite ? Infinity : CL.PRECISION;
    const thisIter = this[Symbol.iterator]();
    const thatIter = that[Symbol.iterator]();
    let index = 0;
    let sign = 1;
    for (let index = 0; index < precision; index++) {
      let {value: left, done: leftDone} = thisIter.next();
      let {value: right, done: rightDone} = thatIter.next();
      if (leftDone) left = 0.5;
      if (rightDone) right = 0.5;
      if (left != right) return sign * (left - right);
      if (leftDone) return 0;
      if (left == 0) sign *= -1;
    }
  }

  /**
   * Make a finite continued logarithm.
   * @param {number|bigint|string|!Array<number|bigint|string>} number
   *     The number.  A rational may be given using a two-element array.
   * @param {number|bigint=} radix Only applies to string inputs.
   * @return {!CL}
   */
  static of(number, radix = 10) {
//console.log(`CL.of(${number})`);
    radix = Number(radix);
    if (typeof number == 'string' && number.includes('/')) {
      number = number.split(/\s*\/\s*/);
    }
    if (number instanceof Array) {
      // parse top and bottom.
      if (number.length != 2) throw new Error('CL.of expects 2-element array');
      const [topTop, topBottom] = parseRat(number[0], radix);
      const [bottomTop, bottomBottom] = parseRat(number[1], radix);
      return ofRat(topTop * bottomBottom, topBottom * bottomTop);
    }
    return ofRat(...parseRat(number, radix));
  }

  static fromNonstandardContinuedFraction(cf, matrix = undefined) {
    return ofNonstandardCf(cf, matrix);
  }
}

CL.PRECISION = 512;
CL.DIGITS = 100;

/**
 * @param {bigint} num
 * @param {bigint} den
 * @return {!CL}
 */
function ofRat(num, den) {
  num = BigInt(num);
  den = BigInt(den);
  return new CL(function * () {
    if (num == 0n) {
      return;
    } else if (num < 0n && den < 0n) {
      num *= -1n;
      den *= -1n;
      yield 1;
    } else if (num < 0n) {
      num *= -1n;
      yield 0;
    } else if (den < 0n) {
      den *= -1n;
      yield 0;
    } else {
      yield 1;
    }
    if (num == den) {
      return;
    } else if (num < den) {
      [num, den] = [den, num];
      yield 0;
    } else {
      yield 1;
    }
    while (num != den << 1n) {
//console.log(`ofRat: ${num} / ${den}`);
      if (num >= (den << 1n)) {
        if (num & 1n) {
          den <<= 1n;
        } else {
          num >>= 1n;
        }
        yield 1;
      } else {
        [num, den] = [den, num - den];
        yield 0;
      }
    }
    //yield 0; // ???
  }(), true);
}


/**
 * Converts a non-standard continued fraction to a continued logarithm.
 * @param {!Iterable<bigint>} cf Iterable of alternating partial denominators
 *     and numerators. [2, 3, 4, 5, 6, ...] would represent 2+3/(4+5/(6+...)).
 * @param {!Array<number|bigint>} init Tuple of initial homographic params.
 * @return {!CL}
 */
function ofNonstandardCf(cf, [a, b, c, d] = [1, 0, 0, 1]) {
  return new CL(function * () {
    // homographic terms: z = (ax+b)/(cx+d)
    a = BigInt(a);
    b = BigInt(b);
    c = BigInt(c);
    d = BigInt(d);
    let thresh = 0n;
    let top = true;
    for (let e of cf) {
      e = BigInt(e);
      if (top) {
        // ingest x -> x + e
        // z = (ax + ae+b) / (cx + ce+d)
        b += e * a;
        d += e * c;
      } else {
        // ingest x -> e / x
        // z = (bx + ae) / (dx + ce)
//console.log(`a=${a}, b=${b}, a*e=${a*e}`);
        [a, b, c, d] = [b, a * e, d, c * e];
      }
//console.log(`ingest ${top?'top':'bottom'} ${e} => ${a} x + ${b} / ${c} x + ${d}`);
      top = !top;
      // now try to egest as much as possible
      while (true) {
        // bounds are more generous because x ∈ (-∞, ∞).
        const nd = d - c;
        const pd = d + c;
        const nn = b - a;
        const pn = b + a;
        if (a == 0n || c == 0n || d == 0n
            || nn <= 0n && pn >= 0n
            || nn >= 0n && pn <= 0n
            || nd <= 0n && pd >= 0n
            || nd >= 0n && pd <= 0n) break;
        const neg = b - thresh * d;
        const pos = a - thresh * c;
//console.log(`bounds ${neg} .. ${pos}`);
        if (neg > 0n && pos > 0n) {
          // egest a 1
          if (thresh == 2n) {
            if (a & 1n || b & 1n) {
              c <<= 1n;
              d <<= 1n;
            } else {
              a >>= 1n;
              b >>= 1n;
            }
          } else {
            thresh++;
          }
//console.log(`egest 1 => ${a} x + ${b} / ${c} x + ${d}`);
          yield 1;
        } else if (neg < 0n && pos < 0n) {
          // egest a 0
          if (thresh == 0n) {
            a = -a;
            b = -b;
            thresh++;
          } else if (thresh == 1n) {
            [a, b, c, d] = [c, d, a, b];
            thresh++;
          } else {
            [a, b, c, d] = [c, d, a - c, b - d];
          }
//console.log(`egest 0 => ${a} x + ${b} / ${c} x + ${d}`);
          yield 0;
        } else {
          break;
        }
      }
    }
    // At this point assume x == ∞.
    throw new Error('only use ofNonstandardCf for infinite fractions');
  }(), false);
}


/**
 * @param {string|number|bigint} num
 * @param {number} radix
 * @return {!Array<bigint>}
 */
function parseRat(num, radix) {
  if (typeof num != 'string') radix = 10;
  const match = /([+-]?[0-9]*)(?:\.([0-9]*))?(?:e([+-]?[0-9]+))?/.exec(num);
  if (!match) throw new Error('bad string: ' + num);
  const [_, whole, decimal, exponent] = match;
  let top = whole;
  let bottom = '1';
  if (decimal) {
    top = top + decimal;
    bottom = bottom + '0'.repeat(decimal.length);
  }
  if (exponent) {
    const exp = Number(exponent); // radix?
    if (exp > 0n) {
      top = top + '0'.repeat(exp);
    } else {
      bottom = bottom + '0'.repeat(-exp);
    }
  }
  // TODO - use radix instead of bigint ctor (at least if radix != 10 or 16)
  return [BigInt(top), BigInt(bottom)];
}

function homographic(top, bottom) {
  // Returns a function on N inputs.
  // top and bottom are arrays of tuples where the first N elements are
  // the powers of the corresponding inputs (for N inputs), and the final
  // element is the coefficient.  So [2, 0, 0, 1] would indicate that we
  // have three inputs (call them x, y, and z) and that the x^2 term has
  // coefficient 1, while [0, 1, 1, 2] would be 2yz, and [0, 0, 0, 1] is
  // a constant term in the polynomial.

  // Find the arity and max power for each term.
  if (!top.length || !bottom.length) throw new Error('Missing term');
  const max = null;
  for (const term of top.concat(bottom)) {
    if (max == null) {
      max = new Array(term.length - 1).fill(0);
    } else if (max.length != term.length - 1) {
      throw new Error('Length mismatch');
    }
    for (let i = 0; i < max.length; i++) {
      max[i] = Math.max(max[i], term[i]);
    }
  }
  const coeffs = new CoefficientsTable(max);
  return new CL(function * () {
    let table = coeffs.buildTable(top, bottom);
    
  });
  // 

  // 4. build the recurrence tables for that count (note: should cache these)
}


function range(n) {
  let value = -1;
  return {
    [Symbol.iterator]() { return this; },
    next() { return ++value < n ? {value, done: false} : {done: true}; },
  };
}

function pascalTriangle(height) {
  const triangle = [];
  let arr = null;
  for (let i = 0; i <= height; i++) {
    if (arr) {
      arr = Array.from(range(i + 1), k => (arr[k - 1] || 0n) + (arr[k] || 0n));
    } else {
      arr = [1n];
    }
    triangle.push(arr);
  }
  return triangle;
}

class CoefficientsTable {

  constructor(powers) {
    const plus1Product = arr => arr.reduce((x, y) => x * (y + 1), 1);
    this.count = plus1Product(powers) * 2;
    this.pascal = pascalTriangle(Math.max(...powers));
    this.powers = powers;
    this.pre =
        Array.from(
            range(powers.length),
            i => plus1Product(powers.slice(0, i)));
    this.post =
        Array.from(
            range(powers.length),
            i => plus1Product(powers.slice(i + 1)));
  }

  buildTable(top, bottom) {
    const table = new Array(this.count).fill(0n);
    for (const t of top) {
      let index = 0;
      for (let i = 0; i < this.post.length; i++) {
        index += t[i] * this.post[i];
      }
      table[index] += BigInt(t[t.length - 1]);
    }
    for (const b of bottom) {
      let index = 0;
      for (let i = 0; i < this.post.length; i++) {
        index += b[i] * this.post[i];
      }
      table[this.count / 2 + index] += BigInt(b[b.length - 1]);
    }
    return table;
  }

  ingestSign(input, value, table) {
    if (value) return table;
    const result = new Array(table.length);

    // TODO - value == null means something different, handle it here?

    const pre = 2 * this.pre[input]; // ingestion doesn't care about top/bottom
    const post = this.post[input];
    const pow = this.powers[input];
    let index = 0;
    for (let i = 0; i < pre; i++) {
      for (let j = 0; j <= pow; j++) {
        for (let k = 0; k < post; k++) {
          result[index] = j % 2 ? -table[index] : table[index];
          index++;
        }
      }
    }
    return result;
  }

  ingestRecip(input, value, table) {
    if (value) return table;
    const result = new Array(table.length);
    const pre = 2 * this.pre[input];
    const post = this.post[input];
    const pow = this.powers[input];
    let index = 0;
    for (let i = 0; i < pre; i++) {
      for (let j = 0; j <= pow; j++) {
        for (let k = 0; k < post; k++) {
          result[index] = table[index + (pow - 2 * j) * post];
          index++;
        }
      }
    }
    return result;
  }

  // returns the new table
  ingest(input, value, table) {
    const result = new Array(table.length);
    const pre = 2 * this.pre[input]; // treat top and bottom same
    const post = this.post[input];
    const pow = this.powers[input];
    if (value) {
      let index = 0;
      for (let i = 0; i < pre; i++) {
        for (let j = 0; j <= pow; j++) {
          for (let k = 0; k < post; k++) {
            result[index] = table[index] << BigInt(j);
            index++;
          }
        }
      }
    } else {
      // To ingest a 0, we need to use pascal's triangle.
      // Suppose a cubic term: a3*x^3 + a2*x^2 + a1*x + a0
      // We add a synthetic w=1 term to balance total powers
      // (e.g. a3*x^3 + a2*x^2*w + a1*x*w^2 + a0*w^3).  Then
      // x -> 1+x and w -> x.
      // So a3 <- a3 + a2 + a1 + a0  (1 1 1 1)
      //    a2 <- 3*a3 + 2*a2 + a1   (3 2 1)
      //    a1 <- 3*a3 + a2          (3 1)
      //    a0 <- a3                 (1)
      // This is just a sidewise view of (1)(1 1)(1 2 1)(1 3 3 1).

      let index = 0;
      for (let i = 0; i < pre; i++) {
        for (let j = pow; j >= 0; j--) {
          for (let k = 0; k < post; k++) {
            result[index] = 0n;
            // j = pow is constant term, only has pow term [index + pow * post]
            for (let h = j; h <= pow; h++) {
              result[index] +=
                  this.pascal[h][j] * table[index + (h + j - pow) * post];
            }
            index++;
          }
        }
      }
    }
    return result;
  }

  // returns the new table
  egest(value, table) {
    const half = this.count / 2;
    if (value) {
      const result = table.slice();
      for (let i = this.count - 1; i >= half; i--) {
        result[i] <<= 1n;
      }
      return result;
    } else {
      const result = new Array(table.length);
      let common = 0;
      for (let i = 0; i < half; i++) {
        result[i] = table[i + half];
        result[i + half] = table[i] - table[i + half];
        // TODO - this doesn't actually fire; it would be nice to check this
        // but maybe not quite as often?  Maybe only once every 10th or 20th
        // egestion?
        if (common > 1) {
          common = gcd(gcd(common, result[index]), result[index + half]);
        }
      }
      if (common > 1) {
        for (let i = this.count - 1; i >= 0; i--) {
          result[i] /= common;
        }
      }
      return result;
    }
  }

  // returns the new table
  egestRecip(value, table) {
    if (value) return table;
    const half = this.count / 2;
    const result = new Array(table.length);
    let temp;
    for (let i = 0; i < half; i++) {
      result[i] = table[i + half];
      result[i + half] = table[i];
    }
    return result;
  }

  // returns the new table
  egestSign(value, table) {
    if (value) return table;
    const half = this.count / 2;
    const result = table.slice();
    for (let i = 0; i < half; i++) {
      result[i] = -result[i];
    }
    return result;
  }

  next(egested, table) {
    // Look at the table and figure out what to do.  Return an object
    // literal with {ingest: <bitmask>, egest: <digits in string>, table: <array>}
    // First determine whether we have a consistent result.
    const half = this.count / 2;
    const egest = [];
    let indices = new Set(this.powers.keys());
    const ingest = [];

    const sameSign = (a, b) => a < 0n && b < 0n || a > 0n && b > 0n;

//     const ingestFor = (i) => {
      // TODO - log this - we're getting a 2 when we really want 0 and 1
//       //if (sign >= 0 && thisSign <= 0 || sign <= 0 && thisSign >= 0) {
//       // sign conflict - any variables present here should be set as
//       // to ingest
//       for (const j of indices) {
//         // consider 2 2 1
//         // 000 001 010 011 020 021 100 101 110 111 120 121 200 ...
//         // powers = 2, 2, 1
//         // pre    = 1, 3, 9
//         // post   = 6, 2, 1
//         //   -> floor((i % post[j - 1]) / post[j]) > 0
//         if (i % (j ? this.post[j - 1] : Infinity) >= this.post[j]) {
//           ingest.push(j);
//           indices.delete(j);
//         }
//       }
// //console.log(`    ingest: ${ingest}`);
//     };

    const ingestFor = (j) => {
      ingest.push(j);
      indices.delete(j);
    };

    while (!ingest.length) {
      let bot0 = table[half];
      if (bot0 < 0n) {
        table = table.map(x => -x);
        bot0 = -bot0;
      }
      // TODO - it's not as simple as just checking a[i]/b[i]
      //      - for ordinary linear  single-var homographs, it's actually
      //        a/c and (a+b)/(c+d), since x=1..∞.  But for polynomials,
      //        we could end up with all sorts of possibilities.
      //      - quadratics are relatively easy with no other vars involved,
      //        since we can just look at the vertex and figure out whether
      //        it's at x>1, and look at the concavity.  But even then,
      //        where is the max/min.  We'd basically need to find the root
      //        of the derivative of the entire function?  Evaluate at 1, ∞,
      //        and any roots.  We could store the derivate coefficients in
      //        a precomputed table, but solving still seems intractable,
      //        particularly since we don't actually have values for the other
      //        variables.
      //      - ultimately, if all we support is linear and quadratic, that's
      //        probably fine.  But even quadratic mixed with anything else
      //        seems impossible.  We could do the squares separately and then
      //        feed them into a+b-c?
      // From Gosper's manuscript, as long as there are no sign changes in the
      // denominator, we *are* okay to just look at the pairwise quotients.
      // We can try to ingest more terms if we *do* see sign changes in the
      // denominator.  It gives up a little bit of eagerness, which could
      // cause problems on very close calls?
      const top0 = table[0];
      if (top0 == 0n || bot0 <= 0n) {
        ingest.push(...indices);
        break;
      }
      const signs = new Array(half);
      // if we differ from sign0 then find a dimension on which it differs.
      // say 00- 01+ 10+ 11+ if we see 11+ we don't find such a dimen, but
      // we already would have seen it before.
      if (egested == 0) {
        // record the sign of the top - want top to all be same sign
        for (let i = 0; i < half && indices.size; i++) {
          const top = table[i];
          const bot = table[half + i];
          const sign = signs[i] = bot > 0n ? top : -signs[0];
          if (!sameSign(sign, signs[0])) {
// console.log(`sign mismatch: ${i} vs 0`);
            for (const j of indices) {
              const mod = j ? this.post[j - 1] : half;
              const post = this.post[j];
// console.log(`  checking ${j}: post=${post} => ${signs[i-post]}`);
// PROBLEM - sometimes it's i + post to get to the corresponding pair!!!
        // consider 2 2 1
        // 000 001 010 011 020 021 100 101 110 111 120 121 200 ...
        // powers = 2, 2, 1
        // pre    = 1, 3, 9
        // post   = 6, 2, 1
        // for j=2, check 1 vs 0, 3 vs 2, ...
        // for j=1, check 2 vs 0, 3 vs 1, 4 vs 0, 5 vs 1, 8 vs 6, 9 vs 7, ...
        //    -> delta = 2 (post[i]) only if i % 6 > 2
        // for j=0, check 6 vs 0, 7 vs 1, 8 vs 2, ..., 11 vs 5, 12 vs 0, ...
              if (i % mod >= post && !sameSign(sign, signs[i - post])) {
                ingestFor(j);
              }
            }
          }
        }
        // if (!bot0) signs[0] = 0n;
      } else {
        // want consistent quotient cmp some threshold
        const shift = egested > 1 && indices.size ? 1n : 0n;
        for (let i = 0; i < half; i++) {
          const top = table[i];
          const bot = table[half + i];
          const sign = signs[i] = bot > 0n ? (top - (bot << shift)) : -signs[0];
          if (!sameSign(sign, signs[0])) {
// console.log(`sign mismatch: ${i} vs 0`);
            for (const j of indices) {
              const mod = j ? this.post[j - 1] : half;
              const post = this.post[j];
// console.log(`  checking ${j}: post=${post} => ${signs[i-post]}`);
              if (i % mod >= post && !sameSign(sign, signs[i - post])) {
                ingestFor(j);
              }
            }
          }
        }
      }

if(LOG){
  function split(x, s) {
    return Array.from(range(s.length / x)).map(i => s.slice(i * x, i * x + x));
  }
  let s = signs.map(x => x > 0n ? '+' : x < 0n ? '-' : '0');
// note - signs is only half-sized, but if we're still trying to get rid
// of sign changes we need the full size...
//console.dir(s);
  for (let i = this.powers.length - 1; i >0/* -1*/; i--) {
    // group substrings into nested arrays, join with ''. ' ', '\n', and '\n\n'
    //group by post
//console.log(`signs=${signs}`);
    s = split(i >= 0 ? this.powers[i] + 1: 2, s);
//console.dir(s);
  }
  function join(sep, ...rest) {
    return arr => {
//console.log(`join ${rest.length}:`);console.dir(arr);
      return arr instanceof Array ? arr.map(join(...rest)).join(sep) : arr;
    };
  }
  s = join(/*'\n\n',*/ '\n', ' ', '')(s);
  console.log(s);
}

      // // See if any signs are different from the first one.
      // for (let p = 0; j < this.powers.length; j++) {

      //   // 000 001 010 011 020 021 100 101 110 111 120 121 200 ...
      //   // powers = 2, 2, 1
      //   // pre    = 1, 3, 9
      //   // post   = 6, 2, 1

      //   const pre = this.pre[p];
      //   const post = this.post[p];
      //   for (let i = 0; i < pre; i++) {
      //     index = i * pre;
      //     for (let k = 0; k < this.post[p]; k++) {

      //     }
      //   }
      // }

// how to pick ingestion?  look for whoever has the most sign divergence?


        // for (let i = 0; i < half; i++) {
        //   const top = table[i];
        //   if (bot <= 0 || top0 >= 0 && top <= 0 || top0 <= 0 && top >= 0) {
        //     ingestFor(i);
        //     if (!indices.size) break;
        //   }
        // }

      if (!ingest.length) {
console.log(`  => egest ${signs[0]}`);
        egest.push(Number(signs[0] > 0n));
        if (egested == 0) table = this.egestSign(signs[0] > 0n, table);
        if (egested == 1) table = this.egestRecip(signs[0] > 0n, table);
        if (egested >= 2) table = this.egest(signs[0] > 0n, table);
        egested++;
      }
    }
    // // compare abs(a001/b001-a000/b000) a010/b010 
    // const quotient = Number(table[0]) / Number(table[half]);
    // // measure quotient for other indices by computing array offset
    // // ask for input corresponding to max
    // let biggestInput = 0;
    // let biggestDiff = 0;
    // let offset = 1;
    // for (let i = 0; i < this.powers.length; i++) {
    //   const diff = Math.abs(Number(table[i]) / Number(table[i + half]) - quotient);
    //   if (diff > biggestDiff) {
    //     biggestDiff = diff;
    //     biggestInput = i;
    //   }
    // }
    return {ingest, egest, table};
  }

  static of(powers) {
    const cache = {};
    const f = CoefficientsTable.of = (powers) => {
      return cache[powers] || (cache[powers] = new CoefficientsTable(powers));
    };
    return f(powers);
  }
}


function gcd(a, b) {
  if (a < 0) a = -a;
  if (b < 0) b = -b;
  let c;
  while (a && b) {
    if (a < b) {
      c = a;
      a = b;
      b = c;
    } else {
      a = a % b;
    }
  }
  return a ? a : b;
}

module.exports = {CL, CoefficientsTable};

// for (const row of pascalTriangle(64)) {
//   console.log(row.map(x=>x%2n?'#':' ').join(''));
// }

// let x = CL.of(172.34);
// console.log(x.toDebugString());
// //console.log(Number(x));
// console.log(x.toString());
// console.log(x.toDebugString());


// x = CL.of('1e1000');
// console.log(x.toDebugString());
// //console.log(Number(x));
// console.log(x.toString());
// console.log(x.toDebugString());


// // this convergent gets 27 digits of pi - last 3 printed are off
// x = CL.of([1019514486099146n, 324521540032945n]);
// console.log(x.toDebugString());
// //console.log(Number(x));
// console.log(x.toString());
// console.log(x.toDebugString());




// const h = Homograph.ofRat(72 * 8 + 1, 8);
// console.log(String(h));

// while (h.next() != null) {
//   const next = h.next();
//   h.egest(next);
//   console.log('egest ' + next + ': ' + String(h));
// }



// const radix = 10;
// const digits = [];
// let s='';
// if (h.next() == 0n) {s = '-'; h.negate();}
// while (h.wholePart() != null&&digits.length < 30) {
//   const next = h.wholePart();
//   h.egestDigit(next, radix);
//   digits.push(next.toString(radix));
//   if (digits.length==1)digits.push('.');
//   //console.log('egest ' + next + ': ' + String(h));
// }
// console.log(s+digits.join(''));

// const pi = CL.fromNonstandardContinuedFraction(function*(){
//   let a = 1;
//   let b = 1;
//   while (true) {
//     yield a;
//     a += 2;
//     yield b;
//     b += a;
//   }
// }(), [0, 4, 1, 0]);
// console.log(pi.toString(10, 1000));

// const e = CL.fromNonstandardContinuedFraction(function*(){
//   yield 2;
//   let a = 2;
//   while (true) {
//     yield * [1, 1, 1, a, 1, 1];
//     a += 2;
//   }
// }());
// console.log(e.toString(10, 1000));

const t = new CoefficientsTable([2, 2, 1]);
let x = t.buildTable([[2, 0, 0, 1], [0, 2, 0, -1], [0, 0, 1, 1]], [[0, 0, 0, 1]]);

// TODO - hook up actual infinite repeating numbers here?
//  e.g. (1+sqrt(3))/2 = (01)..., or (011) or (010)
//   - this should lead to more realistic scenarios
//   - do we ever request ingestion of only a single input?!?
// TODO - improve ingest request logic to only look at difference in
//        sign due to the term, rather than all terms in negative coefficient
//      - i.e. (11- 10+ 01- 00+ => should only request index 1, not 0)

const a = function*(){
  yield 1; yield 0;
  while (true) { yield 0; yield 1; }
}();
const b = function*(){
  yield 1; yield 0;
  while (true) { yield 0; yield 1; yield 1; }
}();
const c = function*(){
  yield 0; yield 0;
  while (true) { yield 1; yield 0; yield 1; yield 1; yield 0; }
}();


//console.log(t.next(0, x));
x = t.ingestSign(0, a.next().value, x);
x = t.ingestSign(1, b.next().value, x);
x = t.ingestSign(2, c.next().value, x);
//console.log(t.next(0, x));
x = t.ingestRecip(0, a.next().value, x);
x = t.ingestRecip(1, b.next().value, x);
x = t.ingestRecip(2, c.next().value, x);
//console.log(t.next(0, x));
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
//console.log(t.next(0, x));
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
//console.log(t.next(0, x));
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
//console.log(t.next(0, x));
x = t.ingest(2, c.next().value, x);
//console.log(t.next(0, x));
x = t.ingest(2, c.next().value, x);
//console.log(t.next(0, x));
x = t.ingest(2, c.next().value, x);
//console.log(t.next(0, x));
x = t.ingest(2, c.next().value, x);
//console.log(t.next(0, x));
//LOG=true;
x = t.ingest(1, b.next().value, x);
//console.log(t.next(0, x));
x = t.ingest(0, a.next().value, x);
x = t.ingest(0, a.next().value, x);

x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);
x = t.ingest(2, c.next().value, x);
x = t.ingest(0, a.next().value, x);
x = t.ingest(1, b.next().value, x);


// x = t.ingest(1, 1, x);
// x = t.ingest(2, 1, x);
// console.log(t.next(0, x));
// x = t.ingest(0, 1, x);
// x = t.ingest(1, 0, x);
// x = t.ingest(2, 1, x);
// console.log(t.next(0, x));
// x = t.ingest(0, 0, x);
// x = t.ingest(1, 0, x);
// x = t.ingest(2, 0, x);
// console.log(t.next(0, x));
// x = t.ingest(0, 0, x);
// x = t.ingest(1, 1, x);
// x = t.ingest(2, 0, x);
// console.log(t.next(0, x));
// x = t.egestSign(0, x);
// x = t.egestRecip(1, x);
// x = t.egest(1, x);
// x = t.ingest(0, 0, x);
// x = t.ingest(1, 1, x);
// x = t.ingest(2, 0, x);
// console.log(t.next(4, x));
// x = t.egest(1, x);
// x = t.egest(1, x);
// x = t.ingest(0, 0, x);
// x = t.ingest(1, 1, x);
// x = t.ingest(2, 0, x);
// console.log(t.next(4, x));
// x = t.egest(1, x);
// x = t.ingest(0, 0, x);
// x = t.ingest(1, 1, x);
// x = t.ingest(2, 0, x);


//console.log(t.next(0, x));

let {ingest, egest} = t.next(0, x);
console.log(`EGEST ${egest} WANT ${ingest}`);
