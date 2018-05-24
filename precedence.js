/** @enum {number} */
const Precedence = {
  /** Includes exponent, function application */
  POSTFIX: 20,
  /** Prefix operators like minus */
  PREFIX: 19,
  /** Implicit multiplication */
  IMPLICIT_MULTIPLICATION: 18,
  /** Ordinary multiplication and division */
  MULTIPLICATION: 17,
  /** Unit application: the `~` operator */
  UNIT_APPLICATION: 16,
  ADDITION: 15,


  INSIDE_PAREN: 0,
};

/** @type {!Object<!Precedence, number>} */
// +1 means process existing operator first, -1 means hold onto it
const ASSOCIATIVITY = {
  [Precedence.POSTFIX]: 1,
  [Precedence.PREFIX]: -1,
  [Precedence.IMPLICIT_MULTIPLICATION]: 1,
  [Precedence.MULTIPLICATION]: 1,
  [Precedence.UNIT_APPLICATION]: 0,
  [Precedence.ADDITION]: 1,

  [Precedence.INSIDE_PAREN]: -1,
};

module.exports = {ASSOCIATIVITY, Precedence};
