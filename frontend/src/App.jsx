import { BrowserRouter as Router, Routes, Route, Navigate as RouterNavigate } from 'react-router-dom'
import Navigate from './components/Navigate'
import RentPage from './routes/RentPage'
import SellPage from './routes/SellPage'
import MyRentalsPage from './routes/MyRentalsPage'
import PropertyDetailPage from './routes/PropertyDetailPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Navigate />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RouterNavigate to="/rent" replace />} />
            <Route path="/rent" element={<RentPage />} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/my-rentals" element={<MyRentalsPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="*" element={<RouterNavigate to="/rent" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
