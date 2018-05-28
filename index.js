// const {Calculator} = require('./calc');
// const {addNumbers, addParens, addArithmetic} = require('./ast');

// const c = new Calculator();
// addNumbers(c);
// addArithmetic(c);
// addParens(c);

// console.log(c.evaluate('2 * (4 + 5)'));


// const {CF} = require('./cf');
// const x = CF.of(42);
// console.log('x.valueOf()='+x.valueOf())
// console.log('x.toString()='+x.toString())
// console.log('x.toDebugString()='+x.toDebugString())

// const y = x.reciprocal();
// console.log('y.valueOf()='+y.valueOf())
// console.log('y.toString()='+y.toString())
// console.log('y.toDebugString()='+y.toDebugString())

// const z = y.reciprocal();
// console.log('z.valueOf()='+z.valueOf())
// console.log('z.toString()='+z.toString())
// console.log('z.toDebugString()='+z.toDebugString())


// const {Big} = require('./big');

// let x = Big.make(500);
// console.log(x.valueOf());
// //console.log(Big.toString(x));

// x = Big.make(-500);
// console.log(x.valueOf());
// x = Big.add(x, x);
// console.log(x);

// x = Big.make(32000);
// x = Big.add(x,x)
// console.log(x);


const {Long} = require('./long');

console.log(Long.make(0x3000000000).toDebugString());
let x = Long.multiply(0x300000001, 0x400000002);
console.log(Array.from(x).map(x=>x.toString(16).padStart(8, '0')));
