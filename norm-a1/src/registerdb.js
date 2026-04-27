import { useEffect, useState } from "react";
import axios from "axios";
import "./registerdb.css"
import { FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { SlClose } from "react-icons/sl";
import { toast,ToastContainer } from "react-toastify";


function StudentsList() {
  const [students, setStudents] = useState([]);
  const Navigate = useNavigate();
  const mess=()=>toast("are you sure");
  useEffect(() => {
    const API = process.env.REACT_APP_API_URL;

    axios.get(`${API}/api/students/`)
      .then(res => {
        setStudents(res.data);
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  return (
    <div className="container">
      <h2>Registered Students</h2>

      <div className="card-container">
        {students.map((student) => (
          <div key={student.id} className="card">
            
            <h3>{student.name} </h3>

            <p><strong>Email:</strong> {student.email}</p>

            <p><strong>Phone:</strong> {student.phone}</p>
            <p><strong>USN:</strong> {student.USN}</p>

            <p><strong></strong> {student.university_name}</p>
            <div className="ublist">
            <button onClick={()=>Navigate('/pdetails')}><FiArrowRight /></button> 
            <button onClick={mess}> <SlClose /></button>
            
            </div>
            <ToastContainer/>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentsList;   