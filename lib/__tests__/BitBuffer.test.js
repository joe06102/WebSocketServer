const BitBuffer = require('../BitBuffer')

const buffer = Buffer.from([0x81, 0x85, 0x1a, 0x89, 0xcf, 0x2a, 0x72, 0xec, 0xa3, 0x46, 0x75])
console.log(buffer)
console.log(buffer)

const bitBuffer = new BitBuffer(buffer)
console.log(`fin: ${bitBuffer.getBit(0)}`)
console.log(`opcode: ${bitBuffer.getBits(4, 7)}`)
console.log(`mask: ${bitBuffer.getBit(8)}`)
console.log(`prime len: ${bitBuffer.getBits(9, 15)}`)
console.log(`masking key: ${bitBuffer.getBits(16, 47)}`)