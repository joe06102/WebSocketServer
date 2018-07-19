const http = require('http')
const WSPackage = require('./lib/WSPackage')

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const PORT = process.env.PORT || 5000
const server = http.createServer()

server.on('upgrade', (req, socket, head) => {
    console.log(req.headers)

    const acceptCredential = WSPackage.computeNounce(req.headers['sec-websocket-key'], GUID)
    console.log(acceptCredential)

    socket.write(
        'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
        'upgrade: websocket\r\n' +
        'connection: upgrade\r\n' +
        'sec-websocket-accept: ' + acceptCredential + '\r\n' +
        '\r\n'
    )

    socket.on('data', buffers => {
        //console.log(buffers)
        const pack = new WSPackage(buffers)
        pack.parse()

        //console.log(pack)
        console.log(Buffer.from(pack.payload).toString('utf8'))
        
    })

    socket.on('close', () => {
        console.log('socket closed')
    })

    socket.on('error', err => {
        console.log(err)
    })
})

server.listen(PORT)
console.log(`server running on ${PORT}`)