const path = require('path')
const http = require('http')
const express = require('express')
const app = express()
const server = http.createServer(app)
const socketio = require('socket.io')
const io = socketio(server)
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))



io.on('connection', (socket)=> {
    console.log('new websocket connection')

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({ id: socket.id, username , room})

        if(error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('messageReceived',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('messageReceived', generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room:user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
        //io.to.emit (emit an event in a a room)
        //socket.broadcast.to.emit (emit to everyone except urself in the chat room)
    })

    socket.on('message', (messageReceived, callback) => {
        const filter = new Filter()
        if(filter.isProfane(messageReceived)) {
            return callback('Profanity is not allowed')
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('messageReceived',generateMessage(user.username,messageReceived))
        callback()
    })

    socket.on('disconnect', (username)=> {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('messageReceived', generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room:user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('location', generateLocationMessage(user.username,'https://google.com/maps?q='+position.latitude+","+position.longitude))
        callback()
    })
})









server.listen(port, () => {
    console.log('server start on port' + port)
})
