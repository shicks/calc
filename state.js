/**
 * @fileoverview Defines the calculator state, including loaded modules,
 * bound variables, and other modes.
 */

class State {
  constructor() {
    // /** @type {!Set<!State.Module>} */
    // this.modules = {};

    /** @type {!Object<string, *>} */
    this.vars = {};

    /** @type {number} */
    this.radix = 10;

    /** @type {!Object<string, function(...?): *>} */
    this.functions = {};
  }
}


// class Module {
//   /**
//    * @param {string} name
//    * @param {function(!State)=} init
//    */
//   constructor(name, init = function() {}) {
//     this.name = name;
//     this.init = init;
//   }

//   /** @override */
//   toString() {
//     return this.name;
//   }
// }


// /** @enum {!Module} */
// State.Module = {
//   MATH: new Module('MATH'),
//   UNITS: new Module('UNITS'),
//   SYM
// };
