// Represent longs as an array of unsigned int32s.
// We don't actually pass these around outside of the Rat class.

// TODO - consider continued fractions: https://math.stackexchange.com/questions/164606/are-there-simple-algebraic-operations-for-continued-fractions
//  - might provide a better data structure for rationals? still need longs tho
//  - or if we ever get that, call it an approximation and be done... still way
//    more accurate than floating point
// https://crypto.stanford.edu/pbc/notes/contfrac/bihom.html


/** Least significant word first. */
class Long extends Uint32Array {

  /**
   * @param {!Long|number} arg
   * @return {!Long}
   */
  static make(arg, clone = false) {
    if (arg instanceof Long) return clone ? Long.from(arg) : arg;
    // Guaranteed to fit in 2 words
    arg = Math.trunc(arg);
    if (Number.isSafeInteger(arg)) {
      let low = arg >>> 0;
      if ((arg | 0) == arg) {
        return Long.of(low);
      }
      const high = Math.floor(arg / 0x100000000);
      return Long.of(low, high);
    }
    // General case - look at the IEEE754 bits
    const a = new ArrayBuffer(8);
    const d = new Float64Array(a);
    const i = new Uint32Array(a);
    d[0] = arg;
    const sign = i[1] & 0x80000000;
    const exponent = ((i[1] & 0x7ff00000) >>> 20) - 1023; // + !!sign;
    // if (sign) {
    //   i[1] = ~i[1];
    //   i[0] = ~i[0];
    // }
//     const high = ((i[1] & 0xfffff) | (sign ? 0xfff00000 : 0x100000)) >>> 0;
//     const low = i[0];
// console.log('sign = ' + sign + ', exponent = ' + exponent + ', high = ' + high.toString(16) + ', low = '+ low.toString(16));
// const r=/*
//     return/**/ Long.of(low, high).shiftLeft(exponent - 52);
// console.log(' => '+r.toDebugString());return r;

    let high = ((i[1] & 0xfffff) | 0x100000) >>> 0;
    let low = i[0];
    if (sign) {
      low = ~(low - 1);
      high = ~high;
      if (low == 0) ++high;
    }
    return Long.of(low, high).shiftLeft(exponent - 52);

    // let result = Long.of(low, high);
    // // TODO(sdh): how to avoid the extra negate operation? doesn't seem
    // // feasible, since we may need to carry from low to high.
    // if (sign) {
    //   // negate by hand
      
    // }
    // return result.shiftLeft(exponent - 52);
  }

  /** @override */
  subarray(start, end) {
    // check conformance of subarray - some VMs don't respect @@species.
    const result = super.subarray(start, end);
    if (result instanceof Long) {
      delete Long.prototype.subarray;
      return result;
    } else {
      // use slice instead
      Long.prototype.subarray = Uint32Array.prototype.slice;
      return this.slice(start, end);
    }
  }

  /** @return {!Long|number} */
  trim() {
    let length = this.length;
    while (length > 1 &&
        ((this[length - 1] == 0 && !(this[length - 2] & 0x80000000)) ||
         (this[length - 1] == 0xffffffff && (this[length - 2] & 0x80000000)))) {
      length--;
    }
    if (length == 1) {
      return this[0] | 0;
    } else if (length == 2) {
      const high = this[1] & 0xffe00000;
      if (high == 0 || (high == -0x200000)) {
        const result = (this[1] | 0) * 0x100000000 + this[0];
        if (Number.isSafeInteger(result)) return result;
      }
    }
    return length == this.length ? this : this.subarray(0, length);
  }

  /**
   * Returns the minimum number of bits to represent this number, including
   * the sign bit.
   * @return {number}
   */
  bitCount() {
    const msw = this[this.length - 1];
    return 32 * this.length - Math.clz32(this.signBit() ? ~msw : msw) + 1;
  }

  /** @return {number} 0 or 0x80000000. */
  signBit() {
    return this[this.length - 1] & 0x80000000;
  }

  get(index) {
    return index < 0 ? 0 :
        index < this.length ? this[index] :
        this.signBit() && 0xffffffff;
  }

  shiftLeft(bits) {
    bits = Number(bits);
    const lowOffset = bits & 31;
    const highOffset = bits >>> 5;
    if (!lowOffset) {
      // multiple of 32 bits, so just insert zeros at front
      const out = new Long(this.length + highOffset);
      out.set(this, highOffset);
      return out;
    }
    // general case: add words and also shift
    const count = this.bitCount() + bits;
    const words = Math.ceil(count / 32);
    const out = new Long(words);
    for (let i = words - this.length - 1; i < words; i++) {
      out[i] =
          (this.get(i - highOffset) << lowOffset) |
          (this.get(i - highOffset - 1) >>> (32 - lowOffset));
    }
    return out;
  }

  shiftRight(bits) {
    bits = Number(bits);
    const lowOffset = bits & 31;
    const highOffset = bits >>> 5;
    if (!lowOffset) {
      // multiple of 32 bits, so just slice
      return highOffset < this.length ?
          this.slice(highOffset) :
          Long.of(this.get(highOffset));
    }
    // general case: remove words and also shift
    const words = Math.max(1, Math.ceil((this.bitCount() - bits) / 32));
    const out = new Long(words);
    const highMask = 0xffffffff >>> lowOffset;
    for (let i = 0; i < words; i++) {
      out[i] =
          (this.get(i + highOffset + 1) << (32 - lowOffset)) |
          (this.get(i + highOffset) >>> lowOffset);
    }
    return out;
  }

  bitOr(that) {
    const words = Math.max(this.length, that.length);
    const out = new Long(words);
    for (let i = 0; i < words; i++) {
      out[i] = this.get(i) | that.get(i);
    }
    return out.trim();
  }


  /**
   * @param {!Long|number} that
   * @return {!Long|number}
   */
  plus(that) {
    // if (typeof left == 'number' && typeof right == 'number') {
    //   const result = left + right;
    //   if (Number.isSafeInteger(result)) return result;
    // }
    that = Long.make(that);
    const out = new Long(Math.max(this.length, that.length) + 1);
    let carry = 0;
    let i = 0;
    while (i < out.length) {
      const x = this.get(i) + that.get(i) + carry;
      out[i++] = x;
      carry = Math.floor(x / 0x100000000);
    }
    return out.trim();
  }

  minus(that) {
    // TODO - handle long RHS
    return this.plus(-that);
  }

  /**
   * @return {!Long}
   */
  complement() {
    return this.map(x => ~x);
  }

  /**
   * @return {!Long|number}
   */
  negate() {
    return this.complement().plus(1);
  }

  divRem(/** number */ div) {
    // if (typeof arg == 'number') return [Math.floor(arg / div), arg % div];
    const quot = new Long(this.length);
    let j = 0;
    let carry = 0;
    for (let i = this.length - 1; i >= 0; i--) {
      const t = this[i] + (carry * 0x100000000);
      const q = Math.floor(t / div);
      quot[j++] = q;
      carry = t - q * div;
    }
    return [quote.subarray(j).trim(), carry];
  }

  // mul(/** number */ mul) {
  //   const prod = new Long(this.length + 1);
  //   let i = 0;
  //   let carry 

  // }


  static multiply(left, right) {
    if (typeof left == 'number' && typeof right == 'number') {
      const result = left * right;
      if (Number.isSafeInteger(result)) return result;
    }
    left = Long.make(left);
    right = Long.make(right);

console.log('left = '+left.toDebugString() +', right='+right.toDebugString());

    const out = new Long(left.length + right.length + 1);
    let carry = 0;
    let i = 0;
    while (i < out.length) {
      // plan: multiply in 16-bit chunks, then add them all
      let x = carry;
      carry = 0;
      const start = 0;//Math.max(0, i - right.length); // i - j < right.length
      const end = i;//Math.min(i, left.length); // j < left.length
      for (let j = start; j < end; j++) {
        const leftTerm = left.get(j);
        const rightTerm = right.get(i - j);
        const leftUpper = leftTerm >>> 16;
        const rightUpper = rightTerm >>> 16;
        const leftLower = leftTerm & 0xffff;
        const rightLower = rightTerm & 0xffff;
        x += leftLower * rightLower;
        const mid = leftLower * rightUpper + rightUpper * leftLower;
        carry += mid >>> 16;
        x += mid & 0xffff;
        carry += leftUpper * rightUpper;
      }
      carry += Math.floor(x / 0x100000000);
      out[i++] = x;
    }
    return out; //.trim();
  }


  toDebugString() {
    return Array.from(this)
        .reverse()
        .map(x => x.toString(16).padStart(8, '0'))
        .join(' ');
  }


  valueOf() {
    if (this.length == 1) {
      return this[0] | 0;
    } else if (this.length == 2) {
      return (this[1] | 0) * 0x100000000 + this[0];
    }

    const len = this.length;
    const multiplier = 2 ** (32 * (len - 3));
    return multiplier * (
        this[len - 3] +
        2 ** 32 * this[len - 2] +
        2 ** 64 * (this[len - 1] | 0));
  }


  /**
   * @param {!Long|number} arg
   * @param {number} radix
   * @return {string}
   */
  toString(radix = 10) {
    if (radix < 2 || radix > 36) {
      throw new RangeError(
          'toString() radix argument must be between 2 and 36');
    }
    const digits = [];
    while (this) {
      throw new Error('not yet implemented');
    }
  }
}

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

module.exports = {Long};
