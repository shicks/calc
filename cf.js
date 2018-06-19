// Continued fractions


// TODO - how to represent and understand cycles?
//   - "back to the same state"
//   - only infinite repeats cause danger of waiting forever for resolution...
// CFIterator has next() method and index for current position, save with state

/**
 * A continued fraction.
 * @implements {Iterable<bigint>}
 * @abstract
 */
class CF {
  /** @param {!Array<bigint>=} terms CF will take ownership of this array. */
  constructor(terms = []) {
    /** @const {!Array<bigint>} */
    this.terms = terms;
  }

  /**
   * @return {bigint}
   * @abstract
   */
  generate() {}

  /** @return {!IterableIterator<bigint>} */
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
      index: () => {
        return i;
      },
    };
  }

  /**
   * @param {number} index
   * @return {?bigint}
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
    let sep = '; ';
    let index = 0;
    let parts = ['['];
    while (index < this.terms.length) {
      let term = this.terms[index];
      if (term == null) {
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
    radix = BigInt(radix);
    digits = Number(digits);
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


/** @implements {IterableIterator<bigint>} */
CF.Iterator = class {
  constructor(cf) {
    this.index = 0;
    this.cf = cf;
  }

  [Symbol.iterator]() { return this; }

  next() {
    
  }
}


// module-local?
CF.Fixed = class extends CF {
  constructor(terms) {
    terms.push(null);
    super(terms);
  }

  /** @override */
  generate() {
    return null;
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
    return Number.isFinite(floor) ? BigInt(floor) : null;
  }
}


CF.OfIterator = class extends CF {
  constructor(iter) {
    super([]);
    console.dir(iter);
    this.iter = iter;
  }

  generate() {
    // if next is a {repeat: number} then do something special?

    const next = this.iter.next();
    return next.done ? null : next.value;
  }
}

// z = (ax + b) / (cx + d)
CF.homographic = (x, a, b, c, d) => new CF.OfIterator(function*() {
  let stuck = 0;
  for (const e of x) {
    stuck++;
    [a, b, c, d] = [a * e + b, a, c * e + d, c];
    while (c != 0 && d != 0) {
      const next = a / c;
      const last = b / d;
      if (next == last || next == last + 1n && stuck > 10) {
        stuck = 0;
        yield next;
        [a, b, c, d] = [c, d, a - next * c, b - next * d];
      } else {
        break;
      }
    }
  }
}());


const abs = (x) => x < 0n ? -x : x;


// z = (axy + bx + cy + d) / (exy + fx + gy + h)
CF.bihomographic = (x, y, a, b, c, d, e, f, g, h) => new CF.OfIterator(function*() {
  x = x[Symbol.iterator]();
  y = y[Symbol.iterator]();

// NOTE - this handling for getting unstuck doesn't actually work...
let stuck = 0;
  while (true) {
if(a>1000000000000000000n)return;
    const ae = e != 0n ? a / e : null;
    const bf = f != 0n ? b / f : null;
    const cg = g != 0n ? c / g : null;
    const dh = h != 0n ? d / h : null;
console.log(`${a}/${e}=${ae} ${b}/${f}=${bf} ${c}/${g}=${cg} ${d}/${h}=${dh} ${stuck}`);
    if ((ae == dh || dh != null && ae == dh + 1n && stuck > 10) && cg == bf && dh == bf) {
      // egest a term
      yield ae;
      stuck = 0;
      [a, b, c, d, e, f, g, h] = [e, f, g, h, a - ae * e, b - ae * f, c - ae * g, d - ae * h];
console.log(`egest: ${ae}, ${[a,b,c,d,e,f,g,h]}`);
      continue;
    }
    stuck++;
    const xdiff = bf != null && dh != null ? abs(bf - dh) : null;
    const ydiff = cg != null && dh != null ? abs(cg - dh) : null;
    if (xdiff == null || xdiff > ydiff) {
      // ingest from x
      const {value, done} = x.next();
console.log(`ingest from x: value=${value} (${typeof value}), done=${done}`);
      if (done) {
        yield * CF.homographic(y, a, b, e, f);
        return;
      }
      [a, b, c, d, e, f, g, h] = [a * value + c, b * value + d, a, b, e * value + g, f * value + h, e, f];
    }
    if (ydiff == null || ydiff >= xdiff) {
      // ingest from y
      const {value, done} = y.next();
console.log(`ingest from y: value=${value} (${typeof value}), done=${done}`);
      if (done) {
        yield * CF.homographic(x, a, c, e, g);
        return;
      }
      [a, b, c, d, e, f, g, h] = [a * value + b, a, c * value + d, c, e * value + f, e, g * value + h, g];
    }
  }
}());


CF.add = (x, y) => CF.bihomographic(x, y, 0n, 1n, 1n, 0n, 0n, 0n, 0n, 1n);
CF.mul = (x, y) => CF.bihomographic(x, y, 1n, 0n, 0n, 0n, 0n, 0n, 0n, 1n);


module.exports = {CF};



/// QUESTION
// how do we write standard operations on continued logarithms?!?
//  - no standard taylor series...?
//  --- how to do a sine?

//  z = x * (1 + 1/2 * 1/3 * x^2 * (1 + 1/4 * 1/5 * x^2 * (...
//  this is a lot of operations, won't work particularly nicely

// NOTE - may be able to reduce?
//  - just comes down to whether or not a non-2 term will ever show up.
//    if so, then the result isn't 2.  If it is then we'll never know it.
//    we could possibly output "accuracy" terms when no new terms are
//    available for a long time - i.e. "the next term is at least X"
//    so that if we know we only need 30 digits, we can call it a day.

// Math ops on continue fractions aren't super great... so maybe continued
// logs is the way to go, though it's pretty crummy for big numbers.
