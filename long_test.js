const {Long} = require('./long');
const {expect} = require('chai');

const NUMBERS = [
  0,
  1,
  2,
  3,
  -1,
  -2,
  2 ** 16 - 1,
  2 ** 16,
  2 ** 16 + 1,
  -(2 ** 16) + 1,
  -(2 ** 16),
  -(2 ** 16) - 1,
  2 ** 31 - 1,
  2 ** 31,
  2 ** 31 + 1,
  -(2 ** 31) + 1,
  -(2 ** 31),
  -(2 ** 31) - 1,
  2 ** 32 - 1,
  2 ** 32,
  2 ** 32 + 1,
  -(2 ** 32) + 1,
  -(2 ** 32),
  -(2 ** 32) - 1,
  2 ** 52 - 1,
  2 ** 52,
  2 ** 52 + 1,
  -(2 ** 52) + 1,
  -(2 ** 52),
  -(2 ** 52) - 1,
  2 ** 53 - 1,
  2 ** 53,
  -(2 ** 53),
  -(2 ** 53) + 1,
  Long.make(2 ** 53).plus(1),
  Long.make(-(2 ** 53)).minus(1),
  2 ** 64 - 2 ** 16,
  Long.make(2 ** 64).minus(1),
  2 ** 64,
  Long.make(2 ** 64).plus(1),
  2 ** 64 + 2 ** 16,
  -(2 ** 64) + (2 ** 16),
  Long.make(-(2 ** 64)).plus(1),
  -(2 ** 64),
  Long.make(-(2 ** 64)).minus(1),
  -(2 ** 64) - (2 ** 16),
  Long.make(2 ** 256).minus(2 ** 16),
  Long.make(2 ** 256).minus(1),
  Long.make(2 ** 256),
  Long.make(2 ** 256).plus(1),
  Long.make(2 ** 256).plus(2 ** 16),
  Long.make(-(2 ** 256)).plus(2 ** 16),
  Long.make(-(2 ** 256)).plus(1),
  Long.make(-(2 ** 256)),
  Long.make(-(2 ** 256)).minus(1),
  Long.make(-(2 ** 256)).minus(2 ** 16),
];

describe('Long.of', function() {
  it('should return exactly what it is given', function() {
    const x = Long.of(1, 2, 3);
    expect(x).to.be.a('Uint32Array');
    expect(x.length).to.equal(3);
    expect(x[0]).to.equal(1);
    expect(x[1]).to.equal(2);
    expect(x[2]).to.equal(3);
    expect(x[3]).to.be.undefined;
  });
  it('should be comparable with deep equals', function() {
    expect(Long.of(1, 2, 3)).to.deep.equal(Long.of(1, 2, 3))
        .but.not.to.deep.equal(Long.of(1, 2))
        .and.not.to.deep.equal(Long.of(3, 2, 1));
  });
});

describe('Long.make', function() {
  it('should handle 0', function() {
    expect(Long.make(0)).to.deep.equal(Long.of(0));
  });
   
  it('should handle 1', function() {
    expect(Long.make(1)).to.deep.equal(Long.of(1));
  });
  it('should handle -1', function() {
    expect(Long.make(-1)).to.deep.equal(Long.of(0xffffffff));
  });
  it('should handle -2', function() {
    expect(Long.make(-2)).to.deep.equal(Long.of(0xfffffffe));
  });
  it('should handle -256', function() {
    expect(Long.make(-256)).to.deep.equal(Long.of(0xffffff00));
  });
  it('should handle 2^31 - 1', function() {
    expect(Long.make(2 ** 31 - 1)).to.deep.equal(Long.of(0x7fffffff));
  });
  it('should handle 2^31', function() {
    // Needs the extra term for the sign bit.
    expect(Long.make(2 ** 31)).to.deep.equal(Long.of(0x80000000, 0));
  });
  it('should handle -2^31', function() {
    expect(Long.make(-(2 ** 31))).to.deep.equal(Long.of(0x80000000));
  });
  it('should handle -2^31 + 1', function() {
    expect(Long.make(-(2 ** 31) + 1)).to.deep.equal(Long.of(0x80000001));
  });
  it('should handle -2^31 - 1', function() {
    expect(Long.make(-(2 ** 31) - 1)).to.deep.equal(Long.of(0x7fffffff, -1));
  });
  it('should handle 2^32 - 1', function() {
    expect(Long.make(2 ** 32 - 1)).to.deep.equal(Long.of(-1, 0));
  });
  it('should handle 2^32', function() {
    expect(Long.make(2 ** 32)).to.deep.equal(Long.of(0, 1));
  });
  it('should handle -2^32', function() {
    expect(Long.make(-(2 ** 32))).to.deep.equal(Long.of(0, -1));
  });
  it('should handle -2^32 - 1', function() {
    expect(Long.make(-(2 ** 32) - 1)).to.deep.equal(Long.of(-1, 0xfffffffe));
  });
  it('should handle -2^32 + 1', function() {
    expect(Long.make(-(2 ** 32) + 1)).to.deep.equal(Long.of(1, -1));
  });
  it('should handle 2^53 - 1', function() {
    expect(Long.make(2 ** 53 - 1)).to.deep.equal(Long.of(-1, 0x1fffff));
  });
  it('should handle -2^52', function() {
    expect(Long.make(-(2 ** 52))).to.deep.equal(Long.of(0, 0xfff00000));
  });
  it('should handle -2^53 + 1', function() {
    expect(Long.make(-(2 ** 53) + 1)).to.deep.equal(Long.of(1, 0xffe00000));
  });
  it('should handle 2^63', function() {
    expect(Long.make(2 ** 63)).to.deep.equal(Long.of(0, 0x80000000, 0));
  });
  it('should handle -2^63', function() {
    expect(Long.make(-(2 ** 63))).to.deep.equal(Long.of(0, 0x80000000));
  });
  it('should handle 2^64 - 2^16', function() {
    expect(Long.make(2 ** 64 - 2 ** 16))
        .to.deep.equal(Long.of(0xffff0000, -1, 0));
  });
  it('should handle -2^64 + 2^16', function() {
    expect(Long.make(-(2 ** 64) + 2 ** 16))
        .to.deep.equal(Long.of(0x00010000, 0, -1));
  });
  it('should handle 2^64', function() {
    expect(Long.make(2 ** 64)).to.deep.equal(Long.of(0, 0, 1));
  });
  it('should handle -2^64', function() {
    expect(Long.make(-(2 ** 64))).to.deep.equal(Long.of(0, 0, -1));
  });
  it('should handle 2^256', function() {
    expect(Long.make(2 ** 256))
        .to.deep.equal(Long.of(0, 0, 0, 0, 0, 0, 0, 0, 1));
  });
  it('should handle -2^256', function() {
    expect(Long.make(-(2 ** 256)))
        .to.deep.equal(Long.of(0, 0, 0, 0, 0, 0, 0, 0, -1));
  });
});

describe('Long.prototype.valueOf', function() {
  it('should be an inverse of Long.make for safe integers', function() {
    for (const n of NUMBERS) {
      if (typeof n == 'number') {
        expect(Long.make(n).valueOf()).to.equal(n);
      }
    }
  });
});

describe('Long.prototype.bitCount', function() {
  // In general, shifting left/right should transform the bitcount predictably,
  // except for 0 which is always 1.
  it('should handle 0', function() {
    expect(Long.of(0).bitCount()).to.equal(1);
  });
  it('should handle -1', function() {
    expect(Long.of(0xffffffff).bitCount()).to.equal(1);
  });
  it('should handle 1', function() {
    expect(Long.of(1).bitCount()).to.equal(2);
  });
  it('should handle -2', function() {
    expect(Long.of(0xfffffffe).bitCount()).to.equal(2);
  });
  it('should handle 2^16 - 1', function() {
    expect(Long.of(0xffff).bitCount()).to.equal(17);
  });
  it('should handle 2^16', function() {
    expect(Long.of(0x10000).bitCount()).to.equal(18);
  });
  it('should handle -2^16', function() {
    expect(Long.of(0xffff0000).bitCount()).to.equal(17);
  });
  it('should handle -2^16 - 1', function() {
    expect(Long.of(0xfffeffff).bitCount()).to.equal(18);
  });
  it('should handle 2^31 - 1', function() {
    expect(Long.of(0x7fffffff).bitCount()).to.equal(32);
  });
  it('should handle 2^31', function() {
    expect(Long.of(0x80000000, 0).bitCount()).to.equal(33);
  });
  it('should handle -2^31', function() {
    expect(Long.of(0x80000000).bitCount()).to.equal(32);
  });
  it('should handle -2^31 - 1', function() {
    expect(Long.of(0x7fffffff, 0xffffffff).bitCount()).to.equal(33);
  });
});


describe('Long.prototype.trim', function() {
  it('should return exactly the same when no trimming needed', function() {
    function expectSame(x) {
      expect(x.trim()).to.equal(x);
    }
    expectSame(Long.of(0, 0x12345678));
    expectSame(Long.of(0, 0x87654321));
    expectSame(Long.of(0, 0x12345678, -1));
    expectSame(Long.of(0, 0x12345678, 1));
    expectSame(Long.of(0, 0x12345678, 0, 1));
  });
  it('should return a number for safe integers', function() {
    for (const num of NUMBERS) {
      if (Number.isSafeInteger(num)) {
        expect(Long.make(num).trim()).to.equal(num);
      }
    }
  });
  it('should return a Long for non-safe integers', function() {
    for (const num of NUMBERS) {
      if (!Number.isSafeInteger(num)) {
        const l = Long.make(num);
        expect(l.trim()).to.equal(l);
      }
    }
  });
  // it('should return a number for int52s', function() {
  //   expect(Long.of(0, 0x
  // });
  it('should remove extra zero words', function() {
    const l = Long.of(1, 2, 3, 0).trim();
    expect(l).to.deep.equal(Long.of(1, 2, 3));
    expect(l.constructor).to.equal(Long);
  });
  it('should remove extra -1 words', function() {
    const l = Long.of(0, 0, -5, -1).trim();
    expect(l).to.deep.equal(Long.of(0, 0, -5));
    expect(l.constructor).to.equal(Long);
  });
  it('should retain zero words when needed', function() {
    expect(Long.of(1, -2, 0).trim()).to.deep.equal(Long.of(1, -2, 0));
  });
  it('should retain -1 words when needed', function() {
    expect(Long.of(0, 5, -1).trim()).to.deep.equal(Long.of(0, 5, -1));
  });
});


describe('Long.prototype.shiftLeft', function() {
  it('should handle 0-bit shifts', function() {
    expect(Long.of(1, 2, 3).shiftLeft(0)).to.deep.equal(Long.of(1, 2, 3));
  });
  it('should handle multiples of 32', function() {
    expect(Long.of(1, 2).shiftLeft(96)).to.deep.equal(Long.of(0, 0, 0, 1, 2));
  });
  it('should shift within the same word', function() {
    expect(Long.of(1, 2, 3).shiftLeft(1)).to.deep.equal(Long.of(2, 4, 6));
  });
  it('should shift into the next word', function() {
    expect(Long.of(0x80000000, 1).shiftLeft(1)).to.deep.equal(Long.of(0, 3));
  });
  it('should add words as necessary', function() {
    expect(Long.of(0x40000000).shiftLeft(2)).to.deep.equal(Long.of(0, 1));
  });
  it('should add words as necessary for negatives', function() {
    expect(Long.of(0x80000000).shiftLeft(1)).to.deep.equal(Long.of(0, -1));
  });
  it('should not add unnecessary extra words', function() {
    expect(Long.of(0x20000000).shiftLeft(1)).to.deep.equal(Long.of(0x40000000));
  });
  it('should not flip the sign bit to negative', function() {
    expect(Long.of(0x40000000).shiftLeft(1))
        .to.deep.equal(Long.of(0x80000000, 0));
  });
  it('should not flip the sign bit to positive', function() {
    expect(Long.of(0x80000000).shiftLeft(1))
        .to.deep.equal(Long.of(0, 0xffffffff));
  });
  it('should handle offset shifts across words', function() {
    expect(Long.of(0x12345678).shiftLeft(40))
        .to.deep.equal(Long.of(0, 0x34567800, 0x12));
  });
  it('should handle offset shifts across words for negatives', function() {
    expect(Long.of(0x87654321).shiftLeft(40))
        .to.deep.equal(Long.of(0, 0x65432100, 0xffffff87));
  });
});


describe('Long.prototype.shiftRight', function() {
  it('should handle 0-bit shifts', function() {
    expect(Long.of(1, 2, 3).shiftRight(0)).to.deep.equal(Long.of(1, 2, 3));
  });
  it('should handle multiples of 32', function() {
    expect(Long.of(0, 0, 0, 1, 2).shiftRight(96)).to.deep.equal(Long.of(1, 2));
  });
  it('should extend the sign bit for small shifts', function() {
    expect(Long.of(0x87654321).shiftRight(8))
        .to.deep.equal(Long.of(0xff876543));
  });
  it('should extend the sign bit for large shifts', function() {
    expect(Long.of(-1).shiftRight(100)).to.deep.equal(Long.of(-1));
  });
  it('should truncate positive numbers to zero', function() {
    expect(Long.of(0x12345678).shiftRight(32)).to.deep.equal(Long.of(0));
  });
  it('should truncate negative numbers to zero', function() {
    expect(Long.of(0x87654321).shiftRight(32)).to.deep.equal(Long.of(-1));
  });
  it('should shift within the same word', function() {
    expect(Long.of(2, 4, 6).shiftRight(1)).to.deep.equal(Long.of(1, 2, 3));
  });
  it('should shift into the previous word', function() {
    expect(Long.of(0, 3).shiftRight(1)).to.deep.equal(Long.of(0x80000000, 1));
  });
  it('should remove unnecessary words', function() {
    expect(Long.of(0, 1).shiftRight(2)).to.deep.equal(Long.of(0x40000000));
  });
  it('should remove unnecessary words for negatives', function() {
    expect(Long.of(0, -1).shiftRight(1)).to.deep.equal(Long.of(0x80000000));
  });
  it('should not flip the sign bit to negative', function() {
    expect(Long.of(0x80000000, 0).shiftRight(1))
        .to.deep.equal(Long.of(0x40000000));
  });
  it('should not flip the sign bit to positive', function() {
    expect(Long.of(0, -1).shiftRight(1)).to.deep.equal(Long.of(0x80000000));
  });
  it('should handle offset shifts across words', function() {
    expect(Long.of(0, 0x34567800, 0x12).shiftRight(40))
        .to.deep.equal(Long.of(0x12345678));
  });
  it('should handle offset shifts across words for negatives', function() {
    expect(Long.of(0, 0x65432100, 0xffffff87).shiftRight(40))
        .to.deep.equal(Long.of(0x87654321));
  });
});
