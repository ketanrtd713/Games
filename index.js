import express from 'express'

const app = express();
import http from 'http'
import crypto from "crypto"
import { Server } from 'socket.io'
const server = http.createServer(app);
const io = new Server(server, 
  {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    }
  });

const corsOptions = {
    origin: 'https://yourdomain.com',
}

import cors from 'cors'
import { message } from 'antd';

app.use(cors())

const rooms = []
const users = {}
const Play = [] // array of different combinations playing with each other

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});


// Room Information
io.of("/").adapter.on("create-room", (room) => {
  console.log(`room ${room} was created`);
});


io.of("/").adapter.on("join-room", (room, id) => {
  console.log(`socket ${id} has joined room ${room}`);
});

io.of("/").adapter.on("", (room, id) => {
  console.log(`socket ${id} has joined room ${room}`);
});

io.on('connection', (socket) => {
  console.log('a user connected with socket id ' + socket.id);

  socket.emit("entrance", {
    message: "Welcome to the rock paper scissors"
  })


  socket.on("creategame", (message)=>{
    console.log(message.username)

    users[socket.id] = {
      username: message.username
    }
    const usersIds = Object.keys(users);
    console.log(usersIds)


    const roomId = crypto.randomBytes(8).toString('hex'); // currently there is problem, we are relying on client side for storing the roomId

    // const room = socket.join(roomId) 
    // io.to(roomId).emit("userjoined","A user joined in our room"); // let only join from the join button given
    // room.push(roomId) 

    socket.emit("getRoomId", {
      roomId: roomId
    })

  })

  socket.on("joinRoom", (message)=>{
    // console.log(message.roomId)
    socket.roomId = message.roomId
    console.log(socket.roomId);

    socket.join(message.roomId)
    io.to(message.roomId).emit("userjoined","A user joined in our room"); // change it to joined event

    const sizeOfRoom = io.sockets.adapter.rooms.get(message.roomId).size
    console.log("Now the total size of room is " + sizeOfRoom)

    let roomObj = io.sockets.adapter.rooms.get(socket.roomId);
    roomObj.arr = []

    if(sizeOfRoom == 2){
      io.to(message.roomId).emit("gameStarted") // tell them to start the game
    }

  })

  socket.on("choose", (choosen)=>{
    console.log("choosen value is "+ JSON.stringify(choosen));
    let roomObj = io.sockets.adapter.rooms.get(socket.roomId);

    roomObj.arr = [...roomObj.arr, { 
      socketId: socket.id,
      choosen: choosen.userSelected}]

    console.log(roomObj.arr)

    let bothChoosedValues = roomObj.arr

    if(bothChoosedValues.length == 2){
      // now calculate the anwer and return to both parties 
      // here we are assuming that they are choosing one by one

      const firstUser = bothChoosedValues[0]
      const secondUser = bothChoosedValues[1]

      // let the first user wins
      //  do one broadcast to other and and one to the self 

      // Logic of game
      if(firstUser.choosen == secondUser.choosen){
        console.log("draw");
      } else if(firstUser.choosen == 1 && secondUser.choosen == 3 || firstUser.choosen == 2 && secondUser.choosen == 1 ||  firstUser.choosen == 3 && secondUser.choosen == 2 ){ // chancing of winning of computer
        console.log("first user wins both selected first user "+firstUser.choosen+" and second "+ secondUser.choosen)
      } else {
        console.log("second user wins both selected first user : "+firstUser.choosen+" and me "+ secondUser.choosen)
      }

      io.to(firstUser.socketId).emit("result", "you loose")
      io.to(secondUser.socketId).emit("result", "you win")
     

      roomObj.arr = []
    }
  })

  // socket.on("disconnecting", ()=>{
  //   console.log("room id is " + socket.rooms.size )
  // })

  socket.on('disconnect', () => {
    console.log('user disconnected with socket id '+ socket.id);
    delete users[socket.id]
  });

});
server.listen(3000, () => {
  console.log('listening on *:3000');
});


// Now the question is 

// How to handle user auth and how to actually play the game