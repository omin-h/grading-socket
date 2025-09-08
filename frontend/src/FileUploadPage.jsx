import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import styles from "./FileUploadPage.module.css";

const initialFiles = [];

export default function FileUploadPage() {
  const [files, setFiles] = useState(initialFiles);
  const [markingSelected, setMarkingSelected] = useState([]);
  const [answerSelected, setAnswerSelected] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFile, setDrawerFile] = useState(null);
  const markingRef = useRef();
  const answerRef = useRef();

  useEffect(() => {
    const socket = io("http://localhost:4001");
    socket.on("fileStatus", (file) => {
      setFiles((prev) => {
        // Remove any optimistic file (id is not a positive integer) with same originalName and fileType
        const filtered = prev.filter(
          (f) =>
            !(
              (!f.id || typeof f.id !== "number" || f.id <= 0) &&
              f.originalName === file.originalName &&
              f.fileType === file.fileType
            )
        );
        const exists = filtered.some((f) => f.id === file.id);
        if (exists) {
          return filtered.map((f) => (f.id === file.id ? { ...f, ...file } : f));
        } else {
          return [file, ...filtered];
        }
      });
    });
    socket.on("aiStatus", ({ id, aiStatus }) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, aiStatus } : f))
      );
    });
    socket.on("aiResult", ({ id, aiResult }) => {
      console.log("Received aiResult:", id, aiResult);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, aiResult } : f))
      );
    });
    return () => socket.disconnect();
  }, []);

  // Handle file selection to show selected file names
  const handleFileSelect = (type, e) => {
    const filesArr = Array.from(e.target.files).map((f) => f.name);
    if (type === "MARKING") setMarkingSelected(filesArr);
    if (type === "ANSWER") setAnswerSelected(filesArr);
  };

  // Upload both marking and answer files in one request
  const handleUpload = async () => {
    const markingFiles = markingRef.current.files;
    const answerFiles = answerRef.current.files;
    if (!markingFiles.length && !answerFiles.length) return;

    const formData = new FormData();
    Array.from(markingFiles).forEach((file) => {
      formData.append("marking", file);
    });
    Array.from(answerFiles).forEach((file) => {
      formData.append("answer", file);
    });

    markingRef.current.value = "";
    answerRef.current.value = "";
    setMarkingSelected([]);
    setAnswerSelected([]);

    // Send to backend, but do NOT update files state here
    try {
      await fetch("http://localhost:4001/files/bulk", {
        method: "POST",
        body: formData,
      });
      // Do nothing here; wait for socket events
    } catch (err) {
      // Optionally show an error message to the user
      alert("Upload failed. Please try again.");
    }
  };

  return (
    <div className={styles.pageBg}>
      <div className={styles.uploadBox}>
        <h2 className={styles.sectionTitle}>Upload Files</h2>
        <div className={styles.uploadFields}>
          <div className={styles.uploadField}>
            <label className={styles.uploadLabel}>Marking Scheme</label>
            <input
              type="file"
              accept="application/pdf"
              ref={markingRef}
              multiple
              onChange={(e) => handleFileSelect("MARKING", e)}
              className={styles.uploadInput}
            />
            {markingSelected.length > 0 && (
              <div className={styles.selectedFiles}>
                {markingSelected.map((name, idx) => (
                  <div key={idx}>{name}</div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.uploadField}>
            <label className={styles.uploadLabel}>Answer Sheets</label>
            <input
              type="file"
              accept="application/pdf"
              ref={answerRef}
              multiple
              onChange={(e) => handleFileSelect("ANSWER", e)}
              className={styles.uploadInput}
            />
            {answerSelected.length > 0 && (
              <div className={styles.selectedFiles}>
                {answerSelected.map((name, idx) => (
                  <div key={idx}>{name}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={handleUpload} className={styles.uploadBtn}>
          Upload Selected Files
        </button>
      </div>
      <div className={styles.tableBox}>
        <h3 className={styles.tableTitle}>Uploaded Files</h3>
        <table className={styles.fileTable}>
          <thead>
            <tr className={styles.tableHeadRow}>
              <th className={styles.tableCell}>File Name</th>
              <th className={styles.tableCell}>Type</th>
              <th className={styles.tableCell}>Status</th>
              <th className={styles.tableCell}>AI Status</th>
              <th className={styles.tableCell}>AI Result</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  No files uploaded yet.
                </td>
              </tr>
            )}
            {files.map((file) => (
              <tr key={file.id}>
                <td className={styles.tableCell}>{file.originalName}</td>
                <td className={styles.tableCell}>
                  {file.fileType === "MARKING"
                    ? "Marking Scheme"
                    : "Answer Sheet"}
                </td>
                <td className={styles.tableCell}>
                  <span
                    className={
                      styles.statusBadge +
                      " " +
                      (file.status === "UPLOADED"
                        ? styles.statusUploaded
                        : file.status === "FAILED"
                        ? styles.statusFailed
                        : styles.statusUploading)
                    }
                  >
                    {file.status}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  {file.fileType === "ANSWER" ? (file.aiStatus || "Pending") : ""}
                </td>
                <td className={styles.tableCell}>
                  {file.fileType === "ANSWER" && (
                    <button
                      onClick={() => {
                        // Always use the latest file object from state
                        const latest = files.find(f => f.id === file.id);
                        console.log("Opening drawer for file:", latest || file);
                        setDrawerFile(latest || file);
                        setDrawerOpen(true);
                      }}
                    >
                      View Result
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {drawerOpen && drawerFile && (
        <div className={styles.drawer}>
          <button onClick={() => setDrawerOpen(false)}>Close</button>
          <h3>AI Result for {drawerFile.originalName}</h3>
          <div className={styles.resultBox}>
            {drawerFile.aiResult
              ? typeof drawerFile.aiResult === "string"
                ? <ReactMarkdown>{drawerFile.aiResult}</ReactMarkdown>
                : drawerFile.aiResult.response
                  ? <ReactMarkdown>{drawerFile.aiResult.response}</ReactMarkdown>
                  : <ReactMarkdown>{JSON.stringify(drawerFile.aiResult, null, 2)}</ReactMarkdown>
              : "No result yet."}
          </div>
        </div>
      )}
    </div>
  );
}