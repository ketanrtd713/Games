import { BrowserRouter, Routes, Route } from "react-router-dom"
import { MemoryGame, StonePaperScissors, } from './games' // import all games from here
import {default as HomePage} from './HomePage';
import Signup from './pages/Signup'

function App() {

  return (
   
    <div className="App">
       <BrowserRouter>
          <Routes>
            <Route element={<HomePage/>} exact path="/"/>
            <Route element={<StonePaperScissors/>} exact path="/games/stonePaperScissors"/>
            <Route element={<Signup/>} exact path="/signup"/>
          </Routes>
       </BrowserRouter> 
    </div>
  )
}

export default App
