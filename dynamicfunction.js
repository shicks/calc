const TYPE = Symbol`dispatchTable.TYPE`;

// NOTE: no reason for this to actually *be* a function
//  - instead it can just return a function, which won't
//    have any mutators anymore.
//  - this does mean we need to fully configure it before
//    any use (so dynamic modules are right out) but we
//    already wanted to do that.

class DynamicFunctionBuilder {

  constructor(arity, name) {
    this.arity = arity;
    this.name = name;
    this.table = {};
  }

  build() {
    const name = this.name;
    const table = this.table;
    switch (this.arity) {
    case 1:
      return (x) => {
        const f = table[x[TYPE]];
        if (!f) throw new Error(`Bad type for ${name}: ${x}`);
        return f(x);
      };
    case 2:
      return (x, y) => {
        const f = table[x[TYPE] + y[TYPE]];
        if (!f) throw new Error(`Bad type for ${name}: ${x}, ${y}`);
        return f(x, y);
      };
    case 3:
      return (x, y, z) => {
        const f = table[x[TYPE] + y[TYPE] + z[TYPE]];
        if (!f) throw new Error(`Bad type for ${name}: ${x}, ${y}, ${z}`);
        return f(x, y, z);
      };
    default:
      // TODO(sdh): build up JS code and use new Function() for it?
      //   - this could possibly be used to eliminate cascading closures
      //     in the case of coercions and other issues, by instead building
      //     up lots of simple functions with inlined assignments?
      const arity = this.arity;
      return (...args) => {
        const types = [];
        for (let i = 0; i < arity; i++) {
          types[i] = args[i][TYPE];
        }
        const f = this.table[types.join('')];
        if (!f) throw new Error('Bad types for ' + this.name + ': ' + args);
        return f(...args);
      };
    }
  }

  use(func) {
    return new Handler(this.table, func);
  }

  /** @return {!Handler} */
  handle(...args) {
    return new Handler(args);
  }

}




class Handler {

  constructor(table, func) {
    this.table = table;
    this.func = func;
    this.coercions = [];
  }

  for(...types) {
    types = types.map(t => t.prototype[TYPE]);

    

    this.table[types.join('')] = this.func;
    // find the power set of do or don't coerce each argument, and build up
    // a closure for it.
  }

  coercing(from, to, func) {
    // TODO - precondition check for TYPE existing
    this.coercions.push([from.prototype[TYPE], to.prototype[TYPE], func]);
    return this;
  }

  with(func) {
    // If commutative, then iterate over all permutations of this.types
    this.table[this.types.join('')] = func;
    if (this.isCommutative) {
      if (this.types.length != 2) {
        throw new Error('Commutative only allowed for binary functions.');
      }
      this.table[this.types[1] + this.types[0]] = (x, y) => func(y, x);
    }
  }
}


module.exports = {DynamicFunction};
