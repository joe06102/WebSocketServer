class Frame {

    /**
     * 
     * @param {Buffer} buffer 
     */
    constructor(buffer) {
        this.fin = 0
        this.opcode = 0
        this.payloadLen = 0
        this.isMask = 0
        this.maskKeys = []
        this.payloads = null

        if(buffer) {
            this.parse(buffer)            
        }
    }

    /**
     * 
     * @param {Buffer} buffer 
     */
    parse(buffer) {
        if(!buffer || buffer.length === 0) {
            throw new Error(`parse frame failed: buffer invalid`)
        }
        this.fin = (buffer[0] & 0x80) === 0x80
        this.opcode = buffer[0] & 0xf
        this.isMask = (buffer[1] & 0x80) === 0x80
        this.payloadLen = this.getPayloadLen(buffer)
        this.maskKeys = this.getMaskKeys(buffer)
        this.payloads = this.getPayloads(buffer)
    }

    /**
     * 
     * @param {Buffer} buffer 
     * @returns {Number}
     */
    getPayloadLen(buffer) {
        const primLen = buffer[1] & 0x7f
        switch(primLen) {
            case 126:
                return buffer.readUInt16BE(2)
            case 127:
                return this.getPayloadLen64(buffer)
            default:
                return primLen
        }
    }

    /**
     * 
     * @param {Buffer} buffer 
     * @returns {Number}
     */
    getPayloadLen64(buffer) {
        const num = buffer.readUInt32BE(4)
        if(num > (Math.pow(2, 53 - 32) - 1)) {
            throw new Error(`get payload length failed: js only supports 2^53 - 1 number`)
        }

        return buffer.readUInt32BE(0) + buffer.readUInt32BE(4)
    }

    /**
     * 
     * @param {Buffer} buffer 
     * @returns {Number[]}
     */
    getMaskKeys(buffer) {
        const maskKeys = []
        let offset = 2

        if(this.isMask) {
            switch(this.payloadLen) {
                case 126:
                    offset = 4
                    break
                case 127:
                    offset = 10
                    break
                default: 
                    offset = 2
                    break
            }

            for(let i = offset; i < offset + 4; i++) {
                maskKeys.push(buffer.readUInt8(i))
            }
        }
        
        return maskKeys        
    }

    /**
     * 
     * @param {Buffer} buffer 
     * @return {Buffer}
     */
    getPayloads(buffer) {
        let offset = 0
        if(this.isMask) {
            switch(this.payloadLen) {
                case 126:
                    offset = 8
                    break
                case 127:
                    offset = 14
                    break
                default:
                    offset = 6
                    break
            }
        } else {
            switch(this.payloadLen) {
                case 126:
                    offset = 4
                    break
                case 127:
                    offset = 10
                    break
                default:
                    offset = 2
                    break
            }
        }

        return this.unmaskPayloads(buffer.slice(offset, offset + this.payloadLen))
    }

    /**
     * 
     * @param {Buffer} payloadBuffer 
     * @returns {number[]}
     */
    unmaskPayloads(payloadBuffer) {
        const len = payloadBuffer.length
        const payloads = []
        
        for(let i = 0; i < len; i++) {
            payloads.push(payloadBuffer[i] ^ this.maskKeys[i % 4])
        }

        return payloads
    }
}

module.exports = Frame