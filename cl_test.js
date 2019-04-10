const {CL} = require('./cl');
const {expect} = require('chai');

/** Map of short continued logs */
const SIMPLE = {
  '':      [0, 1],
  '1':     [1, 1],
  '0':     [-1, 1],
  '11':    [2, 1],
  '10':    [1, 2],
  '00':    [-1, 2],
  '01':    [-2, 1],
  '111':   [4, 1],
  '110':   [3, 2],
  '100':   [2, 3],
  '101':   [1, 4],
  '001':   [-1, 4],
  '000':   [-2, 3],
  '010':   [-3, 2],
  '011':   [-4, 1],
  '1111':  [8, 1],
  '1110':  [3, 1],
  '1100':  [5, 3],
  '1101':  [5, 4],
  '1001':  [4, 5],
  '1000':  [3, 5],
  '1010':  [1, 3],
  '1011':  [1, 8],
  '0011':  [-1, 8],
  '0010':  [-1, 3],
  '0000':  [-3, 5],
  '0001':  [-4, 5],
  '0101':  [-5, 4],
  '0100':  [-5, 3],
  '0110':  [-3, 1],
  '0111':  [-8, 1],
  '11111': [16, 1],
  '11110': [6, 1],
  '11100': [10, 3],
  '11101': [5, 2],
  '11001': [9, 5],
  '11000': [8, 5],
  '11010': [4, 3],
  '11011': [9, 8],
  '10011': [8, 9],
  '10010': [3, 4],
  '10000': [5, 8],
  '10001': [5, 9],
  '10101': [2, 5],
  '10100': [3, 10],
  '10110': [1, 6],
  '10111': [1, 16],
  '00111': [-1, 16],
  '00110': [-1, 6],
  '00100': [-3, 10],
  '00101': [-2, 5],
  '00001': [-5, 9],
  '00000': [-5, 8],
  '00010': [-3, 4],
  '00011': [-8, 9],
  '01011': [-9, 8],
  '01010': [-4, 3],
  '01000': [-8, 5],
  '01001': [-9, 5],
  '01101': [-5, 2],
  '01100': [-10, 3],
  '01110': [-6, 1],
  '01111': [-16, 1],
};

describe('CL.of', function() {
  it('should handle simple number inputs', function() {
    expect(String(CL.of(123.456))).to.equal('123.456');
    expect(String(CL.of(-123.456))).to.equal('-123.456');
    expect(String(CL.of(-43))).to.equal('-43');
  });
  it('should handle scientific-notation number inputs', function() {
    CL.DIGITS = 300;
    expect(String(CL.of(1e200))).to.equal(1 + '0'.repeat(200));
    expect(String(CL.of(1e-200))).to.equal('0.' + '0'.repeat(199) + 1);
    expect(String(CL.of(-1.5e200))).to.equal(-15 + '0'.repeat(199));
    expect(String(CL.of(-1.5e-200))).to.equal('-0.' + '0'.repeat(199) + 15);
  });
  it('should handle bigint inputs', function() {
    expect(String(CL.of(10n ** 1000n))).to.equal(1 + '0'.repeat(1000));
  });
  it('should handle small rational numbers', function() {
    const seen = {};
    for (let s = 1; s > -2; s -= 2) {
      for (let i = 0; i <= 10; i++) {
        const a = s * i;
        for (let j = 1; j < 10; j++) {
          if (!seen[a / j]) {
            seen[a / j] = true;
            const want = Number.isInteger(a / j) ? String(a / j) : a + '/' + j;
            expect(CL.of([a, j]).toFrac()).to.equal(want);
          }
        }
      }
    }
  });
});
describe('CL.fromNonstandardContinuedFraction', function() {
  it('should compute pi', function() {
    const pi = CL.fromNonstandardContinuedFraction(function*(){
      let a = 1;
      let b = 1;
      while (true) {
        yield a;
        a += 2;
        yield b;
        b += a;
      }
    }(), [0, 4, 1, 0]);
    // TODO - valueOf appears to be broken...
    expect(Number(pi)).to.equal(Math.PI);
  });
  it('should compute e', function() {
    const e = CL.fromNonstandardContinuedFraction(function*(){
      yield 2;
      let a = 2;
      while (true) {
        yield * [1, 1, 1, a, 1, 1];
        a += 2;
      }
    }(), [1, 0, 0, 1]);
    expect(Number(e)).to.equal(Math.E);
  });
});

describe('CL.prototype.toString', function() {
  it('should handle degenerate cases', function() {
    expect(new CL('').toString()).to.equal('0');
    expect(new CL('1').toString()).to.equal('1');
    expect(new CL('0').toString()).to.equal('-1');
    expect(new CL('11').toString()).to.equal('2');
    expect(new CL('10').toString()).to.equal('0.5');
    expect(new CL('00').toString()).to.equal('-0.5');
    expect(new CL('01').toString()).to.equal('-2');
  });
  it('should handle simple cases', function() {
    expect(new CL('111').toString()).to.equal('4');
    expect(new CL('1111').toString()).to.equal('8');
    expect(new CL('11111').toString()).to.equal('16');
    expect(new CL('110').toString()).to.equal('1.5');
    expect(new CL('101').toString()).to.equal('0.25');
    expect(new CL('1011').toString()).to.equal('0.125');
    expect(new CL('0011').toString()).to.equal('-0.125');
    expect(new CL('011').toString()).to.equal('-4');
    expect(new CL('0111').toString()).to.equal('-8');
  });
});

describe('CL.prototype.toFrac', function() {
  it('should handle degenerate cases', function() {
    expect(new CL('').toFrac()).to.equal('0');
    expect(new CL('1').toFrac()).to.equal('1');
    expect(new CL('0').toFrac()).to.equal('-1');
    expect(new CL('11').toFrac()).to.equal('2');
    expect(new CL('10').toFrac()).to.equal('1/2');
    expect(new CL('00').toFrac()).to.equal('-1/2');
    expect(new CL('01').toFrac()).to.equal('-2');
  });
  it('should handle simple cases', function() {
    expect(new CL('111').toFrac()).to.equal('4');
    expect(new CL('1111').toFrac()).to.equal('8');
    expect(new CL('11111').toFrac()).to.equal('16');
    expect(new CL('110').toFrac()).to.equal('3/2');
    expect(new CL('101').toFrac()).to.equal('1/4');
    expect(new CL('1011').toFrac()).to.equal('1/8');
    expect(new CL('0011').toFrac()).to.equal('-1/8');
    expect(new CL('011').toFrac()).to.equal('-4');
    expect(new CL('0111').toFrac()).to.equal('-8');
    expect(new CL('101010').toFrac()).to.equal('3/8');
    expect(new CL('11100010').toFrac()).to.equal('22/7');
  });
});

describe('CL.prototype.valueOf', function() {
  it('should handle simple nubers', function() {
    for (const [terms, [num, den]] of Object.entries(SIMPLE)) {
      expect(Number(new CL(terms))).to.equal(num / den);
    }
  });
});

describe('CL.prototype.cmp', function() {
  it('should handle simple numbers', function() {
    for (const [terms1, [num1, den1]] of Object.entries(SIMPLE)) {
      for (const [terms2, [num2, den2]] of Object.entries(SIMPLE)) {
        let want = num1 * den2 - den1 * num2;
        let out = new CL(terms1).cmp(new CL(terms2));
        if (want < 0) expect(out).to.be.below(0);
        if (want > 0) expect(out).to.be.above(0);
        if (want == 0) expect(out).to.equal(0);
      }
    }
  });
});

describe('CL.prototype.reciprocal', function() {
  it('should handle simple numbers', function() {
    for (const [terms, [num, den]] of Object.entries(SIMPLE)) {
      if (!den) continue;
      expect(Number(new CL(terms).reciprocal())).to.equal(den / num);
    }
  });
});

describe('CL.prototype.negate', function() {
  it('should handle simple numbers', function() {
    for (const [terms, [num, den]] of Object.entries(SIMPLE)) {
      expect(Number(new CL(terms).negate())).to.equal(-num / den);
    }
  });
});

describe('CL.prototype.abs', function() {
  it('should handle simple numbers', function() {
    for (const [terms, [num, den]] of Object.entries(SIMPLE)) {
      expect(Number(new CL(terms).abs())).to.equal(Math.abs(num / den));
    }
  });
});
