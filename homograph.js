class Homograph {
  constructor(a, b, c, d) {
    this.a = BigInt(a);
    this.b = BigInt(b);
    this.c = BigInt(c);
    this.d = BigInt(d);
    this.ingested = 0;
    this.egested = 0;
  }

  /** @param {number|bigint|boolean|null} term */
  ingest(term) {
    const index = this.ingested;

    if (term == null) {
      // Nothing more to ingest.  Depending on this.ingested we can fix x.
      // But since we do our math based on a/c and (a+b)/(c+d), we want to
      // set b=d=0 for a constant.
      if (index == 0) {
        // no terms: x == 0
        [this.a, this.b, this.c, this.d] = [this.b, 0n, this.d, 0n];
      } else {
        // x == 1, so z = (a+b)/(c+d)
        [this.a, this.b, this.c, this.d] =
            [this.a + this.b, 0n, this.c + this.d, 0n];
      } 
      this.ingested = 2; // pass future ingestion checks
      return;
    }

    if (index == 0) {
      // sign bit
      if (!term) {
        this.a *= -1n;
        this.c *= -1n;
      }
    } else if (index == 1) {
      // exponent sign bit
      if (!term) {
        [this.a, this.b, this.c, this.d] = [this.b, this.a, this.d, this.c];
      }
    } else if (term) {
      // normal divide-by-2 bit
      if (!((this.b & 1n) || (this.d & 1n))) {
        this.b >>= 1n;
        this.d >>= 1n;
      } else {
        this.a <<= 1n;
        this.c <<= 1n;
      }
    } else {
      // normal reciprocate bit
      [this.a, this.b, this.c, this.d] =
          [this.a + this.b, this.a, this.c + this.d, this.c];
    }
    this.ingested++;
  }

  /** @return {?boolean} True if >= 2, false if < 2, null if uncertain. */
  next() {
    if (this.ingested < 2) throw new Error('next before ingestion');
    if (this.c == 0n || this.c + this.d == 0n) return null;
    const threshold = BigInt(Math.min(this.egested, 2));
    const x = this.a - (this.c * threshold);
    const y = x + this.b - (this.d * threshold);
    if (x >= 0n && y >= 0n) return true;
    if (x < 0n && y < 0n) return false;
    return null;
  }

  /** @param {number|bigint|boolean} term */
  egest(term) {
    const index = this.egested;
    if (index == 0) {
      if (!term) {
        this.a *= -1n;
        this.b *= -1n;
      }
    } else if (index == 1) {
      if (!term) {
        [this.a, this.b, this.c, this.d] = [this.c, this.d, this.a, this.b];
      }
    } else if (term) {
      if (!((this.a & 1n) || (this.b & 1n))) {
        this.a >>= 1n;
        this.b >>= 1n;
      } else {
        this.c <<= 1n;
        this.d <<= 1n;
      }
    } else {
      [this.a, this.b, this.c, this.d] =
          [this.c, this.d, this.a - this.c, this.b - this.d];
    }
    this.egested++;
  }

  /** @return {?bigint} null if not yet certain. */
  wholePart() {
    if (this.ingested < 2) throw new Error('whole before ingestion');
    if (this.c == 0n || this.c + this.d == 0n) return null;
    const ac = this.a / this.c;
    const bd = (this.a + this.b) / (this.c + this.d);
    return ac == bd ? ac : null;
  }

  /**
   * @param {bigint} digit
   * @param {bigint} radix
   */
  egestDigit(digit, radix = 10n) {
digit = BigInt(digit);
radix = BigInt(radix);
    this.a -= digit * this.c;
    this.b -= digit * this.d;
    if (this.c % radix == 0n && this.d % radix == 0n) {
      this.c /= radix;
      this.d /= radix;
    } else {
      this.a *= radix;
      this.b *= radix;
    }
  }

  negate() {
    this.a *= -1n;
    this.b *= -1n;
  }

  toString() {
    return `(${this.a} ${this.b};${this.c} ${this.d}): ${this.a}/${this.c}..${this.a+this.b}/${this.c+this.d}`;
  }

  static ofFloat(num) {
    const h = new Homograph(1, 0, 0, 1);
    if (num > 0) {
      h.ingest(1);
    } else if (num < 0) {
      h.ingest(0);
      num *= -1;
    } else {
      h.ingest(null);
      return h;
    }
    if (num > 1) {
      h.ingest(1);
    } else if (num < 1) {
      h.ingest(0);
      num = 1 / num;
    } else {
      h.ingest(null);
      return h;
    }
    let terms = 0;
    while (num != 1 && terms++ < 64) {
      if (num >= 2) {
//console.log(`num: ${num} => 1`);
        num /= 2;
        h.ingest(1);
      } else {
//console.log(`num: ${num} => 0`);
        num = 1 / (num - 1);
        h.ingest(0);
      }
    }
    h.ingest(null)
    return h;
  }

  static ofRat(num, denom) {
    const h = new Homograph(0, num, 0, denom);
    h.ingest(null);
    return h;
  }
}



class Bihomograph {
  // z = (axy + bx + cy + d) / (exy + fx + gy + h)
  constructor(a, b, c, d, e, f, g, h) {
    this.a = BigInt(a);
    this.b = BigInt(b);
    this.c = BigInt(c);
    this.d = BigInt(d);
    this.e = BigInt(e);
    this.f = BigInt(f);
    this.g = BigInt(g);
    this.h = BigInt(h);
    this.ingested1 = 0;
    this.ingested2 = 0;
    this.egested = 0;
  }
  /** @param {number|bigint|boolean|null} term */
  ingest1(term) {
    const index = this.ingested1;

    if (term == null) {
      // Nothing more to ingest.  Depending on this.ingested we can fix x.
      // But since we do our math based on a/e and (a+b)/(e+f), we want to
      // set c=d=g=h=0 for a constant.
      if (index == 0) {
        // no terms: x == 0
        [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] =
            [this.c, this.d, 0n, 0n, this.g, this.h, 0n, 0n];
      } else {
        // x == 1, so z = (a+b)/(c+d)
        [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] =
            [this.a + this.c, this.b + this.d, 0n, 0n,
             this.e + this.g, this.f + this.h, 0n, 0n];
      } 
      this.ingested1 = 2; // pass future ingestion checks
      return;
    }

    if (index == 0) {
      // sign bit
      if (!term) {
        this.a *= -1n;
        this.b *= -1n;
        this.e *= -1n;
        this.f *= -1n;
      }
    } else if (index == 1) {
      // exponent sign bit
      if (!term) {
        [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] =
            [this.c, this.d, this.a, this.b, this.g, this.h, this.e, this.f];
      }
    } else if (term) {
      // normal divide-by-2 bit
      if (!((this.c & 1n) || (this.d & 1n) || (this.g & 1n) || (this.h & 1n))) {
        this.c >>= 1n;
        this.d >>= 1n;
        this.g >>= 1n;
        this.h >>= 1n;
      } else {
        this.a <<= 1n;
        this.b <<= 1n;
        this.e <<= 1n;
        this.f <<= 1n;
      }
    } else {
      // normal reciprocate bit
      [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] =
          [this.a + this.c, this.b + this.d, this.a, this.b,
           this.e + this.g, this.f + this.h, this.e, this.f];
    }
    this.ingested1++;
  }

  /** @param {number|bigint|boolean|null} term */
  ingest2(term) {
    const index = this.ingested2;

    if (term == null) {
      // Nothing more to ingest.  Depending on this.ingested we can fix x.
      // But since we do our math based on a/e and (a+b)/(e+f), we want to
      // set c=d=g=h=0 for a constant.
      if (index == 0) {
        // no terms: x == 0
        [this.a, this.c, this.b, this.d, this.e, this.g, this.f, this.h] =
            [this.b, this.d, 0n, 0n, this.f, this.h, 0n, 0n];
      } else {
        // x == 1, so z = (a+b)/(c+d)
        [this.a, this.c, this.b, this.d, this.e, this.g, this.f, this.h] =
            [this.a + this.b, this.c + this.d, 0n, 0n,
             this.e + this.f, this.g + this.h, 0n, 0n];
      } 
      this.ingested2 = 2; // pass future ingestion checks
      return;
    }

    if (index == 0) {
      // sign bit
      if (!term) {
        this.a *= -1n;
        this.c *= -1n;
        this.e *= -1n;
        this.g *= -1n;
      }
    } else if (index == 1) {
      // exponent sign bit
      if (!term) {
        [this.a, this.c, this.b, this.d, this.e, this.g, this.f, this.h] =
            [this.b, this.d, this.a, this.c, this.f, this.h, this.e, this.g];
      }
    } else if (term) {
      // normal divide-by-2 bit
      if (!((this.b & 1n) || (this.d & 1n) || (this.f & 1n) || (this.h & 1n))) {
        this.b >>= 1n;
        this.d >>= 1n;
        this.f >>= 1n;
        this.h >>= 1n;
      } else {
        this.a <<= 1n;
        this.c <<= 1n;
        this.e <<= 1n;
        this.g <<= 1n;
      }
    } else {
      // normal reciprocate bit
      [this.a, this.c, this.b, this.d, this.e, this.g, this.f, this.h] =
          [this.a + this.b, this.c + this.d, this.a, this.c,
           this.e + this.f, this.g + this.h, this.e, this.g];
    }
    this.ingested2++;
  }


  /** @return {?boolean} True if >= 2, false if < 2, null if uncertain. */
  next() {
    if (this.ingested1 < 2) throw new Error('next before ingestion');
    if (this.ingested2 < 2) throw new Error('next before ingestion');
    if (this.e == 0n || this.e + this.f == 0n || this.e + this.g == 0n
        || this.e + this.f + this.g + this.h) {
      return null;
    }
    const threshold = BigInt(Math.min(this.egested, 2));

// TODO ---- fix these for extra inputs...

    const x = this.a - (this.c * threshold);
    const y = x + this.b - (this.d * threshold);
    if (x >= 0n && y >= 0n) return true;
    if (x < 0n && y < 0n) return false;
    return null;
  }

  /** @param {number|bigint|boolean} term */
  egest(term) {
    term = BigInt(term);
    const index = this.egested;
    if (index == 0) {
      if (!term) {
        this.a *= -1n;
        this.b *= -1n;
      }
    } else if (index == 1) {
      if (!term) {
        [this.a, this.b, this.c, this.d] = [this.c, this.d, this.a, this.b];
      }
    } else if (term) {
      if (!((this.a & 1n) || (this.b & 1n))) {
        this.a >>= 1n;
        this.b >>= 1n;
      } else {
        this.c <<= 1n;
        this.d <<= 1n;
      }
    } else {
      [this.a, this.b, this.c, this.d] =
          [this.c, this.d, this.a - this.c, this.b - this.d];
    }
    this.egested++;
  }

  /** @return {?bigint} null if not yet certain. */
  wholePart() {
    if (this.ingested < 2) throw new Error('whole before ingestion');
    if (this.c == 0n || this.c + this.d == 0n) return null;
    const ac = this.a / this.c;
    const bd = (this.a + this.b) / (this.c + this.d);
    return ac == bd ? ac : null;
  }

  /**
   * @param {bigint} digit
   * @param {bigint} radix
   */
  egestDigit(digit, radix = 10n) {
digit = BigInt(digit);
radix = BigInt(radix);
    this.a -= digit * this.c;
    this.b -= digit * this.d;
    if (this.c % radix == 0n && this.d % radix == 0n) {
      this.c /= radix;
      this.d /= radix;
    } else {
      this.a *= radix;
      this.b *= radix;
    }
  }

  negate() {
    this.a *= -1n;
    this.b *= -1n;
  }

  toString() {
    return `(${this.a} ${this.b};${this.c} ${this.d}): ${this.a}/${this.c}..${this.a+this.b}/${this.c+this.d}`;
  }

  static ofFloat(num) {
    const h = new Homograph(1, 0, 0, 1);
    if (num > 0) {
      h.ingest(1);
    } else if (num < 0) {
      h.ingest(0);
      num *= -1;
    } else {
      h.ingest(null);
      return h;
    }
    if (num > 1) {
      h.ingest(1);
    } else if (num < 1) {
      h.ingest(0);
      num = 1 / num;
    } else {
      h.ingest(null);
      return h;
    }
    let terms = 0;
    while (num != 1 && terms++ < 64) {
      if (num >= 2) {
//console.log(`num: ${num} => 1`);
        num /= 2;
        h.ingest(1);
      } else {
//console.log(`num: ${num} => 0`);
        num = 1 / (num - 1);
        h.ingest(0);
      }
    }
    h.ingest(null)
    return h;
  }

  static ofRat(num, denom) {
    const h = new Homograph(0, num, 0, denom);
    h.ingest(null);
    return h;
  }
}

