import React, { useEffect, useState } from "react";
import axios from "axios";
import "./report.css";

function Fileview() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchFiles = async () => {
    const res = await axios.get("http://localhost:8000/api/get-files/");

    const backendFiles = res.data.map((file) => ({
      file: { name: file.file.split("/").pop() },
      url: `http://localhost:8000${file.file}`,
      type: file.file.endsWith(".pdf")
        ? "application/pdf"
        : "image",
      id: file.id
    }));

    setFiles(backendFiles);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>Uploaded Files</h2>
      </div>

      <div className="file-grid">
        {files.map((item) => (
          <div key={item.id} className="file-card">
            <div
              className="file-name"
              onClick={() => setSelectedFile(item)}
            >
              {item.file.name}
            </div>
          </div>
        ))}
      </div>

      {selectedFile && (
        <div className="preview-wrapper">
          <div className="preview-card">
            <h3>Preview</h3>

            {selectedFile.type.startsWith("image/") ? (
              <img src={selectedFile.url} alt="" />
            ) : (
              <iframe src={selectedFile.url} title="preview"></iframe>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Fileview;