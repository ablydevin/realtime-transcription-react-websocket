import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom';
import Publisher from './Publisher'
import Subscriber from './Subscriber'
import './App.css'
import Home from './Home';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 10, }}>
      <div>
          <Link to="/">Home</Link>
        </div>
        <div>
          <Link to="/Publisher">Publisher</Link>
        </div>
        <div>
          <Link to="/Subscriber">Subscriber</Link>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/publisher" element={<Publisher />} />
          <Route path="/subscriber" element={<Subscriber />} />
        </Routes>
      </div>

    </>
  )
}

export default App
