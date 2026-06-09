import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

import Drop from "./dropdown";
import Overview from "./overview";
import Herosec from "./herosec";
import Announcement from "./announcement";
import Register from "./registerdb";
import Neurofeedback from "./nfeedback";
import Stressm from "./stressm";

import Evidence from "./evidence";
import Appointment from "./appointment";
import Call from "./call";
import Place from "./place";

import Login from "./login";
import Signin from "./signin";
import Landing from "./landing";
import Home from "./home";
import Qr from "./qr";
import Report from "./report";
import AboutUs from "./aboutus";
import Sidebar from "./sidebar";
import ProfileForm from "./pdetails"; 
import Unireg from "./unireg";

import "./App.css";
import Fileview from "./fileview";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>

      
      {!isLoggedIn ? (
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signin" element={<Signin onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <>
         
          <header className="app-header">
            <h1 className="logo-title">MIND Think</h1>
            <Drop onLogout={handleLogout} />
          </header>
         

          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/hero" element={<Herosec />} />
            <Route path="/announcement" element={<Announcement />} />
            <Route path="/registerdb" element={<Register />} />
            <Route path="/nfeedback" element={<Neurofeedback />} />
            <Route path="/stressm" element={<Stressm />} />
            <Route path="/fileview" element={<Fileview />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/call" element={<Call />} />
            <Route path="/place" element={<Place />} />
            <Route path="/qr" element={<Qr />} />
            <Route path="/report" element={<Report />} />
            <Route path="/aboutus" element={<AboutUs />} />
            <Route path="/sidebar" element={<Sidebar />} />
            <Route path="/pdetails" element={<ProfileForm/>}/>
            <Route path="/unireg" element={<Unireg/>}/>
            <Route path="*" element={<Navigate to="/home" replace />} />
            
          </Routes>
        </>
      )}

    </BrowserRouter>
  );
}

export default App;
