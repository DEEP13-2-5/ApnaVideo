import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/Landing';
import Authentication from './pages/Authentication';
import { AuthProvider } from './context/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/Home'
import History from './pages/History';

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path='/auth' element={<Authentication />} />
             <Route path='/home's element={<HomeComponent />} />
             <Route path='/:url' element={<VideoMeetComponent />} /> 
            <Route path='/history' element={<History />} />
           
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;