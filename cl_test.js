const {CL} = require('./cl');
const {expect} = require('chai');

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
