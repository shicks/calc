// const {Calculator} = require('./calc');
// const {addNumbers, addParens, addArithmetic} = require('./ast');

// const c = new Calculator();
// addNumbers(c);
// addArithmetic(c);
// addParens(c);

// console.log(c.evaluate('2 * (4 + 5)'));


const {CF} = require('./cf');
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

const sqrt2 = new CF.OfIterator(function*() { yield 1n; while (true) yield 2n; }());
console.log(sqrt2.toString(10, 500));

const halfSqrt2 = sqrt2.reciprocal();
console.log(halfSqrt2.toString(10, 500));

const recover = CF.add(halfSqrt2, halfSqrt2);
console.log(recover.toString(10, 500));

console.log(CF.mul(recover, recover).toString(10, 500));


// const exp1 = new CF.OfIterator(function*() { yield 2n; let x = 2n; for(;;) {yield*[1n, x, 1n]; x+=2n;} }());
// console.log(exp1.toString(10, 10000));

// const phi = new CF.OfIterator(function*() { for (;;) yield 1n; }());
// console.log(phi.toString(10, 10000));



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


// const {Long} = require('./long');

// console.log(Long.make(0x3000000000).toDebugString());
// let x = Long.multiply(0x300000001, 0x400000002);
// console.log(Array.from(x).map(x=>x.toString(16).padStart(8, '0')));

// import {FOO} from './int.js';
// console.log(FOO);

// const ints = require('./int.js');

// const n = ints.of(2);
// const m = ints.of(1024);
// console.log(ints.pow(n, m));

// NOTE: it seems like node-10 actually supports native BigInt
// Might as well just use it directly? save all the hassle?
