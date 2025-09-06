import React, { useRef, useState } from "react";
import styles from "./FileUploadPage.module.css";

const initialFiles = [];

export default function FileUploadPage() {
  const [files, setFiles] = useState(initialFiles);
  const [markingSelected, setMarkingSelected] = useState([]);
  const [answerSelected, setAnswerSelected] = useState([]);
  const markingRef = useRef();
  const answerRef = useRef();

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
      formData.append('marking', file);
    });
    Array.from(answerFiles).forEach((file) => {
      formData.append('answer', file);
    });

    // Optimistically show uploading status
    const markingNewFiles = Array.from(markingFiles).map((file) => ({
      id: Date.now() + Math.random(),
      originalName: file.name,
      status: "UPLOADING",
      fileType: "MARKING",
    }));
    const answerNewFiles = Array.from(answerFiles).map((file) => ({
      id: Date.now() + Math.random(),
      originalName: file.name,
      status: "UPLOADING",
      fileType: "ANSWER",
    }));
    const newFiles = [...markingNewFiles, ...answerNewFiles];
    setFiles((prev) => [...newFiles, ...prev]);
    markingRef.current.value = "";
    answerRef.current.value = "";
    setMarkingSelected([]);
    setAnswerSelected([]);

    // Send to backend
    try {
      const res = await fetch("http://localhost:4000/files/bulk", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      // Update status to UPLOADED for returned files
      setFiles((prev) =>
        prev.map((f) => {
          const uploaded = data.find(
            (d) => d.originalName === f.originalName && d.fileType === f.fileType
          );
          return uploaded ? { ...f, status: "UPLOADED" } : f;
        })
      );
    } catch (err) {
      // On error, mark as FAILED
      setFiles((prev) =>
        prev.map((f) =>
          newFiles.some((nf) => nf.id === f.id)
            ? { ...f, status: "FAILED" }
            : f
        )
      );
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
        <button
          onClick={handleUpload}
          className={styles.uploadBtn}
        >
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
            </tr>
          </thead>
          <tbody>
            {files.length === 0 && (
              <tr>
                <td colSpan={3} className={styles.emptyRow}>
                  No files uploaded yet.
                </td>
              </tr>
            )}
            {files.map((file) => (
              <tr key={file.id}>
                <td className={styles.tableCell}>{file.originalName}</td>
                <td className={styles.tableCell}>
                  {file.fileType === "MARKING" ? "Marking Scheme" : "Answer Sheet"}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}