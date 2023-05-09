const express = require('express')
const socketIO = require('socket.io')
const http = require('http')
const path = require('path')
const crypto = require('crypto')

const app = express()
const server = http.createServer(app)

const io = new socketIO.Server(server, {
maxHttpBufferSize: 1e8
})

const publicPath = path.resolve(__dirname, './static')
const port = process.env.PORT || require('./config.json').port || 3000
app.use(express.static(publicPath))

app.get('/css', (req, res) => { res.sendFile(`${__dirname}/style.css`) })


io.on('connection', client => {
    client.on("send", (id, file, name) => {
      client.in(id).emit("download", file, name)
      client.emit("download", file, name)
    })

    client.on("new_room", () => {
        const id = crypto.randomBytes(8).toString("hex")
        client.join(id)
        client.emit("room", id)
    })

    client.on("join_room", (id) => {
        if(!io.sockets.adapter.rooms.has(id)) io.sockets.adapter.rooms.set(id, new Set())
        client.join(id)
        client.emit("room", id)
    })
})

app.get('/room/:id', (req, res) => {
    if(!io.sockets.adapter.rooms.has(req.params.id)) io.sockets.adapter.rooms.set(req.params.id, new Set())
    res.sendFile(`${__dirname}/room.html`)
})

app.get('/rooms/create', (req, res) => {
const id = crypto.randomBytes(3).toString("hex")
io.sockets.adapter.rooms.set(id, new Set())
res.redirect(`/room/${id}`)
})

server.listen(port)