import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

function UploadAndDisplay() {
  const [fileType, setFileType] = useState("image");

  // Image/PDF
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Bulk
  const [bulkData, setBulkData] = useState([]);
  const [bulkHeaders, setBulkHeaders] = useState([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkSaveStatus, setBulkSaveStatus] = useState(null);
  const [bulkErrors, setBulkErrors] = useState([]);
 

  const bulkInputRef = useRef(null);

  /* ================= VALIDATION ================= */
  const validateBulkData = (data) => {
    const errors = [];

    data.forEach((row, index) => {
      const rowErrors = {};

      if (!row.USN || row.USN.trim() === "") {
        rowErrors.USN = "USN is required";
      }

      if (!row["Subject Name"] || row["Subject Name"].trim() === "") {
        rowErrors.subject = "Subject Name is required";
      }

      if (
        row["Marks Obtained"] === "" ||
        isNaN(row["Marks Obtained"]) ||
        Number(row["Marks Obtained"]) < 0 ||
        Number(row["Marks Obtained"]) > 100
      ) {
        rowErrors.marks = "Marks must be between 0–100";
      }

      if (Object.keys(rowErrors).length > 0) {
        errors.push({
          row: index + 1,
          errors: rowErrors,
        });
      }
    });

    return errors;
  };

  /* ================= IMAGE/PDF ================= */
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const filtered =
      fileType === "image"
        ? selectedFiles.filter((f) => f.type.startsWith("image/"))
        : selectedFiles.filter((f) => f.type === "application/pdf");

    const uploaded = filtered.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type,
      id: Date.now() + Math.random(),
    }));

    setFiles((prev) => [...prev, ...uploaded]);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) setSelectedFile(null);
  };

  const uploadFiles = async () => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f.file));

    await axios.post("http://localhost:8000/api/upload-files/", formData);
  };

  /* ================= BULK ================= */
  const handleBulkFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBulkFileName(file.name);
    setBulkSaveStatus(null);
    setBulkErrors([]);

    const reader = new FileReader();

    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      setBulkHeaders(Object.keys(json[0] || {}));
      setBulkData(json);

      setBulkErrors(validateBulkData(json));
    };

    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const saveBulkToReports = async () => {
    if (!bulkData.length) return;

    setBulkSaveStatus("saving");

    const formData = {
      data: bulkData.map(row => ({
        USN: row.USN?.toString().trim() || "",
        "Subject Name": row["Subject Name"]?.toString().trim() || "",
        "Written Date": row["Written Date"] || "",
        "Marks Obtained": Number(row["Marks Obtained"]) || 0
      }))
    };

    try {
      const response = await axios.post("http://localhost:8000/api/bulk/", formData, {
        headers: { "Content-Type": "application/json" }
      });

      const { insertedCount = 0, failedCount = 0, failedRows = [] } = response.data;

      setBulkSaveStatus({
        type: "done",
        success: insertedCount,
        failed: failedCount,
        failedRows,
        
      });

      // Filter to show only failed rows
      if (failedRows.length > 0) {
        const failedData = failedRows.map(f => f.data);
        setBulkData(failedData);
        setBulkHeaders(Object.keys(failedData[0] || {}));
        setBulkErrors(failedRows.map(f => ({ row: f.row, errors: { general: f.error } })));
      } else {
        setBulkData([]);
        setBulkErrors([]);
        setBulkFileName("Upload complete!");
      }

    } catch (error) {
      let success = 0;
      let failed = 0;
      let failedRows = [];

      if (error.response?.data) {
        success = error.response.data.insertedCount || 0;
        failed = error.response.data.failedCount || bulkData.length;
        failedRows = error.response.data.failedRows || [];
      }

      setBulkSaveStatus({
        type: "error",
        success,
        failed,
        failedRows,
        error: error.response?.data?.error || error.message
      });
    }
  };

  const downloadExcel = () => {
    const data = [
      {
        USN: "",
        "Subject Name": "",
        "Written Date": "",
        "Marks Obtained": "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    XLSX.writeFile(wb, "sample_template.xlsx");
  };

  /* ================= UI ================= */
  return (
    <div className="container">
      <div className="card">
        <h2>Upload Documents</h2>

        {/* 🔘 RADIO BUTTONS */}
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="image"
              checked={fileType === "image"}
              onChange={(e) => setFileType(e.target.value)}
            />
            Images
          </label>

          <label>
            <input
              type="radio"
              value="pdf"
              checked={fileType === "pdf"}
              onChange={(e) => setFileType(e.target.value)}
            />
            PDF
          </label>

          <label>
            <input
              type="radio"
              value="bulk"
              checked={fileType === "bulk"}
              onChange={(e) => setFileType(e.target.value)}
            />
            Bulk Excel
          </label>
        </div>

        {/* ================= BULK ================= */}
        {fileType === "bulk" ? (
          <>
            <button onClick={downloadExcel}>
              ⬇ Download Excel Template
            </button>

            <input
              ref={bulkInputRef}
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleBulkFileChange}
            />

            <div
              className="upload-box"
              onClick={() => bulkInputRef.current.click()}
            >
              Upload Excel
            </div>

            {bulkFileName && <p>{bulkFileName}</p>}

            {bulkData.length > 0 && (
              <>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        {bulkHeaders.map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.map((row, i) => {
                        const hasError = bulkErrors.some(
                          (e) => e.row === i + 1
                        );

                        return (
                          <tr
                            key={i}
                            style={{
                              backgroundColor: hasError
                                ? "#ffe6e6"
                                : "#e6ffe6",
                            }}
                          >
                            {bulkHeaders.map((h) => (
                              <td key={h}>{row[h]}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {bulkErrors.length > 0 && (
                  <div className="error-box">
                    {bulkErrors.map((err, i) => (
                      <div key={i}>
                        Row {err.row}
                        <ul>
                          {Object.values(err.errors).map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={saveBulkToReports}>
                  {bulkSaveStatus === "saving"
                    ? "Saving..."
                    : "Save Data"}
                </button>

                {bulkSaveStatus && (
  <div
    style={{
      marginTop: "20px",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      backgroundColor:
        bulkSaveStatus.type === "done"
          ? "#e6ffe6"
          : bulkSaveStatus.type === "error"
          ? "#ffe6e6"
          : "#fff5e6",
    }}
  >
    <h2>Response Window</h2>
    <h3 style={{ marginBottom: "10px" }}>
      {bulkSaveStatus?.type === "saving" && " Saving Data..."}
      {bulkSaveStatus?.type === "done" && " Upload Completed"}
      {bulkSaveStatus?.type === "error" && " Upload Failed"}
    </h3>

   
    {bulkSaveStatus?.message && (
      <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
        {bulkSaveStatus.message}
      </p>
    )}

    
    {bulkSaveStatus?.type !== "saving" && (
      <>
        <p>
          <strong style={{ color: "green" }}> Success:</strong>{" "}
          {bulkSaveStatus.success}
        </p>

        <p>
          <strong style={{ color: "red" }}> Failed:</strong>{" "}
          {bulkSaveStatus.failed}
        </p>
      </>
    )}

    {/* OPTIONAL ERROR TEXT */}
    {bulkSaveStatus.error && (
      <p style={{ color: "red", marginTop: "10px" }}>
        {bulkSaveStatus.error}
      </p>
    )}
  </div>
)}
              </>
            )}
          </>
        ) : (
          /* ================= IMAGE/PDF ================= */
          <>
            <input
              type="file"
              multiple
              hidden
              id="upload"
              accept={fileType === "image" ? "image/*" : "application/pdf"}
              onChange={handleFileChange}
            />

            <label htmlFor="upload" className="upload-box">
              Upload {fileType}
            </label>

            <button onClick={uploadFiles}>Save Files</button>

            {files.map((f) => (
              <div key={f.id}>
                <span onClick={() => setSelectedFile(f)}>
                  {f.file.name}
                </span>
                <button onClick={() => removeFile(f.id)}>X</button>
              </div>
            ))}

            {selectedFile && (
              <>
                {selectedFile.type.startsWith("image/") ? (
                  <img src={selectedFile.url} width="200" />
                ) : (
                  <iframe src={selectedFile.url} title="preview" />
                )}
              </>
            )}
          </>
        )}
        
      </div>
    </div>
  );
}

export default UploadAndDisplay;

