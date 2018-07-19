class BitBuffer {
    constructor(buffers) {
        this.buffers = buffers
    }

    getBit(index) {
        const byteIndex = index / 8 >> 0 // num >> 0 === Math.floor(num)
        const bitOffset = index % 8
        const ltrBitOffset = 7 - bitOffset // count offset from left to right
        const shiftedNum = this.buffers.readUInt8(byteIndex) & (1 << ltrBitOffset)
        return shiftedNum >> ltrBitOffset
    }

    getBits(start, end) {
        let bits = 0
        for(let i = start; i <= end; i++) {
            bits += this.getBit(i) << (end - i)
        }
        return bits
    }
}

module.exports = BitBuffer