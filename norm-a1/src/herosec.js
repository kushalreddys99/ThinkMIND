import React, { useState } from "react";
import "./herosec.css";

const HeroSec = () => {
  const [mode, setMode] = useState("normal");
  const [studentFile, setStudentFile] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);

  const MAX_SIZE_MB = 0.5;

  const validatePDF = (selectedFile) => {
    if (!selectedFile) return false;
    if (selectedFile.type !== "application/pdf") {
      alert("Please upload a valid PDF");
      return false;
    }
    if (selectedFile.size / (1024 * 1024) > MAX_SIZE_MB) {
      alert("File size should not exceed 500KB");
      return false;
    }
    return true;
  };

  const handleStudentFile = (e) => {
    const f = e.target.files[0];
    if (validatePDF(f)) setStudentFile(f);
  };

  const handleReferenceFile = (e) => {
    const f = e.target.files[0];
    if (validatePDF(f)) setReferenceFile(f);
  };

  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
    setPdfData(null);
    setStudentFile(null);
    setReferenceFile(null);
  };

  const handleSubmit = async () => {
    if (!studentFile) { alert("Please upload student PDF"); return; }
    if (mode === "reference" && !referenceFile) { alert("Please upload reference PDF"); return; }

    const formData = new FormData();
    formData.append("file", studentFile);
    if (mode === "reference") formData.append("reference_pdf", referenceFile);

    setLoading(true);
    setPdfData(null);

    try {
      const endpoint =
        mode === "normal"
          ? "http://localhost:8000/api/upload-pdf/"
          : "http://localhost:8000/api/reference-evaluation/";

      const response = await fetch(endpoint, { method: "POST", body: formData });
      const data = await response.json();

      if (response.ok) {
        setPdfData(data);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading PDF");
    } finally {
      setLoading(false);
    }
  };

  // Allow teacher to manually override a mark
  const handleMarkChange = (index, value) => {
    const updated = [...pdfData.results];
    updated[index].marks_obtained = Math.min(10, Math.max(0, Number(value)));
    const newTotal = updated.reduce((sum, r) => sum + r.marks_obtained, 0);
    const newPct = ((newTotal / (updated.length * 10)) * 100).toFixed(2);
    setPdfData({ ...pdfData, results: updated, total_score: newTotal, percentage: parseFloat(newPct) });
  };

  const getGradeColor = (pct) => {
    if (pct >= 75) return "grade-high";
    if (pct >= 50) return "grade-mid";
    return "grade-low";
  };

  return (
    <div className="herosec-container">

      {/* ── Upload Card ── */}
      <div className="upload-card">
        <h1 className="main-title">PDF Evaluation System</h1>

        <div className="mode-selection">
          <label className="radio-label">
            <input type="radio" name="evaluationMode" value="normal"
              checked={mode === "normal"} onChange={() => handleModeChange("normal")} />
            Normal Evaluation
          </label>
          <label className="radio-label">
            <input type="radio" name="evaluationMode" value="reference"
              checked={mode === "reference"} onChange={() => handleModeChange("reference")} />
            Reference PDF Evaluation
          </label>
        </div>

        <div className="upload-section">
          <div className="file-box">
            <label>Student PDF</label>
            <input type="file" accept="application/pdf" onChange={handleStudentFile} />
            {studentFile && <span className="file-name">✓ {studentFile.name}</span>}
          </div>

          {mode === "reference" && (
            <div className="file-box">
              <label>Reference PDF</label>
              <input type="file" accept="application/pdf" onChange={handleReferenceFile} />
              {referenceFile && <span className="file-name">✓ {referenceFile.name}</span>}
            </div>
          )}
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : "Evaluate PDF"}
        </button>
      </div>

     
      {pdfData && (
        <div className="result-container">

          
          <div className="summary-card">
            <h2>Evaluation Summary</h2>
            <div className="summary-grid">
              <div className={`summary-item ${getGradeColor(pdfData.percentage)}`}>
                <h3>{pdfData.percentage}%</h3>
                <p>Percentage</p>
              </div>
              <div className="summary-item">
                <h3>{pdfData.total_score} / {pdfData.max_score}</h3>
                <p>Total Score</p>
              </div>
              <div className="summary-item">
                <h3>{pdfData.total_questions}</h3>
                <p>Questions</p>
              </div>
            </div>
          </div>

          <div className="marks-card">
            <h2>Question-wise Marks</h2>
            <table className="marks-table">
              <thead>
                <tr>
                  <th>Question No.</th>
                  <th>Marks Obtained</th>
                  <th>Out Of</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {pdfData.results?.map((item, index) => (
                  <tr key={index} className={item.marks_obtained >= 7 ? "row-high" : item.marks_obtained >= 4 ? "row-mid" : "row-low"}>
                    <td>Q{item.question_number}</td>
                    <td><strong>{item.marks_obtained}</strong></td>
                    <td>{item.marks_out_of}</td>
                    <td>
                      <input
                        type="number"
                        className="mark-input"
                        value={item.marks_obtained}
                        min="0"
                        max="10"
                        onChange={(e) => handleMarkChange(index, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};

export default HeroSec;