// Continued logarithms

const {BitSet} = require('./bitset.js');

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
        if (index++ < this.bits.size()) {
          return {value: this.bits.get(index), done: false};
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

  toString(radix = 10, digits = this.finite ? Infinity : 30) {
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
    while (!approx && a && c) {
      next = a / c;
      if (parts.length == 2) parts.push('.');
      parts.push(next.toString(Number(radix)));
      a = radix * (a - c * next);
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
      if (Number.parseInt(parts.pop(), radix) * 2 >= radix) {
        incr(parts.length - 1);
      }
    }
    while (parts[parts.length - 1] == '0' && decimal) {
      parts.pop();        
    }
    if (parts[parts.length - 1] == '.') {
      parts.pop();
    }
    return parts.join('');
  }

  valueOf() {
    let a = 1n;
    let b = 0n;
    let c = 0n;
    let d = 1n;
    let last = NaN;
    let next = NaN;
    let index = 0;
    for (const e of this) {
      index++;
      if (index == 1) {
        a = e ? 1n : -1n;
        continue;
      } else if (index == 2) {
        [a, b, c, d] = [b, a, d, c];
        continue;
      }
      if (e) {
        if ((b & 1n) || (d & 1n)) {
          b >>= 1n;
          d >>= 1n;
        } else {
          a <<= 1n;
          c <<= 1n;
        }
      } else {
        [a, b, c, d] = [a + b, a, c + d , c];
        // TODO(sdh): check for gcd? may never get one...
      }
      if ((next = Number(a) / Number(c)) == last) {
        break;
      }
      last = next;
    }
    return next;
  }

  reciprocal() {
    const iter = this[Symbol.iterator]();
    return new CL(function * () {
      let result = iter.next();
      if (result.done) {
        // ??? doesn't seem quite right
        while (true) yield 1;
      }
      yield result.value;
      result = iter.next();
      if (result.done) return;
      yield 1 - result.value;
      yield * iter;
    }(), this.finite);
  }

  /**
   * Make a fixed continued logarithm.
   * @param {number|bigint|string|!Array<number|bigint|string>} number
   *     The number.  A rational may be given using a two-element array.
   * @param {number|bigint=} radix Only applies to string inputs.
   * @return {!CL}
   */
  static of(number, radix = 10) {
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
}

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
    while (num != den) {
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
    yield 0; // ???
  }(), true);
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

  // Add 1 and multiply to find total nubmer of coeffs on top and bottom
  const count = max.reduce((x, y) => x * (y + 1), 1) * 2;
  

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
  for (let i = 0; i < height; i++) {
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

  ingestSign(input, value, table) {
    if (value) return table;

    // TODO - value == null means something different, handle it here?

    const pre = 2 * this.pre[input]; // ingestion doesn't care about top/bottom
    const post = this.post[input];
    const pow = this.powers[input];
    for (let j = 1; j <= pow; j += 2) {
      let index = j * post;
      for (let i = 0; i < pre; i++) {
        for (let k = 0; k < post; k++) {
          result[index] = -table[index]
          index++;
        }
        index += post + pow + 1;
      }
    }
    return result;
  }

  ingestRecip(input, value, table) {
    if (value) return table;
    const pre = 2 * this.pre[input];
    const post = this.post[input];
    const pow = this.powers[input];
    for (let i = 0; i < pre; i++) {
      for (let j = 0; j <= pow; j++) {
        for (let k = 0; k < post; k++) {
          result[index] = table[index + (pow - j) * post];
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
      let index = 0;
      for (let i = 0; i < pre; i++) {
        for (let j = pow; j >= 0; j--) {
          for (let k = 0; k < post; k++) {
            result[index] = 0;
            // j = pow is constant term, only has pow term [index + pow * post]
            for (let h = pow; h <= j; h++) {
              result[index] += this.pascal[h][j] * table[index + h * post];
            }
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
        result[index] = table[index + half];
        result[index + half] = table[index] - table[index + half];
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
      temp = result[i];
      result[i] = result[i + half];
      result[i + half] = temp;
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
    // literal with {ingest: <input>, egest: <digits in string>, table: <array>}
    // First determine whether we have a consistent result.
    const half = this.count / 2;
    const egest = [];
    OUTER:
    while (true) {
      const threshold = BigInt(Math.min(egested, 2));
      const sign = table[0] - (table[half] * threshold) >= 0n;
      for (let i = 0; i < half; i++) {
        if (sign != (table[i] - (table[half] * threshold) >= 0n)) {
          break OUTER;
        }
      }
      egest.push(sign ? 1 : 0);
      if (egested == 0) table = this.egestSign(sign, table);
      if (egested == 1) table = this.egestRecip(sign, table);
      if (egested >= 2) table = this.egest(sign, table);
    }
    // compare abs(a001/b001-a000/b000) a010/b010 
    const quotient = table[0] / table[half];
    // measure quotient for other indices by computing array offset
    // ask for input corresponding to max
    let biggestInput = 0;
    let biggestDiff = 0;
    let offset = 1;
    for (let i = 0; i < this.powers.length; i++) {
      const diff = Math.abs(table[i] / table[i + half] - quotient);
      if (diff > biggestDiff) {
        biggestDiff = diff;
        biggestInput = i;
      }
    }
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



class Homograph {
  constructor(a, b, c, d) {
    this.a = BigInt(a);
    this.b = BigInt(b);
    this.c = BigInt(c);
    this.d = BigInt(d);
    this.ingested = 0;
    this.egested = 0;
  }

  /** @param {number|bigint|boolean|null} term */
  ingest(term) {
    const index = this.ingested;

    if (term == null) {
      // Nothing more to ingest.  Depending on this.ingested we can fix x.
      // But since we do our math based on a/c and (a+b)/(c+d), we want to
      // set b=d=0 for a constant.
      if (index == 0) {
        // no terms: x == 0
        [this.a, this.b, this.c, this.d] = [this.b, 0n, this.d, 0n];
      } else {
        // x == 1, so z = (a+b)/(c+d)
        [this.a, this.b, this.c, this.d] =
            [this.a + this.b, 0n, this.c + this.d, 0n];
      } 
      this.ingested = 2; // pass future ingestion checks
      return;
    }

    if (index == 0) {
      // sign bit
      if (!term) {
        this.a *= -1n;
        this.c *= -1n;
      }
    } else if (index == 1) {
      // exponent sign bit
      if (!term) {
        [this.a, this.b, this.c, this.d] = [this.b, this.a, this.d, this.c];
      }
    } else if (term) {
      // normal divide-by-2 bit
      if (!((this.b & 1n) || (this.d & 1n))) {
        this.b >>= 1n;
        this.d >>= 1n;
      } else {
        this.a <<= 1n;
        this.c <<= 1n;
      }
    } else {
      // normal reciprocate bit
      [this.a, this.b, this.c, this.d] =
          [this.a + this.b, this.a, this.c + this.d, this.c];
    }
    this.ingested++;
  }

  /** @return {?boolean} True if >= 2, false if < 2, null if uncertain. */
  next() {
    if (this.ingested < 2) throw new Error('next before ingestion');
    if (this.c == 0n || this.c + this.d == 0n) return null;
    const threshold = BigInt(Math.min(this.egested, 2));
    const x = this.a - (this.c * threshold);
    const y = x + this.b - (this.d * threshold);
    if (x >= 0n && y >= 0n) return true;
    if (x < 0n && y < 0n) return false;
    return null;
  }

  /** @param {number|bigint|boolean} term */
  egest(term) {
    const index = this.egested;
    if (index == 0) {
      if (!term) {
        this.a *= -1n;
        this.b *= -1n;
      }
    } else if (index == 1) {
      if (!term) {
        [this.a, this.b, this.c, this.d] = [this.c, this.d, this.a, this.b];
      }
    } else if (term) {
      if (!((this.a & 1n) || (this.b & 1n))) {
        this.a >>= 1n;
        this.b >>= 1n;
      } else {
        this.c <<= 1n;
        this.d <<= 1n;
      }
    } else {
      [this.a, this.b, this.c, this.d] =
          [this.c, this.d, this.a - this.c, this.b - this.d];
    }
    this.egested++;
  }

  /** @return {?bigint} null if not yet certain. */
  wholePart() {
    if (this.ingested < 2) throw new Error('whole before ingestion');
    if (this.c == 0n || this.c + this.d == 0n) return null;
    const ac = this.a / this.c;
    const bd = (this.a + this.b) / (this.c + this.d);
    return ac == bd ? ac : null;
  }

  /**
   * @param {bigint} digit
   * @param {bigint} radix
   */
  egestDigit(digit, radix = 10n) {
digit = BigInt(digit);
radix = BigInt(radix);
    this.a -= digit * this.c;
    this.b -= digit * this.d;
    if (this.c % radix == 0n && this.d % radix == 0n) {
      this.c /= radix;
      this.d /= radix;
    } else {
      this.a *= radix;
      this.b *= radix;
    }
  }

  negate() {
    this.a *= -1n;
    this.b *= -1n;
  }

  toString() {
    return `(${this.a} ${this.b};${this.c} ${this.d}): ${this.a}/${this.c}..${this.a+this.b}/${this.c+this.d}`;
  }

  static ofFloat(num) {
    const h = new Homograph(1, 0, 0, 1);
    if (num > 0) {
      h.ingest(1);
    } else if (num < 0) {
      h.ingest(0);
      num *= -1;
    } else {
      h.ingest(null);
      return h;
    }
    if (num > 1) {
      h.ingest(1);
    } else if (num < 1) {
      h.ingest(0);
      num = 1 / num;
    } else {
      h.ingest(null);
      return h;
    }
    let terms = 0;
    while (num != 1 && terms++ < 64) {
      if (num >= 2) {
//console.log(`num: ${num} => 1`);
        num /= 2;
        h.ingest(1);
      } else {
//console.log(`num: ${num} => 0`);
        num = 1 / (num - 1);
        h.ingest(0);
      }
    }
    h.ingest(null)
    return h;
  }

  static ofRat(num, denom) {
    const h = new Homograph(0, num, 0, denom);
    h.ingest(null);
    return h;
  }
}



class Bihomograph {
  // z = (axy + bx + cy + d) / (exy + fx + gy + h)
  constructor(a, b, c, d, e, f, g, h) {
    this.a = BigInt(a);
    this.b = BigInt(b);
    this.c = BigInt(c);
    this.d = BigInt(d);
    this.e = BigInt(e);
    this.f = BigInt(f);
    this.g = BigInt(g);
    this.h = BigInt(h);
    this.ingested1 = 0;
    this.ingested2 = 0;
    this.egested = 0;
  }
  /** @param {number|bigint|boolean|null} term */
  ingest1(term) {
    const index = this.ingested1;

    if (term == null) {
      // Nothing more to ingest.  Depending on this.ingested we can fix x.
      // But since we do our math based on a/e and (a+b)/(e+f), we want to
      // set c=d=g=h=0 for a constant.
      if (index == 0) {
        // no terms: x == 0
        [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] =
            [this.c, this.d, 0n, 0n, this.g, this.h, 0n, 0n];
      } else {
        // x == 1, so z = (a+b)/(c+d)
        [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] =
            [this.a + this.c, this.b + this.d, 0n, 0n,
             this.e + this.g, this.f + this.h, 0n, 0n];
      } 
      this.ingested1 = 2; // pass future ingestion checks
      return;
    }

    if (index == 0) {
      // sign bit
      if (!term) {
        this.a *= -1n;
        this.b *= -1n;
        this.e *= -1n;
        this.f *= -1n;
      }
    } else if (index == 1) {
      // exponent sign bit
      if (!term) {
        [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] =
            [this.c, this.d, this.a, this.b, this.g, this.h, this.e, this.f];
      }
    } else if (term) {
      // normal divide-by-2 bit
      if (!((this.c & 1n) || (this.d & 1n) || (this.g & 1n) || (this.h & 1n))) {
        this.c >>= 1n;
        this.d >>= 1n;
        this.g >>= 1n;
        this.h >>= 1n;
      } else {
        this.a <<= 1n;
        this.b <<= 1n;
        this.e <<= 1n;
        this.f <<= 1n;
      }
    } else {
      // normal reciprocate bit
      [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] =
          [this.a + this.c, this.b + this.d, this.a, this.b,
           this.e + this.g, this.f + this.h, this.e, this.f];
    }
    this.ingested1++;
  }

  /** @param {number|bigint|boolean|null} term */
  ingest2(term) {
    const index = this.ingested2;

    if (term == null) {
      // Nothing more to ingest.  Depending on this.ingested we can fix x.
      // But since we do our math based on a/e and (a+b)/(e+f), we want to
      // set c=d=g=h=0 for a constant.
      if (index == 0) {
        // no terms: x == 0
        [this.a, this.c, this.b, this.d, this.e, this.g, this.f, this.h] =
            [this.b, this.d, 0n, 0n, this.f, this.h, 0n, 0n];
      } else {
        // x == 1, so z = (a+b)/(c+d)
        [this.a, this.c, this.b, this.d, this.e, this.g, this.f, this.h] =
            [this.a + this.b, this.c + this.d, 0n, 0n,
             this.e + this.f, this.g + this.h, 0n, 0n];
      } 
      this.ingested2 = 2; // pass future ingestion checks
      return;
    }

    if (index == 0) {
      // sign bit
      if (!term) {
        this.a *= -1n;
        this.c *= -1n;
        this.e *= -1n;
        this.g *= -1n;
      }
    } else if (index == 1) {
      // exponent sign bit
      if (!term) {
        [this.a, this.c, this.b, this.d, this.e, this.g, this.f, this.h] =
            [this.b, this.d, this.a, this.c, this.f, this.h, this.e, this.g];
      }
    } else if (term) {
      // normal divide-by-2 bit
      if (!((this.b & 1n) || (this.d & 1n) || (this.f & 1n) || (this.h & 1n))) {
        this.b >>= 1n;
        this.d >>= 1n;
        this.f >>= 1n;
        this.h >>= 1n;
      } else {
        this.a <<= 1n;
        this.c <<= 1n;
        this.e <<= 1n;
        this.g <<= 1n;
      }
    } else {
      // normal reciprocate bit
      [this.a, this.c, this.b, this.d, this.e, this.g, this.f, this.h] =
          [this.a + this.b, this.c + this.d, this.a, this.c,
           this.e + this.f, this.g + this.h, this.e, this.g];
    }
    this.ingested2++;
  }


  /** @return {?boolean} True if >= 2, false if < 2, null if uncertain. */
  next() {
    if (this.ingested1 < 2) throw new Error('next before ingestion');
    if (this.ingested2 < 2) throw new Error('next before ingestion');
    if (this.e == 0n || this.e + this.f == 0n || this.e + this.g == 0n
        || this.e + this.f + this.g + this.h) {
      return null;
    }
    const threshold = BigInt(Math.min(this.egested, 2));

// TODO ---- fix these for extra inputs...

    const x = this.a - (this.c * threshold);
    const y = x + this.b - (this.d * threshold);
    if (x >= 0n && y >= 0n) return true;
    if (x < 0n && y < 0n) return false;
    return null;
  }

  /** @param {number|bigint|boolean} term */
  egest(term) {
    term = BigInt(term);
    const index = this.egested;
    if (index == 0) {
      if (!term) {
        this.a *= -1n;
        this.b *= -1n;
      }
    } else if (index == 1) {
      if (!term) {
        [this.a, this.b, this.c, this.d] = [this.c, this.d, this.a, this.b];
      }
    } else if (term) {
      if (!((this.a & 1n) || (this.b & 1n))) {
        this.a >>= 1n;
        this.b >>= 1n;
      } else {
        this.c <<= 1n;
        this.d <<= 1n;
      }
    } else {
      [this.a, this.b, this.c, this.d] =
          [this.c, this.d, this.a - this.c, this.b - this.d];
    }
    this.egested++;
  }

  /** @return {?bigint} null if not yet certain. */
  wholePart() {
    if (this.ingested < 2) throw new Error('whole before ingestion');
    if (this.c == 0n || this.c + this.d == 0n) return null;
    const ac = this.a / this.c;
    const bd = (this.a + this.b) / (this.c + this.d);
    return ac == bd ? ac : null;
  }

  /**
   * @param {bigint} digit
   * @param {bigint} radix
   */
  egestDigit(digit, radix = 10n) {
digit = BigInt(digit);
radix = BigInt(radix);
    this.a -= digit * this.c;
    this.b -= digit * this.d;
    if (this.c % radix == 0n && this.d % radix == 0n) {
      this.c /= radix;
      this.d /= radix;
    } else {
      this.a *= radix;
      this.b *= radix;
    }
  }

  negate() {
    this.a *= -1n;
    this.b *= -1n;
  }

  toString() {
    return `(${this.a} ${this.b};${this.c} ${this.d}): ${this.a}/${this.c}..${this.a+this.b}/${this.c+this.d}`;
  }

  static ofFloat(num) {
    const h = new Homograph(1, 0, 0, 1);
    if (num > 0) {
      h.ingest(1);
    } else if (num < 0) {
      h.ingest(0);
      num *= -1;
    } else {
      h.ingest(null);
      return h;
    }
    if (num > 1) {
      h.ingest(1);
    } else if (num < 1) {
      h.ingest(0);
      num = 1 / num;
    } else {
      h.ingest(null);
      return h;
    }
    let terms = 0;
    while (num != 1 && terms++ < 64) {
      if (num >= 2) {
//console.log(`num: ${num} => 1`);
        num /= 2;
        h.ingest(1);
      } else {
//console.log(`num: ${num} => 0`);
        num = 1 / (num - 1);
        h.ingest(0);
      }
    }
    h.ingest(null)
    return h;
  }

  static ofRat(num, denom) {
    const h = new Homograph(0, num, 0, denom);
    h.ingest(null);
    return h;
  }
}



module.exports = {CL, Homograph, Bihomograph};

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
