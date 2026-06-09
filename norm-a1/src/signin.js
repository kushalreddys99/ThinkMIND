import "./login.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Signin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${API}/api/signup/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Account created!");
      navigate("/login");
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error(error);
    alert("Server error");
  }
};

  const handleLoginLink = () => {
    navigate("/login");
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Create Account</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name:</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Confirm Password:</label>
            <input 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password" 
              required 
            />
          </div>

          <button type="submit" className="login-boo">
            Sign Up
          </button>
        </form>

        <p className="signup-link">
          Already have an account?{" "}
          <button
            onClick={handleLoginLink}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signin;
