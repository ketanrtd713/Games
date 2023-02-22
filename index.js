import express from 'express'
import http from 'http'
import crypto from "crypto"
import { Server } from 'socket.io'
import cors from 'cors'
const app = express();
const server = http.createServer(app);

const clientOrigin = "http://localhost:5173";
const selections = {
  1 : "rock",
  2 : "paper",
  3 : "scissors" 
 }


// Socket.io
const io = new Server(server, 
  {
    cors: {
      origin: clientOrigin ,
      methods: ["GET", "POST"],
    }
  });

// Middleware
app.use(cors())
app.use(express.json())

const rooms = {} // key is room id
const users = {}

// Game Utility

// Simple Route For Testing
app.get('/', (req, res) => {
  res.send('<h1> Welcome to stone paper scissors game</h1>');
});

app.post("/signup", (req, res)=>{
    console.log(req.body);

    // userId == generate incrementing userId in mysql
    // insert data into table with this email if email is not already present in any account
    // store password as hashed value
    // if successfull then return 200 status else not
})

app.post("/signin", (req, res)=>{
  console.log(req.body);

  // 
})

// Room Information For Default Namespace
io.of("/").adapter.on("create-room", (room) => {
  console.log(`room ${room} was created`);
});


io.of("/").adapter.on("join-room", (room, id) => {
  console.log(`socket ${id} has joined room ${room}`);
});


io.on('connection', (socket) => {
  console.log('a user connected with socket id ' + socket.id);

  socket.emit("socketId", socket.id)

  socket.on("creategame", (message)=>{

    

    console.log(message.username)

    socket.username = message.username

    users[socket.id] = {
      username: message.username
    }
    const usersIds = Object.keys(users);
    console.log(usersIds)

    const roomId = crypto.randomBytes(8).toString('hex'); // currently there is problem, we are relying on client side for storing the roomId
    
    socket.emit("getRoomId", {
      roomId: roomId
    })

  })

  socket.on("joinRoom", (message)=>{// console.log(message.roomId)
    socket.roomId = message.roomId
    socket.userName = message.userName

    socket.join(message.roomId)
    
    // io.to(message.roomId).emit("userjoined","A user joined in our room"); // change it to joined event

    const sizeOfRoom = io.sockets.adapter.rooms.get(message.roomId).size
    console.log("Now the total size of room is " + sizeOfRoom)

    let roomObj = io.sockets.adapter.rooms.get(socket.roomId);
    roomObj.arr = []

    if(sizeOfRoom == 1){
      roomObj.users = [{socketId: socket.id, userName: socket.userName}]
      rooms[socket.roomId] = {} // rooms of sockets // object of object
      rooms[socket.roomId][socket.id] = {...rooms[socket.roomId][socket.id] ,
        userName: socket.userName
      }
    }

    if(sizeOfRoom == 2){
      io.to(message.roomId).emit("gameStarted") // tell them to start the game
      // Tell each others username to each 
      roomObj.users = [...roomObj.users, {socketId: socket.id, userName: socket.userName}]

      roomObj.users.forEach(element => {
        console.log(element)
        rooms[socket.roomId][element.socketId] = {...rooms[socket.roomId][element.socketId] ,
          userName: element.userName
        }
      });
      
      console.log(JSON.stringify(rooms))

      const currentUser = roomObj.users[1]
      const firstUser = roomObj.users[0]

      io.to(firstUser.socketId).emit("opponentUserName","just") // TODO - Set the usernames of each opponent and add animation in start showing the username and profile of opponent
      io.to(currentUser.socketId).emit("opponentUserName",firstUser.userName)

      // TODO store data in game_session_info table
      // what are the required information first of all need a usertable
    }

  })

  socket.on("choose", (choosen)=>{
    console.log("choosen value is "+ JSON.stringify(choosen));
    let roomObj = io.sockets.adapter.rooms.get(socket.roomId);

    if(rooms[socket.roomId][socket.id]["history"]){
      rooms[socket.roomId][socket.id]["history"].push(choosen.userSelected)
    } else {
      rooms[socket.roomId][socket.id]["history"] = [choosen.userSelected]
    }
    console.log(JSON.stringify(rooms))

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
      const currentUserSelection = secondUser.choosen
      const otherUserSelection = firstUser.choosen

      if(firstUser.choosen == secondUser.choosen){
        console.log("draw");
        io.to(firstUser.socketId).emit("result", {message: "Draw", otherUserSelection , currentUserSelection})
        io.to(secondUser.socketId).emit("result", {message: "Draw", otherUserSelection, currentUserSelection})
      } else if(firstUser.choosen == 1 && secondUser.choosen == 3 || firstUser.choosen == 2 && secondUser.choosen == 1 ||  firstUser.choosen == 3 && secondUser.choosen == 2 ){ // chancing of winning of computer
        console.log("first user wins both selected first user "+selections[firstUser.choosen]+" and second "+ selections[secondUser.choosen])
        io.to(firstUser.socketId).emit("result", { message: "Win. you and your opponent selected "+ selections[firstUser.choosen] + " and "+ selections[secondUser.choosen] + " respectively",  otherUserSelection , currentUserSelection})
        io.to(secondUser.socketId).emit("result", { message: "Loose. you and your opponent selected "+ selections[secondUser.choosen] + " and "+ selections[firstUser.choosen]+ " respectively",  otherUserSelection , currentUserSelection})
      } else {
        console.log("second user wins both selected first user : "+firstUser.choosen+" and me "+ secondUser.choosen)
        io.to(firstUser.socketId).emit("result", { message: "Loose. you and your opponent selected "+ selections[firstUser.choosen]  + " and "+ selections[secondUser.choosen]+ " respectively",  otherUserSelection , currentUserSelection})
        io.to(secondUser.socketId).emit("result", {message: "Win. you and your opponent selected "+ selections[secondUser.choosen] + " and "+ selections[firstUser.choosen] + " respectively",  otherUserSelection , currentUserSelection})
      }
      
      roomObj.arr = []
      console.log(rooms[socket.roomId][socket.id]["history"].length )
      if(rooms[socket.roomId][socket.id]["history"].length == 10){
        console.log("size is 10")
        // socket.emit("finalOutput", rooms[socket.roomId]) // give all the information that is stored for given roomID
        io.to(socket.roomId).emit("finalOutput", rooms[socket.roomId])
      }
    }
  })

  socket.on("disconnecting", ()=>{
    console.log("socket room size is " + socket.rooms.size )
    // const sizeOfRoom = io.sockets.adapter.rooms.get(socket.roomId).size
    // console.log("size of current room is "+ sizeOfRoom)
  
    io.to(socket.roomId).emit("stopGame", {
      message: "an opponent disconnected"
    })
  })

  socket.on('disconnect', () => {
    console.log('user disconnected with socket id '+ socket.id);

    console.log(io.sockets.eventNames())  
  
    delete users[socket.id]
  });

});
server.listen(3000, () => {
  console.log('listening on *:3000');
});


// Now the question is 

// How to handle user auth and how to actually play the game

class Player{
  constructor(userId, userName, socketId){
    this.userId = userId;
    this.userName = userName;
    this.socketId = socketId;
  }
}
