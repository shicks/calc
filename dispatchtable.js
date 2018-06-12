const TYPE = Symbol`dispatchTable.TYPE`;

class DynamicFunction extends Function {

  static create(n, name) {
    const obj = new DynamicFunction(name);
    const f =
        n == 1 ? obj.call1.bind(obj) :
        n == 2 ? obj.call2.bind(obj) :
        n == 3 ? obj.call3.bind(obj) :
        obj.call.bind(obj);
    Reflect.setPrototypeOf(f, obj);
    return f;
  }

  constructor(name) {
    this.name = name;
    this.table = {};
  }

  call1(x) {
    const f = this.table[x[TYPE]];
    if (!f) throw new Error('Bad type for ' + this.name + ': ' + x);
    return f(x);
  }

  call2(x, y) {
    const f = this.table[x[TYPE] + y[TYPE]];
    if (!f) throw new Error('Bad types for ' + this.name + ': ' + x + ', ' + y);
    return f(x, y);
  }

  call3(x, y, z) {
    const f = this.table[x[TYPE] + y[TYPE] + z[TYPE]];
    if (!f) {
      throw new Error(
          'Bad types for ' + this.name + ': ' + x + ', ' + y + ', ' + z);
    }
    return f(x, y, z);
  }

  call(...args) {
    const types = [];
    for (let i = 0; i < args.length; i++) {
      types[i] = args[i][TYPE];
    }
    const f = this.table[types.join('')];
    if (!f) throw new Error('Bad types for ' + this.name + ': ' + args);
    return f(...args);
  }

  /** @return {!Handler} */
  handle(...args) {
    return new Handler(args);
  }

}


class Handler {

  constructor(table, types) {
    this.table = table;
    this.types = types.map(x => x[TYPE]);
    this.isCommutative = false;
  }

  commutative() {
    this.isCommutative = true;
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
