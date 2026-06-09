import { useNavigate } from "react-router-dom";
import "./landing.css";
import { TypeAnimation } from "react-type-animation";

function Landing() {
  const navigate = useNavigate();

  return (
    <><header className="landheader"> 
        <h1>MIND Think</h1> 
    </header>
    
    <div className="landing-page">



          <div className="landingback"></div>
          <div className="landing-logo">
              <TypeAnimation className="folder-a"
                  sequence={[
                      "Welcome to MIND Think Center",
                      2000,
                      "Your Journey to Mental Wellness Starts Here",
                      2000,
                      "Empowering Minds, Transforming Lives",
                      2000,
                  ]}
                  wrapper="h1"
                  cursor={true}
                  repeat={Infinity}
                  style={{ fontSize: "2em", textAlign: "center", marginTop: "20px" }} />
          </div>



          <div className="scroll-text">
              <h2>
                  Welcome to MIND Think  <br />
                  Think Different • Act Faster • Achieve More<br/>
              </h2>
          </div>
        <div className="buttongroup">
          <button className="landing-login" onClick={() => navigate("/login")}>
              Login
          </button>
          <button className="landing-signup" onClick={() => navigate("/signin")}>
                Sign Up
          </button>
                  </div>
      </div>
      </>
    
  );
}

export default Landing;
