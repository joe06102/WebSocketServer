const http = require('http')
const WebSocket = require('./lib/WebSocket').WebSocket
const OPCODE = require('./lib/WebSocket').OPCODE
const BitBuffer = require('./lib/BitBuffer')

const PORT = process.env.PORT || 5000
const server = http.createServer()

server.on('upgrade', (req, socket, head) => {
    //console.log(req.headers)
    const wsSocket = new WebSocket(socket)
    console.log(req.headers['sec-websocket-key'])

    wsSocket.acceptUpgrade(req.headers['sec-websocket-key'])
    wsSocket.on('message', (buffers, payloadType) => {
        if(payloadType === OPCODE.TEXT_TYPE) {
            console.log(buffers.toString('utf8'))
        } else {
            console.log(buffers)
        }
    })
    wsSocket.on('close', () => {
        console.log('socket closed')
    })
})

server.listen(PORT)
console.log(`server running on ${PORT}`)