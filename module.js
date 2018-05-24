/**
 * A suite of features that can be installed.
 */
class Module {
  /**
   * @param {string} name
   * @param {!Array<!Parsers>} parsers
   * @param {!Object<string, function(...?): *>} functions
   * @param {!function(!Calculator)} preinstall
   */
  constructor(name, parsers, functions = {}, preinstall = function() {}) {
    /** @const */
    this.name = name;
    /** @const */
    this.parsers = parsers;
    /** @const */
    this.functions = functions;
    /** @const */
    this.preinstall = preinstall;
  }

  /** @param {!Calculator} calc */
  install(calc) {
    this.preinstall(calc);
    for (const parser of this.parsers) {
      calc.addParser(parser);
    }
    for (const name in this.functions) {
      calc.addFunction(name, this.functions[name]);
    }
  }

  /** @param {!Calculator} calc */
  uninstall(calc) {
    for (const parser of this.parsers) {
      calc.removeParser(parser);
    }
    for (const name in this.functions) {
      calc.removeFunction(name, this.functions[name]);
    }
  }

  /** @override */
  toString() {
    return this.name;
  }

  /**
   * @param {...!Module} modules
   * @return {function(!Calculator)}
   */
  static deps(...modules) {
    return (calc) => {
      for (const module of modules) {
        module.install(calc);
      }
    };
  }
}
