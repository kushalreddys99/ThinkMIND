import React from "react";
import { Link } from "react-router-dom";
import "./side.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>MIND Think</h2>
      </div>
      <ul>
        <li>
          <Link to="/home" className="nav-link">
            <button>Home</button>
          </Link>
        </li>
        <li>
          <Link to="/aboutus" className="nav-link">
            <button>About Us</button>
          </Link>
        </li>
        <li>
          <Link to="/it" className="nav-link">
            <button>Services</button>
          </Link>
        </li>
        <li>
          <Link to="/call" className="nav-link">
            <button>Contact</button>
          </Link>
        </li>
      </ul>
    </div>
  );
}