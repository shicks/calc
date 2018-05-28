// Represent different kinds of numbers.
//   Floats: number
//   Ints and rationals: class Rat { num: number[], den: number[] }
//   Complex: class Complex { re: number, im: number }
//   Dimensions: class Dimen { val: number. unit: string }



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
