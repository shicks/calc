// Continued logarithms

/**
 * A continued logarithm.
 * @implements {Iterable<boolean>}
 * @abstract
 */
class CL {
  /** @param {!BitSet=} data */
  constructor(data = undefined) {
    /** @const */
    this.bits = data ? data.clone() : new BitSet();
  }

  /**
   * @return {?boolean} null if at end
   * @abstract
   */
  generate() {}

  /** @return {!IterableIterator<boolean>} */
  [Symbol.iterator]() {
    let i = 0;

    return {
      [Symbol.iterator]() { return this; },
      next: () => {
        let value =
            i < this.terms.length ?
                this.terms[i] :
                (this.terms[i] = this.generate());
        let done = value == null;
        i++;
        return {value, done};
      },
    };
  }

  /**
   * @param {number} index
   * @return {?boolean}
   */
  get(index) {
    if (index >= this.terms.length) {
      if (this.terms.length && this.terms[this.terms.length - 1] == null) {
        return null;
      }
      do {
        let next = this.generate();
        this.terms.push(next);
        if (next == null) return null;
      } while (index >= terms.length);
    }
    return this.terms[index];
  }

  // only shows the currently computed terms
  toDebugString() {
    // NOTE: toString changes as more terms are realized
    let index = 0;
    let parts = ['['];
    while (index < this.terms.length) {
      let term = this.terms[index];
      if (term == null) {
        parts.push(']');
        return parts.join('');
      }
      parts.push(term ? '1' : '0');
      index++;
    }
    parts.push('...]');
    return parts.join('');
  }

  toString(radix = 10, digits = 30) {
//console.log('toString('+radix+', '+digits+')');
    let parts = []
    let a = 1n;
    let b = 0n;
    let c = 0n;
    let d = 1n;
    let last = null;
    let next = null;
FOR:
    for (const e of this) {
//console.log('a='+a+', b='+b+', c='+c+', d='+d+', e='+e);
      [a, b, c, d] = [a * e + b, a, c * e + d, c];
      while (c != 0 && d != 0) {
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
    for (const e of this) {
      [a, b, c, d] = [a * e + b, a, c * e + d, c];
      if ((next = Number(a) / Number(c)) == last) {
        break;
      }
      last = next;
    }
    return next;
  }

  static of(number) {
    return new CF.OfNumber(number);
  }

  reciprocal() {
    const iter = this[Symbol.iterator]();
    if (this.get(0) === 0n) {
      iter.next();
      return new CF.OfIterator(iter);
    } else {
      return new CF.OfIterator(function * () {
        yield 0n;
        yield * iter;
      }());
    }
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
console.log(`num: ${num} => 1`);
        num /= 2;
        h.ingest(1);
      } else {
console.log(`num: ${num} => 0`);
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
console.log(`num: ${num} => 1`);
        num /= 2;
        h.ingest(1);
      } else {
console.log(`num: ${num} => 0`);
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


const h = Homograph.ofRat(72 * 8 + 1, 8);
console.log(String(h));

while (h.next() != null) {
  const next = h.next();
  h.egest(next);
  console.log('egest ' + next + ': ' + String(h));
}


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
