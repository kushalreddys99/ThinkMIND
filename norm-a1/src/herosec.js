import React, { useState } from "react";

const HeroSec = () => {
  const [file, setFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [showData, setShowData] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pdfId, setPdfId] = useState(null);

  const MAX_SIZE_MB = 0.5;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      alert("Please upload a valid PDF file");
      e.target.value = "";
      return;
    }

    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > MAX_SIZE_MB) {
      alert("File size should not exceed 500KB");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setIsSubmitted(false);
    setPdfData(null);
    setShowData(false);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/upload-pdf/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert("PDF processed successfully!");

        setPdfData(data);
        setPdfId(data.id); 
        setIsSubmitted(true);
        setShowData(false);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    }
  };

  const handleView = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/get-pdf/${pdfId}/`
      );
      const data = await res.json();

      setPdfData(data);
      setShowData(true);
    } catch (error) {
      console.error(error);
      alert("Error fetching data");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Upload PDF</h2>

      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
      />

      <br /><br />

      <button
        onClick={handleSubmit}
        disabled={!file}
        style={{ padding: "8px 16px", cursor: "pointer" }}
      >
        Submit
      </button>

      <br /><br />

      {isSubmitted && (
        <button
          onClick={handleView}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          View Data
        </button>
      )}

      
      {showData && pdfData && (
        <div style={{ marginTop: "20px" }}>
          <h3>Extracted Data</h3>

          {pdfData.pages.map((page, index) => (
            <div
              key={index}
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "15px",
              }}
            >
              <h4>Page {page.page}</h4>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {page.text || "No text found"}
              </pre>
            </div>
          ))}
        </div>
      )}

     
      {showData && pdfData && (
        <div style={{ marginTop: "20px" }}>
          <h3>Raw JSON Data</h3>

          <pre
            style={{
              background: "#f8f8f8",
              padding: "15px",
              borderRadius: "8px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(pdfData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default HeroSec;