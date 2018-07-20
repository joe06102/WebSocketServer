const crypto = require('crypto')
const EventEmitter = require('events').EventEmitter
const Frame = require('./Frame')

const OPCODE = {
    CONTINUE_FRAME: 0x0,
    TEXT_TYPE: 0x1,
    BINARY_TYPE: 0x2,
    CONNECTION_CLOSE: 0x8,
    PING_TYPE: 0x9,
    PONG_TYPE: 0xa,
}

const events = {
    OPEN: 'open',
    CLOSE: 'close',
    MESSAGE: 'message',
}
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

class WebSocket extends EventEmitter {

    /**
     * 
     * @param {Socket} socket 
     */
    constructor(socket) {
        if(!socket) {
            throw new Error(`socket must not be null`)
        }
        super()
        this._socket = socket
        this._buffers = []
        this.messageHandler = this.messageHandler.bind(this)
        this.closeHandler = this.closeHandler.bind(this)
        this._socket.on('data', this.messageHandler)
    }

    messageHandler(buffer) {
        let frame = new Frame(buffer)
        if(frame.fin) {
            copy(frame.payloads, this._buffers)
            this.emit(events.MESSAGE, Buffer.from(this._buffers), frame.opcode)
            this._buffers = []
            frame = null
            const usage = process.memoryUsage()
            console.log(`rss: ${usage.rss / (1 << 20)}mb \r\nheapTotal: ${usage.heapTotal / (1 << 20)}mb \r\nheapUsed: ${usage.heapUsed / (1 << 20)}mb \r\nexternal: ${usage.external / (1 << 20)}mb`)
        } else {
            copy(frame.payloads, this._buffers)
        }
    }

    closeHandler() {
        this.emit(events.CLOSE)
    }

    acceptUpgrade(secKey) {
        const sha1Hash = crypto.createHash('sha1')
        const compositeHash = sha1Hash.update(secKey + GUID).digest('hex')
        const secAccept = Buffer.from(compositeHash, 'hex').toString('base64')
        const headers = [
            'HTTP/1.1 101 Web Socket Protocol Handshake',
            'upgrade: websocket',
            'connection: upgrade',
            'sec-websocket-accept: ' + secAccept,
            '\r\n'
        ]

        this._socket.write(headers.join('\r\n'))
    }
}

/**
 * 
 * @param {any[]} src 
 * @param {any[]} dest 
 * @param {number} srcOffset 
 */
function copy(src, dest, srcOffset) {
    const len = src.length
    let cursor = srcOffset || 0
    while(cursor < len) {
        dest.push(src[cursor])
        cursor++
    }
}

module.exports = {
    OPCODE,
    WebSocket,
}