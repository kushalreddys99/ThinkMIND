import React from "react";
import { Link } from "react-router-dom";
import "./side.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <ul>
        <li><Link to="/home"><button>Home</button></Link></li>
        <li><Link to="/aboutus"><button>About Us</button></Link></li>
        <li><Link to="/it"><button>Services</button></Link></li>
        <li><Link to="/call"><button>Contact</button></Link></li>
      </ul>
    </div>
  );
}