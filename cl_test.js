const {CL} = require('./cl');
const {expect} = require('chai');

describe('CL.of', function() {
  it('should handle simple number inputs', function() {
    // TODO - omit trailing zeros (and round if truncating!)
    expect(String(CL.of(123.456))).to.equal('123.456');
    // TODO - stop inserting signs every digit!
    expect(String(CL.of(-123.456))).to.equal('-123.456');
    expect(String(CL.of(-43))).to.equal('-43');
  });
  it('should handle scientific-notation number inputs', function() {
    expect(String(CL.of(1e200))).to.equal(1 + '0'.repeat(200));
    // TODO - change the default number of digits?
    expect(String(CL.of(1e-25))).to.equal('0.' + '0'.repeat(24) + 1);
  });


});
