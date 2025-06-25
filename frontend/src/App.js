import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/Home';
import LoginPage from './components/login';
import MyFieldsPage from './components/myfields';
import RegisterPage from './components/register';
import CreateFieldPage from './components/create_field';
import ProfilePage from './components/profile';
import CanvasPage from './components/field';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<MyFieldsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create_field" element={<CreateFieldPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/field/:id" element={<CanvasPage />} />
      </Routes>
    </Router>
  );
};

export default App;