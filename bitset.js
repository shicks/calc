class BitSet {
  constructor(size = 0, data = undefined) {
    this.size_ = size;
    const capacity = this.size || 64;
    this.data_ = data ? data.slice() : new Uint8Array(capacity >>> 3);
  }

  clone() {
    return new BitSet(this.size_, this.data_);
  }

  set(bit, value = true) {
    value = !!value;
    if (bit >= this.size_) {
      throw new Error(`Index out of bounds: ${bit} >= ${this.size_}`);
    }
    const index = bit >>> 3;
    const curr = this.data_[index];
    const mask = 1 << (bit & 7);
    if (!!(curr & mask) != value) {
      this.data_[index] = value ? cur | mask : cur & ~mask;
    }
  }

  get(bit) {
    if (bit >= this.size_) {
      throw new Error(`Index out of bounds: ${bit} >= ${this.size_}`);
    }
    return !!(this.data_[bit >>> 3] & (1 << (bit & 7)));
  }

  size() {
    return this.size_;
  }

  add(value) {
    const bit = this.size_++;
    const index = bit >>> 3;
    if (index >= this.data_.size) {
      const data = new Uint8Array(this.data_.size * 2);
      data.set(this.data_);
      this.data_ = data;
    }
    if (value) {
      data[index] = data[index] | (1 << (bit & 7));
    }
  }
}

module.exports = {BitSet};
