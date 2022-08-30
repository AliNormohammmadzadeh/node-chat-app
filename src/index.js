const express = require('express')
const path = require("path")
const http = require('http')
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage , generateLocation } = require('./utils/messages')
const { addUser,removeUser,getUser,getUserInRoom } = require('./utils/users') 

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')

app.use(express.static(publicDirectory))

let count = 0

io.on("connection", (socket)=>{
    console.log("new Websocket connction")

    socket.on('join',(options, callback)=>{ // username ==> option 
        const {error , user} = addUser({id : socket.id , ...options}) // , username , room ==> options
        if(error){
            return callback(error)
        }

        socket.join(user.room)


        socket.emit('message',generateMessage("Admin","Wellcome!"))
        socket.broadcast.to(user.room).emit('message',generateMessage("Admin" , `${user.username} has joined !`))
        io.to(user.room).emit('roomData',{
            room : user.room,
            users : getUserInRoom(user.room)
        })

        callback()

        // socket.emit , io.emit , socket.broadcast.emit
        // io.to.emit just for a room , socket.braodcast.to.emit 
    })

    socket.on('sendMessage', (msg,callback)=>{
        const user = getUser(socket.id)

        const filter = new Filter()

        // if(msg === ''){
        //     return callback()
        // }
        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed ')
        }
        io.to(user.room).emit('message',generateMessage(user.username , msg))
        callback()
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('LocationMessage',generateLocation(user.username , `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))  
        callback()
    })
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        
        if(user){
            io.to(user.room).emit("message",generateMessage("Admin" , `${user.username} has left !`))
            io.to(user.room).emit("roomData",{
                room : user.room,
                users : getUserInRoom(user.room)
            })
        }
    })
})


// io.on("connection", (socket)=>{
//     console.log("new Websocket connction")

//     socket.emit('countUpdated', count)

//     socket.on('increment',()=>{
//         count++
//         // socket.emit('countUpdated',count)
//         io.emit('countUpdated',count)
//     })
// })



server.listen(port , (req,res)=>{
    console.log(`SERVER is up on port ${port} !!`)
})