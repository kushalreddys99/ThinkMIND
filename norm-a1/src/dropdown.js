import React, { useState,useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./dropdown.css";

const navItems = [
  {
    label: "Home",
    path: "/home",
    links: [
      {name:"about us", to:"/aboutus"},  
      { name: "Overview", to: "/overview" },
      { name: "pdf plumber", to: "/hero" },
      { name: "chatBOT", to: "/announcement" },
    ],
  },
  {
    label: "Services",
    links: [
      { name:"student registration",to:"/pdetails"},
      {name:"university registration",to:"/unireg"},
      { name: "Registered", to: "/registerdb" },
      { name: "Neurofeedback", to: "/nfeedback" },
      
      { name: "Stress Management", to: "/stressm" },
    ],
  },
  {
    label: "Features",
    links: [
      { name: "view files", to: "/fileview" },
      { name: "Evidence-Based Care", to: "/evidence" },
      
    ],
  },
  {
    label: "Contact",
    links: [
      { name: "Book Appointment", to: "/appointment" },
      { name: "Call/Email", to: "/call" },
      { name: "Find Us", to: "/place" },
    ],
  },
  {
    label:"Qr Code",
    links: [
      { name: "Scan QR Code", to: "/qr" },
      { name: "upload your reports here", to: "/report" }
    ]

  },
  {
    label:"Logout",
    links:[
      {name:"Logout", to:"/login"}
    ]
  }
];

function Drop({ onLogout }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const navigate = useNavigate();
  const closeTimeout = useRef(null);
  const handleMouseEnter = (index) => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    setHoverIndex(index);
  };
  const handleMouseLeave = () => {
    
    closeTimeout.current = setTimeout(() => {
      setHoverIndex(null);
    }, 300); 
  
  };
  
  return (
    <nav className="dropdown-nav">
      {navItems.map((item, index) => (
        <div
          className="dropdown-item"
          key={index}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={() => handleMouseLeave()}
        >
          <button
            className={`nav-btn ${hoverIndex === index ? "active" : ""}`}
            onClick={() => {
              if (item.label === "Logout") {
                onLogout();
                navigate("/login");
                return;
              }

              if (item.path) {
                navigate(item.path);
              }
            }}
          >
            {item.label}
            <span className={`arrow ${hoverIndex === index ? "up" : ""}`}>
              ▾
            </span>
          </button>

          {hoverIndex === index && (
            <ul className="dropdown-list">
              {item.links.map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    onClick={(event) => {
                      if (item.label === "Logout") {
                        event.preventDefault();
                        onLogout();
                        navigate("/login");
                      }
                    }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Drop;
