import "./login.css";
import { useNavigate } from "react-router-dom";

function getCookie(name) {
  if (!document.cookie) return null;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.substring(0, name.length + 1) === (name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

function Login({ onLogin }) {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target[0].value;
    const password = e.target[1].value;

    const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

    try {
      await fetch(`${API}/api/get-csrf/`, { credentials: 'include' });

      const csrfToken = getCookie('csrftoken');

      const res = await fetch(`${API}/api/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Login Successful');
        onLogin();
        navigate('/home');
      } else {
        alert(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error(error);
      alert('Server error. Please try again.');
    }
  };

  const handleSignup = () => {
    navigate('/signin');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password'); // update route as needed
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Welcome to MIND Think</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-boo">
            Login
          </button>
        </form>

        <p className="signup-link">
          Don't have an account?{' '}
          <button
            onClick={handleSignup}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign up here
          </button>
        </p>

        <p className="forgot-password">
          <button
            onClick={handleForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Forgot Password?
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;
