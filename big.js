// Represent longs as an array of unsigned int32s.
// We don't actually pass these around outside of the Rat class.

const MAX_UINT8 = 0xff;
const FIRST_UINT16 = MAX_UINT8 + 1;

function to8(x) {
  return x & 0xff; // >>> 0
}

function toI8(x) {
  x = x & 0xff; // >>> 0
  if (x > 0x7f) x |= 0xffffff00;
  return x;
}


class Big extends Array {
  static make(arg) {
    if (arg instanceof Big) return arg;
    let low = to8(arg);
    if (toI8(arg) == arg) {
      return Big.of(low);
    }
    const out = Big.of(low);
    arg = Math.floor(arg / FIRST_UINT16);
    while (true) {
      low = to8(arg);
      out.push(low);
      if (toI8(arg) == arg) {
        return out;
      }
      arg = Math.floor(arg / FIRST_UINT16);
    }
    // //if (arg < 0) {
    // //  low = -low >>> 0;
    // //}
    // const high = Math.floor(arg / FIRST_UINT16);
    // return Big.of(low, to8(high))
  }

  static negative(arg) {
    return +!!(arg instanceof Big ? arg[arg.length - 1] & 0x80 : arg < 0);
  }

  static add(left, right) {
    if (typeof left == 'number' && typeof right == 'number') {
      const result = left + right;
      if (result == toI8(result)) return result;
    }
//console.log('add('+left+' + '+right+')');
    left = left instanceof Big ? left.slice() : Big.make(left);
    right = Big.make(right);
    let carry = 0;
    let i = 0;
    const leftDefault = Big.negative(left) ? 0xff : 0;
    const rightDefault = Big.negative(right) ? 0xff : 0;
let max = Math.max(left.length, right.length);
    while (i <= max) {
      const x =
          (i < left.length ? left[i] : leftDefault) +
          (i < right.length ? right[i] : rightDefault) +
          carry;
//console.log('bit '+i+': left='+(i < left.length ? left[i] : leftDefault)+', right='+(i < right.length ? right[i] : rightDefault)+', carry='+carry+' => '+x+'='+to8(x)+'/'+Math.floor(x / FIRST_UINT16));
      left[i++] = to8(x);
      carry = Math.floor(x / FIRST_UINT16);
    }
// stupid carry seems to be messing us up somehow... negative gives carry 1...
// - should probably have been 0xfe, but how do we know? which sign to use?
    //if (carry) left.push(carry);
// TODO: may need to deal with sign bit? extra 0?
let msb = left[left.length - 1];
let nmsb = left[left.length - 2];
//console.log('  => msb=' + msb + ', nmsb=' + nmsb + ' => ' + left);
if (msb == 0 && !(nmsb & 0x80) || msb == 0xff && (nmsb & 0x80)) left.pop();
    return left;
  }

  /**
   * @param {!Long|number} arg
   * @return {!Long|number}
   */
  static complement(arg) {
    if (typeof arg == 'number') return ~arg;
    if(arg.length > 10) throw new Error();
    return arg.map(x => (~x) & 255);
  }

  /**
   * @param {!Long|number} arg
   * @return {!Long|number}
   */
  static negate(arg) {

 // todo - negatives still way wrong!

    return Big.add(1, Big.complement(arg));
  }

  // require div an int8 ?
  static divRem(arg, div) {
    if (typeof arg == 'number') return [Math.floor(arg / div), arg % div];
    // use the elementary school division algorithm
    //  divide the first digit, carry the remainder
    let i = arg.length;
    let out = new Big();
    let top = 0;
    while (i--) {
      top = (rem << 8)



      let quotient = top / div;
      let digit = Math.floor(quotient);
      out.unshift(digit);
      rem = top - div * digit;
      
    }

  }

  valueOf() {
    if (this[this.length - 1] & 0x80) {
      // TODO - Big.negate is not changing the sign bit...!
      return -Big.negate(this);
    }
    let num = 0;
    let i = this.length;
    while (i--) { num = num * 256 + ((this[i] >>> 0)&0xff); }
    return num;
  }


toString(){return '['+this.join()+']';}

  /**
   * @param {!Long|number} arg
   * @param {number} radix
   * @return {string}
   */
  static toString(arg, radix = 10) {
    if (typeof arg == 'number') return arg.toString(radix);
    if (radix < 2 || radix > 36) {
      throw new RangeError(
          'toString() radix argument must be between 2 and 36');
    }
    const digits = [];
    // while (arg) {
      
    // }
  }
}

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';



module.exports = {to8, Big};
