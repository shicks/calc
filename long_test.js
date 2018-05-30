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
  Long.make(2 ** 53).add(1),
  Long.make(-(2 ** 53)).sub(1),
  2 ** 64 - 2 ** 16,
  Long.make(2 ** 64).sub(1),
  2 ** 64,
  Long.make(2 ** 64).add(1),
  2 ** 64 + 2 ** 16,
  -(2 ** 64) + (2 ** 16),
  Long.make(-(2 ** 64)).add(1),
  -(2 ** 64),
  Long.make(-(2 ** 64)).sub(1),
  -(2 ** 64) - (2 ** 16),
  Long.make(2 ** 256).sub(2 ** 16),
  Long.make(2 ** 256).sub(1),
  Long.make(2 ** 256),
  Long.make(2 ** 256).add(1),
  Long.make(2 ** 256).add(2 ** 16),
  Long.make(-(2 ** 256)).add(2 ** 16),
  Long.make(-(2 ** 256)).add(1),
  Long.make(-(2 ** 256)),
  Long.make(-(2 ** 256)).sub(1),
  Long.make(-(2 ** 256)).sub(2 ** 16),
];

/* TODO - use these in tests
// A smaller set of numbers that we can do deeper loops with.
const NUMBERS2 = [
  Long.parseLong('2gkjc74jknu4ir0927ygjknvslw2058gs8gcfhjdg489rkef0asdfs', 36);
  Long.parseLong('pisn48sk207klcsiu7854iuhenasfsbz5j', 36);
  Long.parseLong('skjdf38sks', 36);
  Long.parseLong('-h09u589rjdsklj9048eowklsak304u9woqp6hga0983urig6hes2af', 36);
  Long.parseLong('-yl8ka3sunxksnocinp1a57902kayos5s21', 36);
  Long.parseLong('-773kpqlskzw84qc7esx', 36);
  Long.parseLong('-a93845uihf', 36);
];
*/

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


describe('Long.prototype.shl', function() {
  it('should handle 0-bit shifts', function() {
    expect(Long.of(1, 2, 3).shl(0)).to.deep.equal(Long.of(1, 2, 3));
  });
  it('should handle multiples of 32', function() {
    expect(Long.of(1, 2).shl(96)).to.deep.equal(Long.of(0, 0, 0, 1, 2));
  });
  it('should shift within the same word', function() {
    expect(Long.of(1, 2, 3).shl(1)).to.deep.equal(Long.of(2, 4, 6));
  });
  it('should shift into the next word', function() {
    expect(Long.of(0x80000000, 1).shl(1)).to.deep.equal(Long.of(0, 3));
  });
  it('should add words as necessary', function() {
    expect(Long.of(0x40000000).shl(2)).to.deep.equal(Long.of(0, 1));
  });
  it('should add words as necessary for negatives', function() {
    expect(Long.of(0x80000000).shl(1)).to.deep.equal(Long.of(0, -1));
  });
  it('should not add unnecessary extra words', function() {
    expect(Long.of(0x20000000).shl(1)).to.deep.equal(Long.of(0x40000000));
  });
  it('should not flip the sign bit to negative', function() {
    expect(Long.of(0x40000000).shl(1))
        .to.deep.equal(Long.of(0x80000000, 0));
  });
  it('should not flip the sign bit to positive', function() {
    expect(Long.of(0x80000000).shl(1))
        .to.deep.equal(Long.of(0, 0xffffffff));
  });
  it('should handle offset shifts across words', function() {
    expect(Long.of(0x12345678).shl(40))
        .to.deep.equal(Long.of(0, 0x34567800, 0x12));
  });
  it('should handle offset shifts across words for negatives', function() {
    expect(Long.of(0x87654321).shl(40))
        .to.deep.equal(Long.of(0, 0x65432100, 0xffffff87));
  });
});


describe('Long.prototype.shr', function() {
  it('should handle 0-bit shifts', function() {
    expect(Long.of(1, 2, 3).shr(0)).to.deep.equal(Long.of(1, 2, 3));
  });
  it('should handle multiples of 32', function() {
    expect(Long.of(0, 0, 0, 1, 2).shr(96)).to.deep.equal(Long.of(1, 2));
  });
  it('should extend the sign bit for small shifts', function() {
    expect(Long.of(0x87654321).shr(8))
        .to.deep.equal(Long.of(0xff876543));
  });
  it('should extend the sign bit for large shifts', function() {
    expect(Long.of(-1).shr(100)).to.deep.equal(Long.of(-1));
  });
  it('should truncate positive numbers to zero', function() {
    expect(Long.of(0x12345678).shr(32)).to.deep.equal(Long.of(0));
  });
  it('should truncate negative numbers to zero', function() {
    expect(Long.of(0x87654321).shr(32)).to.deep.equal(Long.of(-1));
  });
  it('should shift within the same word', function() {
    expect(Long.of(2, 4, 6).shr(1)).to.deep.equal(Long.of(1, 2, 3));
  });
  it('should shift into the previous word', function() {
    expect(Long.of(0, 3).shr(1)).to.deep.equal(Long.of(0x80000000, 1));
  });
  it('should remove unnecessary words', function() {
    expect(Long.of(0, 1).shr(2)).to.deep.equal(Long.of(0x40000000));
  });
  it('should remove unnecessary words for negatives', function() {
    expect(Long.of(0, -1).shr(1)).to.deep.equal(Long.of(0x80000000));
  });
  it('should not flip the sign bit to negative', function() {
    expect(Long.of(0x80000000, 0).shr(1))
        .to.deep.equal(Long.of(0x40000000));
  });
  it('should not flip the sign bit to positive', function() {
    expect(Long.of(0, -1).shr(1)).to.deep.equal(Long.of(0x80000000));
  });
  it('should handle offset shifts across words', function() {
    expect(Long.of(0, 0x34567800, 0x12).shr(40))
        .to.deep.equal(Long.of(0x12345678));
  });
  it('should handle offset shifts across words for negatives', function() {
    expect(Long.of(0, 0x65432100, 0xffffff87).shr(40))
        .to.deep.equal(Long.of(0x87654321));
  });
});


describe('Long.prototype.cpl', function() {
  it('should complement all the words', function() {
    expect(Long.of(0x12344321, 0x56788765).cpl())
        .to.deep.equal(Long.of(0xedcbbcde, 0xa987789a));
  });
  it('should be self-inverting', function() {
    for (const n of NUMBERS) {
      const l = Long.make(n);
      expect(l.cpl().cpl()).to.deep.equal(l);
    }
  });
});


describe('Long.prototype.bitOr', function() {
  it('should return a number for small inputs', function() {
    expect(Long.of(1).bitOr(Long.of(2))).to.equal(3);
  });
  it('should return the other argument when or-ed with 0', function() {
    for (const n of NUMBERS) {
      const expected = Number.isSafeInteger(n) ? n : Long.make(n);
      expect(Long.make(n).bitOr(0)).to.deep.equal(expected);
      expect(Long.make(0).bitOr(n)).to.deep.equal(expected);
    }
  });
  it('should return -1 when or-ed with -1', function() {
    for (const n of NUMBERS) {
      expect(Long.make(n).bitOr(-1)).to.equal(-1);
      expect(Long.make(-1).bitOr(n)).to.equal(-1);
    }
  });
  it('should extend negative numbers', function() {
    expect(Long.of(3, 2, 1).bitOr(Long.of(0xffff0000)))
        .to.equal(-(2 ** 16) + 3);
  });
});


describe('Long.prototype.bitAnd', function() {
  it('should return a number for small inputs', function() {
    expect(Long.of(3).bitAnd(Long.of(6))).to.equal(2);
  });
  it('should return the other argument when and-ed with -1', function() {
    for (const n of NUMBERS) {
      const expected = Number.isSafeInteger(n) ? n : Long.make(n);
      expect(Long.make(n).bitAnd(-1)).to.deep.equal(expected);
      expect(Long.make(-1).bitAnd(n)).to.deep.equal(expected);
    }
  });
  it('should return 0 when and-ed with 0', function() {
    for (const n of NUMBERS) {
      expect(Long.make(n).bitAnd(0)).to.equal(0);
      expect(Long.make(0).bitAnd(n)).to.equal(0);
    }
  });
  it('should extend positive numbers', function() {
    expect(Long.of(3, 2, 1).bitAnd(Long.of(0x0000ffff))).to.equal(3);
  });
});


describe('Long.prototype.bitXor', function() {
  it('should return a number for small inputs', function() {
    expect(Long.of(3).bitXor(Long.of(6))).to.equal(5);
  });
  it('should return the complement when xor-ed with -1', function() {
    for (const n of NUMBERS) {
      const expected = Long.make(n).cpl().trim();
      expect(Long.make(n).bitXor(-1)).to.deep.equal(expected);
      expect(Long.make(-1).bitXor(n)).to.deep.equal(expected);
    }
  });
  it('should return the other argument when xor-ed with 0', function() {
    for (const n of NUMBERS) {
      const expected = Number.isSafeInteger(n) ? n : Long.make(n);
      expect(Long.make(n).bitXor(0)).to.deep.equal(expected);
      expect(Long.make(0).bitXor(n)).to.deep.equal(expected);
    }
  });
  it('should extend negative numbers', function() {
    expect(Long.of(3, 2, 1).bitXor(Long.of(0xffff0000)))
        .to.deep.equal(Long.of(0xffff0003, 0xfffffffd, 0xfffffffe));
  });
});


describe('Long.prototype.add', function() {
  it('should return the other argument when adding zero', function() {
    for (const n of NUMBERS) {
      const expected = Number.isSafeInteger(n) ? n : Long.make(n);
      expect(Long.make(n).add(0)).to.deep.equal(expected);
      expect(Long.make(0).add(n)).to.deep.equal(expected);
    }
  });
  it('should return its double when added to itself', function() {
    for (const n of NUMBERS) {
      const expected = Long.make(n).shl(1).trim();
      expect(Long.make(n).add(n)).to.deep.equal(expected);
    }
  });
  it('should carry correctly', function() {
    expect(Long.of(0x44556677, 0x246fffff).add(Long.of(0xbbaa9989, 0x1b900000)))
        .to.deep.equal(Long.of(0, 0x40000000));
  });
  it('should add padding when necessary', function() {
    expect(Long.of(0, 0x30000000).add(Long.of(0, 0x50000000)))
        .to.deep.equal(Long.of(0, 0x80000000, 0));
  });
  it('should remove unused words', function() {
    expect(Long.of(0, 0x10000000, 0, 0, 1).add(Long.of(0, 0, 0, 0, -1)))
        .to.deep.equal(Long.of(0, 0x10000000));
  });
  it('should be the inverse of sub', function() {
    this.slow(1000);
    for (const left of NUMBERS) {
      for (const right of NUMBERS) {
        const expected = Number.isSafeInteger(left) ? left : Long.make(left);
        expect(Long.make(Long.make(left).sub(right)).add(right))
            .to.deep.equal(expected);
      }
    }
  });
});


describe('Long.prototype.sub', function() {
  it('should return the other argument when subtracting zero', function() {
    for (const n of NUMBERS) {
      const expected = Number.isSafeInteger(n) ? n : Long.make(n);
      expect(Long.make(n).sub(0)).to.deep.equal(expected);
    }
  });
  it('should return the opposite when subtracting from zero', function() {
    for (const n of NUMBERS) {
      // Note: use `0 - n` to avoid negative-zero.
      const expected = Number.isSafeInteger(n) ? 0 - n : Long.make(n).neg();
      expect(Long.make(0).sub(n)).to.deep.equal(expected);
    }
  });
  it('should return zero when subtracting itself', function() {
    for (const n of NUMBERS) {
      expect(Long.make(n).sub(n)).to.deep.equal(0);
    }
  });
  it('should carry correctly', function() {
    expect(Long.of(0x2748acdf, 0x22345678).sub(Long.of(0x3728aced, 0x12345678)))
        .to.deep.equal(Long.of(0xf01ffff2, 0x0fffffff));
  });
  it('should remove unused words', function() {
    expect(Long.of(0, 0, 0, 0, 1).sub(Long.of(0, 0x10000000, 0, 0, 1)))
        .to.deep.equal(Long.of(0, 0xf0000000));
    expect(Long.of(0x2748acdf, 0x12345678).sub(Long.of(0x3728aced, 0x12345678)))
        .to.equal(0xf01ffff2 | 0);
  });
  it('should be the inverse of add', function() {
    this.slow(1000);
    for (const left of NUMBERS) {
      for (const right of NUMBERS) {
        const expected = Number.isSafeInteger(left) ? left : Long.make(left);
        expect(Long.make(Long.make(left).add(right)).sub(right))
            .to.deep.equal(expected);
      }
    }
  });
});


describe('Long.prototype.mul', function() {
  it('should return the other argument when multiplying one', function() {
    for (const n of NUMBERS) {
      const expected = Number.isSafeInteger(n) ? n : Long.make(n);
      expect(Long.make(n).mul(1)).to.deep.equal(expected);
      expect(Long.make(1).mul(n)).to.deep.equal(expected);
    }
  });
  it('should return zero when multiplying zero', function() {
    for (const n of NUMBERS) {
      expect(Long.make(n).mul(0)).to.equal(0);
      expect(Long.make(0).mul(n)).to.equal(0);
    }
  });
});
