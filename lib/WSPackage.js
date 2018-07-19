const crypto = require('crypto')
const BitBuffer = require('./BitBuffer')

const CONTINUE_FRAME = 0x0
const TEXT_TYPE = 0x1
const BINARY_TYPE = 0x2
const CONNECTION_CLOSE = 0x8
const PING_TYPE = 0x9
const PONG_TYPE = 0xa

class WSPackage {
    constructor(buffers) {
        this.buffers = buffers
        this.bitBuffer = new BitBuffer(buffers)
        this.parse()
    }

    parse() {
        this._primLen = this.bitBuffer.getBits(9, 15)
        this.fin = this.bitBuffer.getBit(0)
        this.opcode = this.bitBuffer.getBits(4, 7)
        this.mask = this.bitBuffer.getBit(8)
        this.payloadLen = this.getPayloadLen()
        this.maskingKey = this.getMaskingKey()
        this.payload = this.getPayloadBuffers()
    }

    getPayloadLen() {
        if(this._primLen <= 125) {
            return this._primLen
        } else if(this._primLen === 126) {
            return this.bitBuffer.getBits(16, 31)
        } else if(this._primLen === 127) {
            return this.bitBuffer.getBits(16, 79)
        } else {
            throw new Error(`get payload length failed, unknown length: ${this._primLen}`)
        }
    }

    getMaskingKey() {
        if(this.mask) {
            if(this._primLen <= 125) {
                return this.bitBuffer.getBits(16, 16 + 32 - 1)
            } else if(this._primLen === 126) {
                return this.bitBuffer.getBits(32, 32 + 32 - 1)
            } else if(this._primLen === 127) {
                return this.bitBuffer.getBits(80, 80 + 32 -1)
            } else {
                throw new Error(`get masking key failed, unknown payload len: ${this._primLen}`)
            }
        } else {
            return 0
        }
    }

    getMaskingKeys() {
        const maskKeys = []
        const fillKeysFrom = startIndex => {
            for(let i = startIndex; i < startIndex + 32; i+=8) {
                maskKeys.push(this.bitBuffer.getBits(i, i + 7))
            }
        }

        if(this.mask) {
            if(this._primLen <= 125) {
                fillKeysFrom(16)
            } else if(this._primLen === 126) {
                fillKeysFrom(32)
            } else if(this._primLen === 127) {
                fillKeysFrom(80)
            } else {
                throw new Error(`get masking key failed, unknown payload len: ${this._primLen}`)
            }
        }
        
        return maskKeys
    }

    getPayloadBuffers() {
        let buffers

        if(this._primLen <= 125 && !this.mask) {
            buffers = this.buffers.slice(2, 2 + this.payloadLen)
        } else if(this._primLen <= 125 && this.mask) {
            buffers = this.buffers.slice(6, 6 + this.payloadLen)
        } else if(this._primLen === 126 && !this.mask) {
            buffers = this.buffers.slice(4, 4 + this.payloadLen)
        } else if(this._primLen === 126 && this.mask) {
            buffers = this.buffers.slice(8, 8 + this.payloadLen)
        } else if(this._primLen === 127 && !this.mask) {
            buffers = this.buffers.slice(10, 10 + this.payloadLen)            
        } else if(this._primLen === 127 && this.mask) {
            buffers = this.buffers.slice(14, 14 + this.payloadLen)
        } 

        return this.unmaskPayload(buffers)
    }

    unmaskPayload(payloadBuffer) {
        const maskKeys = this.getMaskingKeys()
        const payloads = []

        if(maskKeys.length === 4) {
            for(let i = 0; i < payloadBuffer.length; i++) {
                payloads.push(payloadBuffer[i] ^ maskKeys[i % 4])
            }
        } else {
            throw new Error(`unmask payload failed, mask keys must be 4 bytes`)
        }

        return payloads
    }
}

WSPackage.computeNounce = (secKey, guid) => {
    const sha1Hash = crypto.createHash('sha1')
    const compositeHash = sha1Hash.update(secKey + guid).digest('hex')
    return Buffer.from(compositeHash, 'hex').toString('base64')
}

module.exports = WSPackage