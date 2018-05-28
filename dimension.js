// General-purpose number.  Capable of representing floating points,
// rationals, imaginary, and dimensions.  Complex numbers may not be
// combined with dimensions.  Provides arithmetic and function
// operations.  Rationals will fall back on floating point at some
// point?  What about arbitrary-precision integers?
class Num {
  constructor(top, bot, ) {
    

}


class Dimension {
  constructor(value, unit) {

  }

}


/** @record */
Dimension.Mapper = class {
  /**
   * @param {!Unit} left
   * @param {!Unit} right
   * @return {?Unit}
   */
  mapUnit(left, right) {}

  /**
   * @param {number} left
   * @param {number} right
   * @return {number}
   */
  mapNumber(left, right) {}
};



Dimension.Unit = class {
  /** @param {!Object<string, number>} */
  constructor(exponents) {
    this.exponents = exponents;
  }
};

const DEFINITIONS = {
  // basic units
  'm':  '|-',
  'kg': '',
  's':  '|-1',
  'A':  '|m-1',
  'K':  '|m-1',
  'cd': '|1',
  'mol': '|1',
  // derived units
  'g':  '0.001~kg|µ-k',
  'Hz': '1~s^-1|1-G',
  'N':  '1~kg*m/s^2|1-k',
  'Pa': '1~N/m^2|1-M',
  'J':  '1~N*m|1-k',
  'W':  '1~J/s|m-G',
  'C':  '1~A*s|1',
  'V':  '1~J/c|m-k',
  'F':  '1~C/V|p-1',
  'Ω':  '1~V/A|m-G',
  'Ω':  '1~V/A',
  'S':  '1~A/V|1',
  'Wb': '1~J/A|1',
  'T':  '1~V*s/m^2|1',
  'H':  '1~V*s/A|m-1',
  '°C': '1~K',
  'lm': '1~cd',
  'lx': '1~lm/m^2',
  'Bq': '1~s^-1',
  'Gy': '1~J/kg',
  'Sv': '1~J/kg',
  'kat': '1~mol/s',
};

const PREFIXES = {
  'Y': 24,
  'Z': 21,
  'E': 18,
  'P': 15,
  'T': 12,
  'G': 9,
  'M': 6,
  'k': 3,
  'h': 2,
  'da': 1,
  'd': -1,
  'c': -2,
  'm': -3,
  'µ': -6,
  'μ': -6,
  'u': -6,
  'n': -9,
  'p': -12,
  'f': -15,
  'a': -18,
  'z': -21,
  'y': -24,
};
