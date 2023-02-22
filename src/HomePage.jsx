import React from 'react';
import Card from 'antd/es/card/Card';

const HomePage = () => {
  return (
    <div className='min-h-screen bg-gray-800 py-20 relative max-w-screen'>
      <h1 className='text-3xl font-bold font-sans text-gray-400 text-center'>Welcome To Javascript Games World</h1>
      <div className="card flex flex-col justify-center items-center mt-20">
        <button className='p-5 border-gray-500 hover:border-gray-700 border-2 text-gray-400 hover:text-gray-200 transition-none duration-500'>Let's Play Games</button>
      </div>
      <div className='games px-10'>

        <a href="/games/stonepaperscissors" className='border-2 border-blue-400 block w-1/3'>
        <div className="game">
          <img src="https://i.pinimg.com/736x/a2/02/ff/a202ff44bf1c6d539eb954e916c796a2.jpg" alt="" />
          <h1 className='text-gray-300 p-5'>Stone Paper Scissors</h1>
        </div>
        </a>

      </div>
      <p className="read-the-docs absolute bottom-16 text-center w-full text-gray-500">
        Games are under development
      </p>
    </div>
  )
}

export default HomePage