const {CL} = require('./cl');
const {expect} = require('chai');

describe('CL.of', function() {
  it('should handle simple number inputs', function() {
    expect(String(CL.of(123.456))).to.equal('123.456');
    expect(String(CL.of(-123.456))).to.equal('-123.456');
    expect(String(CL.of(-43))).to.equal('-43');
  });
  it('should handle scientific-notation number inputs', function() {
    expect(String(CL.of(1e200))).to.equal(1 + '0'.repeat(200));
    expect(String(CL.of(1e-200))).to.equal('0.' + '0'.repeat(199) + 1);
    expect(String(CL.of(-1.5e200))).to.equal(-15 + '0'.repeat(199));
    expect(String(CL.of(-1.5e-200))).to.equal('-0.' + '0'.repeat(199) + 15);
  });
  it('should handle bigint inputs', function() {
    expect(String(CL.of(10n ** 1000n))).to.equal(1 + '0'.repeat(1000));
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
});
