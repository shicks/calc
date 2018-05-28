// Methods for handling units.  We represent a unit as a string in a
// canonicalized format.

// how to distinguish int52 from small float? may be nice to keep them separate
// once we start graphing, efficiency will matter a bit - probably stick to
// floats for that, so make sure they're efficient.  could use a visitor to
// coerce all inputs to floats first.

// Use strings for all non-float/int52 numbers?
// Valid combinations:
//  - float: number
//  - normal int: [0, int52]
//  - bigint/rat: [denom length, int32, int32, ...]: 2/3 -> [1,3,2]
//  - dimension: [Infinity, float, ...]
//  - complex: [-Infinity, real float, imag float]

//  - 'd1.2~m^2/s'
//  - 'c4,2'

//  - '1234/3~m'

// For actual string values, we could just prefix with 's'?
// ...


function multiply(unit) {
  
}
