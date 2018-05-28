// Continued fractions

/**
 * A continued fraction.
 * @implements {Iterable<number>}
 * @abstract
 */
class CF {
  /** @param {!Array<number>=} terms CF will take ownership of this array. */
  constructor(terms = []) {
    /** @const {!Array<number>} */
    this.terms = terms;
  }

  /**
   * @return {number}
   * @abstract
   */
  generate() {}

  /** @return {!IterableIterator<number>} */
  [Symbol.iterator]() {
    let i = 0;

    return {
      [Symbol.iterator]() { return this; },
      next: () => {
        let value =
            i < this.terms.length ?
                this.terms[i] :
                (this.terms[i] = this.generate());
        let done = !Number.isFinite(value);
        i++;
        return {value, done};
      },
    };
  }

  /**
   * @param {number} index
   * @return {number}
   */
  get(index) {
    if (index >= this.terms.length) {
      if (this.terms.length &&
          !Number.isFinite(this.terms[this.terms.length - 1])) {
        return Infinity;
      }
      do {
        let next = this.generate();
        this.terms.push(next);
        if (!Number.isFinite(next)) return Infinity;
      } while (index >= terms.length);
    }
    return this.terms[index];
  }

  // only shows the currently computed terms
  toDebugString() {
    // NOTE: toString changes as more terms are realized
    let sep = '; ';
    let index = 0;
    let parts = ['['];
    while (index < this.terms.length) {
      let term = this.terms[index];
      if (!Number.isFinite(term)) {
        parts.push(']');
        return parts.join('');
      }
      parts.push(term, sep);
      sep = ', ';
      index++;
    }
    parts.push('...]');
    return parts.join('');
  }

  toString(radix = 10, digits = 30) {
    // TODO - a,b,c,d reach large values rather quickly, and need to be
    // represented with bigints to maintain precision.  Unfortunately this
    // will get expensive quickly: the decimal expansion of sqrt(2) overflows
    // IEEE754 doubles (1e308) in the 615th digit, and would require 1024 bits
    // to represent as an integer (or 32 int32 words).  Division of these large
    // numbers will be quite expensive, though it's possible we could avoid true
    // division with some clever tricks of bounding and remainders.  Given that
    // the quotient is expected to be an integer, it would be reasonable to take
    // a guess based on the first digits and then verify, and "scalar"
    // multiplication is only O(n) rather than O(n^2).
    let parts = []
    let a = 1;
    let b = 0;
    let c = 0;
    let d = 1;
    let last = NaN;
    let next = NaN;
FOR:
    for (const e of this) {
console.log('a='+a+', b='+b+', c='+c+', d='+d+', e='+e);
      [a, b, c, d] = [a * e + b, a, c * e + d, c];
      while (true) {
        last = b / d;
        next = a / c;
        const ipart = Math.floor(last);
console.log('last='+last+', next='+next+', ipart='+ipart);
        if (ipart == Math.floor(next)) {
          if (parts.length == 1) parts.push('.');
          parts.push(ipart.toString(radix));
          a = radix * (a - c * ipart);
          b = radix * (b - d * ipart);
          // Note: it's possible that the first few digits can be reduced if
          // there's a GCD != 1 after multiplying the radix - but once we reach
          // unity, there's no point checking going forward since it will never
          // happen again.
          if (parts.length > digits) break FOR;
        } else break;
      }
    }
    while (parts.length <= digits && a != 0) {
      next = a / c;
      const ipart = Math.floor(next);
      if (parts.length == 1) parts.push('.');
      parts.push(ipart.toString(radix));
      a = radix * (a - c * ipart);
    }
    // TODO - if the last digit was >= half, round up
    // the previous one - may cause chaining carries!
    return parts.join('');
  }

  valueOf() {
    let a = 1;
    let b = 0;
    let c = 0;
    let d = 1;
    let last = NaN;
    let next = NaN;
    for (const e of this) {
      [a, b, c, d] = [a * e + b, a, c * e + d, c];
      if (((next = a / c) == last) ||
          (Math.abs(a) > Number.MAX_SAFE_INTEGER &&
           Math.abs(c) > Number.MAX_SAFE_INTEGER)) {
        break;
      }
      last = next;
    }
    return a / c;
  }

  static of(number) {
    return new CF.OfNumber(number);
  }

  reciprocal() {
    const iter = this[Symbol.iterator]();
    if (!this.get(0)) {
      iter.next();
      return new CF.OfIterator(iter);
    } else {
      return new CF.OfIterator(function * () {
        yield 0;
        yield * iter;
      }());
    }
  }
}

// module-local?
CF.Fixed = class extends CF {
  constructor(terms) {
    terms.push(Infinity);
    super(terms);
  }

  /** @override */
  generate() {
    return Infinity;
  }
}

// module-local?
CF.OfNumber = class extends CF {
  constructor(num) {
    super();
    this.num = num;
  }

  generate() {
    const floor = Math.floor(this.num);
//console.log('generate: this.num='+this.num+', floor='+floor+', next='+(1/(this.num-floor)));
    this.num = 1 / (this.num - floor);
    return floor;
  }
}


CF.OfIterator = class extends CF {
  constructor(iter) {
    super([]);
    console.dir(iter);
    this.iter = iter;
  }

  generate() {
    const next = this.iter.next();
    return next.done ? Infinity : next.value;
  }
}

module.exports = {CF};
