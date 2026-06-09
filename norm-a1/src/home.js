import Graphs from "./graphs";
import Sidebar from "./sidebar";
import "./home.css";

function Home() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="home-page">
        <div className="paragraph">
          "Think Different. Act Faster. Achieve More."
        </div>

        <div className="card-container">
          <div className="graph-card small-graph">
            <h2>Sales</h2>
            <Graphs type="line" />
          </div>
          
          <div className="graph-card small-graph">
            <h2>Performance</h2>
            <Graphs type="bar" />
          </div>

          <div className="graph-card large-graph">
            <h2>Overall Graph</h2>
            <Graphs type="pie" />
          </div>
        </div>

        <div className="header-line">
          <h4>
            Welcome to the React app. In the heart of the digital age, information flows like a relentless river. Lines of code, stories of triumph, and breaking news travel across screens.
          </h4>
        </div>

        <footer className="app-footer">
          <p>&copy; 2026 MIND Think. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default Home;