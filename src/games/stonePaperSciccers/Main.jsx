import React, { useState, useEffect } from 'react'
import Image from '../../assets/rock-paper-scissors.svg'
import {Button, Card, Col, message, Row, notification, Space,} from 'antd'
// import {CopyOutlined} from "antd/icons"
import paper from "./noun-paper-1423765.svg"
import rock from "./noun-rock-2018169.svg"
import scissors from "./noun-scissors-1043569.svg"
import Loading from '../../components/Loading'
import { useLocation } from 'react-router-dom'

const serverLocation = 'http://localhost:3000';

// for bidirectional connection with server, event based
import socketIO from 'socket.io-client';
const socket = socketIO.connect(serverLocation);



const Main = () => {

  const search = useLocation().search;

  const [finalOutput, setFinalOutput] = useState()
  const [socketId, setSocketId] = useState("")
  const [shareUrl, setShareUrl] = useState("")
  const [Timer, setTimer] = useState(30)
  const [opponentUserName, setOpponentUserName] = useState("opponentUser")
  const [resultText, setResultText] = useState("")
  const [userName, setUserName] = useState("")
  const [onlineGame, setOnlineGame] = useState(true)
  const [startGame, setStartGame] = useState(false)
  const [wait, setWait] = useState(true)
  const [roomId, setRoomId] = useState("")
  const [count, setCount] = useState(10);
  const [result, SetResult] = useState("neutral")
  const [userSelected, setUserSelected] = useState(1)
  const [computerSelected, setComputerSelected] = useState(1)

  const [history, SetHistory] = useState([])

  async function copyTextToClipboard(text) {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(text);
    } else {
      return document.execCommand('copy', true, text);
    }
  }

  

  const decreaseCount = ()=>{
    setCount(count - 1);
  }

  const selections = {
    "rock" : 1,
    "paper" : 2,
    "scissors" : 3
   }
  const selectionsReverse = {
    "1": rock ,
    "2": paper,
    "3": scissors
   }

  const onChoose = (event)=>{
    console.log(event.currentTarget.id)
    const selectedName = event.currentTarget.id;
    const selectedId = selections[selectedName]

    const randomNo = Math.random() * 3; // random no between 0 and 3 
    const computerChoosen = Math.floor(randomNo) + 1;

    console.log(computerChoosen)

    setComputerSelected(computerChoosen)
    setUserSelected(selectedId)

    decreaseCount();

    socket.emit("choose", {
      userSelected: selectedId,
      socketId: socketId
    })

    

    setWait(false)
    // after choosing wait for other one to choose
  }

  const CreateGame = ()=>{
    
    if(userName == ""){
      openNotification({title: "Enter UserName"})
      return
    }
    socket.emit("creategame", {
      username: userName
    })

    openNotification({title:"", description: "A room id is created. Invite other player to play game"})

  }

  const StartGame = ()=>{
    if(userName == ""){
      openNotification({title: "Enter UserName"})
      return
    }
    if(roomId == ""){
      openNotification({title: "roomId error", description: "Create or enter a valid room id to start the game"})
      console.log("create game or join the room")
    } else {
      socket.emit("joinRoom", {
        roomId: roomId,
        userName: userName
      })
      openNotification({title: "joined room", description: "wait for other player to join the room so that we can start the game"})
      
    }
  }

  const copyRoomId = (event) => {
    event.target.select();
    copyTextToClipboard(shareUrl)
    openNotification({title:"URL is copied to clipboard", description: "  "})
  };

  useEffect(() => {

    socket.on("gameStarted", ()=>{ // here get starting object with username and all info that you want
      setStartGame(true)
      setTimer(30)
    })
  
    socket.on("socketId", (socketId)=>{
      setSocketId(socketId)
    })
  
    socket.on("finalOutput", (message)=>{
       const sockets = Object.keys(message)
       console.log(sockets)
       let opponentSocketId = ""

       sockets.forEach(s =>{
        if(s != socketId){
          opponentSocketId = s
        }
       })

       console.log(message[socketId])
       console.log(message[opponentSocketId])

       const hist = []
       let total = 0;
       for(let i=0; i<message[socketId]["history"].length; i++){
        hist.push({
          userSelected: message[socketId]["history"][i],
          opponentSelected: message[opponentSocketId]["history"][i],
          result: 1
        })

        total += 1;
       }

       console.log(total)
       console.log(hist)
    })




    socket.on("result", (message)=>{
      setTimeout(() => {
        setWait(true)
      }, 1000);
      setResultText(message.message)
      openNotification({title: "Opponent Selected " + message.otherUserSelection, description: message.message, selected: selectionsReverse[message.otherUserSelection]})
      console.log(JSON.stringify(message))
    })

    socket.on("opponentUserName", (opponentUserName)=>{
      setOpponentUserName(opponentUserName)
    })

    socket.on("stopGame", (message)=>{
      console.log(message.message)
      openNotification({title: "Game Stopped", description: "An Opponent disconnected...."})

      // Here Reset All the state of the game
      setCount(10)
      setRoomId("")
      setWait(true)
      setResultText("")
      setStartGame(false) // go back to previous state
    })

    const id = new URLSearchParams(search).get('roomId');
    if(id != null){ // setting id from the url given and start the game automatically
      setRoomId(id)
    }

    socket.on("getRoomId", (message)=>{
      setRoomId(message.roomId)
      setShareUrl("http://localhost:5173/games/stonePaperScissors?roomId="+ message.roomId)
    })

  }, [result])
  

  const openNotification = (message) => {
    notification.open({
      message: message.title || " ",
      description:
        message.description || "An Error Occured",
        btn: (<Space>
          <Card className='cursor-pointer' bodyStyle={{padding: "0"}}  bordered={false}>
                  <img className='object-full' src={selectionsReverse[message.selected]} alt="" />
          </Card>
          </Space>)
        ,
      onClick: () => {
        console.log('Notification Clicked!');
      },
      
    });
  };

  if(startGame == false) return (
    <div className='flex flex-col justify-center items-center h-[100vh] bg-gray-800'>
      <div className=" p-5 flex flex-col md:w-[40%] border border-gray-400 text-white">
      <input id='url' onFocus={copyRoomId} className="p-3 border bg-gray-800 text-white border-gray-500 m-5" type="text" value={shareUrl} onChange={(e)=> setShareUrl(event.target.value)}placeholder='Create game to share url'/>

      <Button type='primary' className='m-2' onClick={CreateGame} >Create Room</Button>
      {/* <input type="text" onFocus={copyRoomId} value={roomId} onChange={(e)=> setRoomId(event.target.value)} className='m-2 border border-gray-600 focus:border-gray-700 p-2 bg-gray-800 text-white' placeholder='Enter Room Id Or Generate Room Id'/> */}
      <input className="p-3 mb-15 border bg-gray-800 text-white border-gray-500 m-5" type="text" value={userName} onChange={(e)=> setUserName(event.target.value)}placeholder='Enter Your Username To Get Started..'/>

      <Button type='primary' className='m-2' onClick={StartGame}>Start Game</Button>

      </div>
    </div>
  )

  return (
    <div className='relative h-[100vh] w-[100vw] flex flex-col bg-gray-800 p-5 overflow-y-scroll'>
      {/* <img className='absolute top-1/2 left-1/2 z-0 object-full w-full h-full object-cover bg-red-400 opacity-40' src={Image} alt=""/> */}
        <h1 className='text-5xl font-bold w-full text-center mt-10 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 z-2 opacity-100'>Rock Paper Scissors</h1>
        {
          count > 0 && 
          <h2 className='text-3xl font-bold text-white text-center mt-10'>Trials Left <span className='text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-600'>{count}</span></h2> 
        }
        {
          count > 0 &&
          <div className='game'>

          { wait && 
            
            <div className="player-1 site-card-wrapper mt-10 mb-10 md:flex md:flex-col md:justify-center md:items-center">
            <h1 className='text-3xl font-bold text-white mb-5'>Select Any One </h1>
            <Row gutter={16} className="md:max-w-[50%]">
              <Col span={8} id="rock" onClick={ onChoose }>
                <Card title="Rock" className='cursor-pointer' bodyStyle={{padding: "0"}}  bordered={false}>
                  <img className='object-full' src={rock} alt="" />
                </Card>
              </Col>
              <Col span={8} id="paper" onClick={ onChoose }>
                <Card title="Paper" className='cursor-pointer' bodyStyle={{padding: "0"}} bordered={false}>
                  <img  className='object-full' src={paper} alt="" />
                </Card>
              </Col>
              <Col span={8} id="scissors" onClick={ onChoose }>
                <Card title="Scissors" className='cursor-pointer' bodyStyle={{padding: "0"}} bordered={false}>
                  <img className='object-full'src={scissors} alt="" />
                </Card>
              </Col>
            </Row>
          </div>
          
          
          }

          {
            !wait && 
             <div className='flex flex-col justify-center items-center p-10'>
               <Loading type="spinningBubbles" color="#ffffff" className=""></Loading>
               <p className='text-gray-400 mt-20 m-5'>Waiting for other player to select</p>
             </div>
            
          }

          <div className="result">
        {
          result == "won" && <h2 className='text-3xl font-bold text-white text-center'>You Won :)</h2>
        }
        {
          result == "loose" && <h2 className='text-3xl font-bold text-white text-center'>You Loose :|</h2>
        }
        {
          result == "draw" && <h2 className='text-3xl font-bold text-white text-center'>Draw :)))</h2>
        }
      </div>
          { wait && 
              <p className='text-gray-300 text-center '> {resultText} </p>
          }
        </div>

        
        }

      

      {
        count == 0 &&
        <div className="finalResult mt-10">
          <h2 className='text-3xl font-bold text-white text-center'>Final Result</h2>
          <h2 className='text-1xl font-bold text-white text-left mt-5'>All History</h2>
          
        </div>
      }
      
        
      {
        count <= 0 && 
        <table className="table-auto text-yellow-500 p-10 text-center border border-gray-400">
        <thead>
          <tr>
            <th>Count</th>
            <th>User Selected</th>
            <th>Computer Selected</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
      {
        history.map((element, index) =>
        
              <tr key={element.index}>
            <td>{element.index}</td>
            <td>{element.userSelected}</td>
            <td>{element.opponentSelected}</td>
            <td>{element.result}</td>
          </tr>

            ) 
      }      
      </tbody>
      </table>
          }
    </div>
  )
}

export default Main


// TODO

// Improve UI 
// Complete workflow offline game

// set up database for online game mongodb
// store get and set each result and have a online game between two players using a tcp like connection socket connection 
// It will help me to get a brief idea about how things works internally and how the real time game communication happers
// It is far good project then that of showing only some shopping site content whose videos are easily available on net.


// Change the logos 
// change white color to pink or light one 

// Show computer selection in ui