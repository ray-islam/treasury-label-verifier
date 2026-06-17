import { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";

const initialResults = {
  overallStatus: "Waiting for verification",
  overallTone: "neutral",
  brandName: "Waiting for verification",
  classType: "Waiting for verification",
  alcoholContent: "Waiting for verification",
  netContents: "Waiting for verification",
  governmentWarning: "Waiting for verification",
};

const initialExtractedData = {
  brandName: "",
  classType: "",
  alcoholContent: "",
  netContents: "",
  governmentWarning: "",
};

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [extractedData, setExtractedData] = useState(initialExtractedData);

  const [formData, setFormData] = useState({
    brandName: "",
    classType: "",
    alcoholContent: "",
    netContents: "",
    governmentWarning: "",
  });

  const [results, setResults] = useState(initialResults);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function runOcr(file) {
    if (!file) return;

    setOcrLoading(true);
    setOcrError("");
    setOcrText("");
    setExtractedData(initialExtractedData);

    let worker;

    try {
      worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(file);

      const cleanedText = text?.trim() || "";
      setOcrText(cleanedText);

      setExtractedData({
        brandName: extractBrandName(cleanedText),
        classType: extractClassType(cleanedText),
        alcoholContent: extractAlcoholContent(cleanedText),
        netContents: extractNetContents(cleanedText),
        governmentWarning: extractGovernmentWarning(cleanedText),
      });
    } catch (error) {
      console.error("OCR failed:", error);
      setOcrError("OCR failed. Please try a clearer label image.");
      setOcrText("");
      setExtractedData({
        brandName: "Needs manual review",
        classType: "Needs manual review",
        alcoholContent: "Not confidently detected",
        netContents: "Not confidently detected",
        governmentWarning: "Not confidently detected",
      });
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setOcrLoading(false);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setResults(initialResults);
    setOcrError("");
    setOcrText("");
    setExtractedData(initialExtractedData);

    if (file) {
      runOcr(file);
    }
  }

  function normalizeValue(value) {
    return value
      .normalize("NFKC")
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, " ");
  }

  function compareField(applicationValue, extractedValue) {
    if (!applicationValue.trim()) {
      return "Missing application value";
    }

    if (!selectedFile) {
      return "No label uploaded";
    }

    if (
      !extractedValue ||
      extractedValue === "Not confidently detected" ||
      extractedValue === "Needs manual review"
    ) {
      return "Needs review";
    }

    const normalizedApplication = normalizeValue(applicationValue);
    const normalizedExtracted = normalizeValue(extractedValue);

    if (normalizedApplication === normalizedExtracted) {
      return "Match";
    }

    if (
      normalizedApplication.includes(normalizedExtracted) ||
      normalizedExtracted.includes(normalizedApplication)
    ) {
      return "Possible match";
    }

    return "Mismatch";
  }

  function getRowTone(status) {
    if (status === "Match") {
      return "success";
    }

    if (status === "Possible match" || status === "Needs review") {
      return "warning";
    }

    if (
      status === "Mismatch" ||
      status === "Missing application value" ||
      status === "No label uploaded"
    ) {
      return "error";
    }

    return "neutral";
  }

  function handleVerify() {
    const nextResults = {
      brandName: compareField(formData.brandName, extractedData.brandName),
      classType: compareField(formData.classType, extractedData.classType),
      alcoholContent: compareField(
        formData.alcoholContent,
        extractedData.alcoholContent
      ),
      netContents: compareField(formData.netContents, extractedData.netContents),
      governmentWarning: compareField(
        formData.governmentWarning,
        extractedData.governmentWarning
      ),
    };

    const resultValues = Object.values(nextResults);

    const hasBlockingIssue = resultValues.some(
      (status) =>
        status === "Mismatch" ||
        status === "Missing application value" ||
        status === "No label uploaded"
    );

    const hasReviewItems = resultValues.some(
      (status) => status === "Possible match" || status === "Needs review"
    );

    let overallStatus = "Ready for comparison";
    let overallTone = "success";

    if (hasBlockingIssue) {
      overallStatus = "Issues found during verification";
      overallTone = "error";
    } else if (hasReviewItems) {
      overallStatus = "Review required before approval";
      overallTone = "warning";
    } else if (selectedFile) {
      overallStatus = "All checked fields matched extracted label text";
      overallTone = "success";
    }

    setResults({
      overallStatus,
      overallTone,
      ...nextResults,
    });
  }

  function extractAlcoholContent(text) {
    if (!text) return "Not confidently detected";

    const match = text.match(
      /\b\d{1,2}(?:\.\d+)?\s?%\s*(?:ALC\.?\/VOL\.?)?(?:\s*\(\d{1,3}\s?PROOF\))?/i
    );

    return match ? match[0].trim() : "Not confidently detected";
  }

  function extractNetContents(text) {
    if (!text) return "Not confidently detected";

    const match = text.match(/\b\d{2,4}\s?(ML|mL|L)\b/);
    return match ? match[0].trim() : "Not confidently detected";
  }

  function extractGovernmentWarning(text) {
    if (!text) return "Not confidently detected";

    const upperText = text.toUpperCase();
    const startIndex = upperText.indexOf("GOVERNMENT WARNING");

    if (startIndex === -1) {
      return "Not confidently detected";
    }

    return text.slice(startIndex, startIndex + 320).trim();
  }

  function extractClassType(text) {
    if (!text) return "Needs manual review";

    const knownTypes = [
      "KENTUCKY STRAIGHT BOURBON WHISKEY",
      "STRAIGHT BOURBON WHISKEY",
      "BOURBON WHISKEY",
      "RYE WHISKEY",
      "WHISKEY",
      "VODKA",
      "GIN",
      "RUM",
      "TEQUILA",
      "SCOTCH WHISKY",
      "WHISKEY WITH NATURAL FLAVOR",
    ];

    const upperText = text.toUpperCase();
    const found = knownTypes.find((type) => upperText.includes(type));

    return found || "Needs manual review";
  }

  function extractBrandName(text) {
    if (!text) return "Needs manual review";

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const ignoredPhrases = [
      "GOVERNMENT WARNING",
      "SURGEON GENERAL",
      "NET CONTENTS",
      "ALC",
      "PROOF",
      "WHISKEY",
      "BOURBON",
      "DISTILLED",
      "PRODUCT OF",
      "BOTTLED BY",
    ];

    const candidate = lines.find((line) => {
      const upper = line.toUpperCase();

      if (line.length < 3 || line.length > 40) return false;
      if (!/[A-Z]/i.test(line)) return false;
      if (ignoredPhrases.some((phrase) => upper.includes(phrase))) return false;

      return /^[A-Z0-9'&.\-\s]+$/i.test(line);
    });

    return candidate ? candidate.toUpperCase() : "Needs manual review";
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Treasury Label Verification Prototype</h1>
        <p>
          Upload an alcohol label, enter application values, and compare the
          extracted label text against the submitted data.
        </p>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>1. Label Upload</h2>
          <p>Upload a label image for OCR and review.</p>

          <div className="form-group">
            <label htmlFor="labelImage">Label Image</label>
            <input
              id="labelImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="placeholder-box">
            {selectedFile ? (
              <div>
                <strong>Selected file:</strong> {selectedFile.name}
              </div>
            ) : (
              <div>Supported formats: JPG, PNG, WEBP.</div>
            )}
          </div>

          {previewUrl && (
            <div className="upload-review-grid">
              <div className="image-preview-card">
                <p className="image-preview-title">Uploaded Label Preview</p>
                <img
                  src={previewUrl}
                  alt="Uploaded alcohol label preview"
                  className="image-preview"
                />
              </div>

              <div className="ocr-preview-card">
                <p className="image-preview-title">Extracted Label Text</p>
                <pre className="ocr-preview-text">
                  {ocrLoading
                    ? "Running OCR on uploaded label..."
                    : ocrError
                    ? ocrError
                    : ocrText || "No OCR text extracted yet."}
                </pre>
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <h2>2. Application Data</h2>
          <p>Enter the values from the submitted application.</p>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="brandName">Brand Name</label>
              <input
                id="brandName"
                name="brandName"
                type="text"
                placeholder="e.g. OLD TOM DISTILLERY"
                value={formData.brandName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="classType">Class / Type</label>
              <input
                id="classType"
                name="classType"
                type="text"
                placeholder="e.g. Kentucky Straight Bourbon Whiskey"
                value={formData.classType}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="alcoholContent">Alcohol Content</label>
              <input
                id="alcoholContent"
                name="alcoholContent"
                type="text"
                placeholder="e.g. 45% Alc./Vol. (90 Proof)"
                value={formData.alcoholContent}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="netContents">Net Contents</label>
              <input
                id="netContents"
                name="netContents"
                type="text"
                placeholder="e.g. 750 mL"
                value={formData.netContents}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="governmentWarning">Government Warning</label>
            <textarea
              id="governmentWarning"
              name="governmentWarning"
              rows="5"
              placeholder="Paste the expected government warning statement here"
              value={formData.governmentWarning}
              onChange={handleInputChange}
            />
          </div>

          <button className="primary-button" onClick={handleVerify}>
            Verify Label
          </button>
        </section>

        <section className="card">
          <h2>3. Verification Results</h2>
          <p>
            Verification status for each required field will appear here after
            review.
          </p>

          <div className={`status-banner status-banner-${results.overallTone}`}>
            <strong>Overall Status:</strong> {results.overallStatus}
          </div>

          <div className="results-list">
            <div className={`result-row result-row-${getRowTone(results.brandName)}`}>
              <strong>Brand Name:</strong> {results.brandName}
            </div>

            <div className={`result-row result-row-${getRowTone(results.classType)}`}>
              <strong>Class / Type:</strong> {results.classType}
            </div>

            <div
              className={`result-row result-row-${getRowTone(
                results.alcoholContent
              )}`}
            >
              <strong>Alcohol Content:</strong> {results.alcoholContent}
            </div>

            <div className={`result-row result-row-${getRowTone(results.netContents)}`}>
              <strong>Net Contents:</strong> {results.netContents}
            </div>

            <div
              className={`result-row result-row-${getRowTone(
                results.governmentWarning
              )}`}
            >
              <strong>Government Warning:</strong> {results.governmentWarning}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;