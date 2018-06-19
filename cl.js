// Continued logarithms

const {BitSet} = require('./bitset.js');

/**
 * A continued logarithm.
 * @implements {Iterable<boolean>}
 */
class CL {
  /** @param {!Iterable<boolean>} data */
  constructor(data) {
    /** @type {?Iterator<boolean>} */
    this.iter = data[Symbol.iterator]();
    /** @const */
    this.bits = new BitSet(); // TODO(sdh): allow passing in initial data?
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
        const {value, done} = this.iter.next();
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

  toString(radix = 10, digits = 30) {
//console.log('toString('+radix+', '+digits+')');
    radix = BigInt(radix);
    let parts = []
    let a = 0n;
    let b = 0n;
    let c = 0n;
    let d = 1n;
    let last = null;
    let next = null;
    let index = 0;
FOR:
    for (const e of this) {
//console.log('a='+a+', b='+b+', c='+c+', d='+d+', e='+e);
      index++;
      if (index == 1) {
        a = e ? 1n : -1n;
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
      while (c != 0n && d != 0n) {
        last = b / d;
        next = a / c;
//console.log('last='+last+', next='+next);
        if (last == next) {
          if (parts.length == 1) parts.push('.');
          parts.push(last.toString(Number(radix)));
          a = radix * (a - c * last);
          b = radix * (b - d * last);
          // Note: it's possible that the first few digits can be reduced if
          // there's a GCD != 1 after multiplying the radix - but once we reach
          // unity, there's no point checking going forward since it will never
          // happen again.
          if (parts.length > digits) break FOR;
        } else break;
      }
    }
    while (parts.length <= digits && a != 0 && c != 0) {
      next = a / c;
      if (parts.length == 1) parts.push('.');
      parts.push(next.toString(Number(radix)));
      a = radix * (a - c * next);
    }
    // TODO - if the last digit was >= half, round up
    // the previous one - may cause chaining carries!
    //   -- basically we need to sit on all (radix-1) terms, plus one term
    //      preceding, until we either see a smaller term or else finish.
    //      If we finish with >=radix/2 then just increment the last smaller
    //      term and drop all the radix-1 terms.  This should be a generator.
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

  static of(number) {
    return new CL(function * () {
      let index = 0;
      if (number < 0) {
//console.log('neg: 0');
        yield 0;
        number *= -1;
      } else if (number > 0) {
//console.log('pos: 1');
        yield 1;
      } else {
//console.log('zero');
        return;
      }
      if (number < 1) {
//console.log('recip: 0');
        yield 0;
        number = 1 / number;
      } else if (number > 1) {
//console.log('normal: 1');
        yield 1;
      } else {
//console.log('one');
        return;
      }
      while (number != 1) { // && index++ < 100) {
        if (number >= 2) {
//console.log(`1: ${number} => ${number / 2}`);
          yield 1;
          number /= 2;
        } else {
//console.log(`0: ${number} => ${1 / (number - 1)}`);
          yield 0;
          number = 1 / (number - 1);
        }
      }
//console.log('end');
      yield 0; // ???
    }());
  }

  static ofRat(num, den) {
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
    }());
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
    }());
  }
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

let x = CL.of(172.34);
console.log(x.toDebugString());
//console.log(Number(x));
console.log(x.toString());
console.log(x.toDebugString());


// this convergent gets 27 digits of pi - last 3 printed are off
x = CL.ofRat(1019514486099146n, 324521540032945n);
console.log(x.toDebugString());
//console.log(Number(x));
console.log(x.toString());
console.log(x.toDebugString());


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
