import React from "react";
import "./service.css";

function Appointment() {
  return (
    <div className="forms-page">
    <form className="appointment-form">
      <h1>Book an Appointment</h1>
        <label>Enter your name:
        <input
          type="text" required
          
          
        /><br />
      </label>
       
        <label >phone:
        <input
          type="tel" required
          
        />
      </label><br />
      <label >Date:
        <input
          type="date" required
          
        />
      </label><br />
       <label >Time:
        <input
          type="time" required
          
        />
      </label><br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Appointment;