import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";

// Expense Categories
const EXPENSE_CATEGORIES = [
  { value: "Food & Dining", icon: "🍔", keywords: ["restaurant", "cafe", "food", "dining", "pizza", "burger", "starbucks", "mcdonald", "kfc", "domino", "subway", "zomato", "swiggy"] },
  { value: "Travel", icon: "✈️", keywords: ["uber", "ola", "taxi", "flight", "hotel", "airbnb", "railway", "bus", "metro", "petrol", "diesel", "fuel"] },
  { value: "Shopping", icon: "🛍️", keywords: ["amazon", "flipkart", "mall", "store", "shop", "retail", "clothing", "fashion", "shoes"] },
  { value: "Entertainment", icon: "🎬", keywords: ["movie", "cinema", "netflix", "spotify", "game", "theatre", "concert", "ticket"] },
  { value: "Utilities", icon: "💡", keywords: ["electricity", "water", "gas", "internet", "wifi", "broadband", "phone", "mobile", "recharge"] },
  { value: "Groceries", icon: "🛒", keywords: ["grocery", "supermarket", "bigbasket", "dmart", "reliance", "fresh", "vegetables", "fruits"] },
  { value: "Health", icon: "💊", keywords: ["hospital", "doctor", "clinic", "pharmacy", "medicine", "medical", "apollo", "health", "diagnostic"] },
  { value: "General", icon: "📦", keywords: [] },
];

interface ReceiptScannerProps {
  onScanComplete: (data: {
    description: string;
    amount: string;
    category: string;
    rawText?: string;
  }) => void;
  onClose: () => void;
}

export default function ReceiptScanner({ onScanComplete, onClose }: ReceiptScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [ocrMethod, setOcrMethod] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = window.innerWidth < 640;

  // OCR.space API (FREE - 25,000 requests/month)
  const scanWithOCRSpace = async (imageData: string): Promise<string> => {
    try {
      setProgress(20);
      setOcrMethod("OCR.space API");

      // Remove data:image prefix
      const base64Data = imageData.split(",")[1];

      const formData = new FormData();
      formData.append("base64Image", `data:image/jpeg;base64,${base64Data}`);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");
      formData.append("detectOrientation", "true");
      formData.append("scale", "true");
      formData.append("OCREngine", "2"); // Engine 2 is more accurate

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          "apikey": "K87899142388957", // FREE API Key
        },
        body: formData,
      });

      setProgress(50);

      const result = await response.json();

      if (result.ParsedResults && result.ParsedResults.length > 0) {
        setProgress(70);
        return result.ParsedResults[0].ParsedText;
      }

      throw new Error("OCR.space failed");
    } catch (err) {
      console.error("OCR.space error:", err);
      throw err;
    }
  };

  // Tesseract.js v5 (Backup - FREE, Unlimited, Browser-based)
  const scanWithTesseract = async (imageData: string): Promise<string> => {
    try {
      setProgress(20);
      setOcrMethod("Tesseract.js (Local)");

      const worker = await createWorker("eng", 1, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setProgress(40 + (m.progress * 40));
          }
        },
      });
      
      setProgress(40);

      const { data } = await worker.recognize(imageData);

      setProgress(80);

      await worker.terminate();
      return data.text;
    } catch (err) {
      console.error("Tesseract error:", err);
      throw err;
    }
  };

  // Smart Text Parser - Extract amount, description, merchant
  const parseReceiptText = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    
    let amount = "";
    let merchantName = "";
    let category = "General";
    let items: string[] = [];

    // Find amounts (₹, Rs, INR patterns)
    const amountPatterns = [
      /(?:₹|Rs\.?|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi,
      /(?:total|amount|grand total|net amount|payable)[:\s]*(?:₹|Rs\.?|INR)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi,
      /(\d+(?:,\d+)*\.\d{2})/g,
    ];

    const amounts: number[] = [];
    
    for (const pattern of amountPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const numStr = match[1] || match[0];
        const num = parseFloat(numStr.replace(/,/g, "").replace(/[^\d.]/g, ""));
        if (!isNaN(num) && num > 0) {
          amounts.push(num);
        }
      }
    }

    // Get the largest amount (usually the total)
    if (amounts.length > 0) {
      amount = Math.max(...amounts).toString();
    }

    // Find merchant name (usually in first few lines)
    const firstLines = lines.slice(0, 5);
    for (const line of firstLines) {
      if (line.length > 3 && line.length < 50 && !line.match(/\d{10,}/)) {
        merchantName = line.trim();
        break;
      }
    }

    // Auto-detect category based on merchant name or content
    const textLower = text.toLowerCase();
    for (const cat of EXPENSE_CATEGORIES) {
      for (const keyword of cat.keywords) {
        if (textLower.includes(keyword)) {
          category = cat.value;
          break;
        }
      }
      if (category !== "General") break;
    }

    // Extract item descriptions (lines with amounts)
    for (const line of lines) {
      if (line.match(/\d+/) && !line.match(/\d{10,}/) && line.length > 5 && line.length < 100) {
        items.push(line.trim());
      }
    }

    return {
      amount,
      merchantName,
      category,
      items,
      confidence: amount ? 0.9 : 0.5,
    };
  };

  // Main scan function with fallback
  const scanReceipt = async () => {
    if (!selectedImage) return;

    setScanning(true);
    setError("");
    setProgress(0);
    setRawText("");

    try {
      let text = "";

      // Try OCR.space first
      try {
        setProgress(10);
        text = await scanWithOCRSpace(selectedImage);
      } catch (err) {
        console.log("OCR.space failed, trying Tesseract...");
        // Fallback to Tesseract
        text = await scanWithTesseract(selectedImage);
      }

      setProgress(90);
      setRawText(text);

      // Parse the text
      const parsed = parseReceiptText(text);

      setExtractedData({
        description: parsed.merchantName || "Receipt",
        amount: parsed.amount || "",
        category: parsed.category,
        items: parsed.items,
        rawText: text,
        confidence: parsed.confidence,
      });

      setProgress(100);
    } catch (err: any) {
      setError("Failed to scan receipt. Please try again or enter manually.");
      console.error("Scan error:", err);
    } finally {
      setScanning(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large. Please use an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setSelectedImage(imageData);
      setError("");
      setExtractedData(null);
      setRawText("");
    };
    reader.readAsDataURL(file);
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Use extracted data
  const handleUseData = () => {
    if (extractedData) {
      onScanComplete({
        description: extractedData.description,
        amount: extractedData.amount,
        category: extractedData.category,
        rawText: extractedData.rawText,
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 15,
          maxWidth: 600,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: isMobile ? 20 : 30,
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 24 }}>📸 Scan Receipt</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 28,
              cursor: "pointer",
              color: "#666",
            }}
          >
            ×
          </button>
        </div>

        {/* Input Method */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          style={{ display: "none" }}
        />

        {!selectedImage && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📷</div>
            <button
              onClick={handleCameraCapture}
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                color: "white",
                border: "none",
                padding: "15px 30px",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 15,
                width: "100%",
              }}
            >
              📸 Take Photo / Upload Receipt
            </button>
            <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
              Support: JPG, PNG • Max 5MB • FREE Unlimited Scans
            </p>
          </div>
        )}

        {/* Image Preview */}
        {selectedImage && !extractedData && (
          <div>
            <img
              src={selectedImage}
              alt="Receipt"
              style={{
                width: "100%",
                maxHeight: 300,
                objectFit: "contain",
                borderRadius: 10,
                marginBottom: 20,
                border: "2px solid #e0e0e0",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={scanReceipt}
                disabled={scanning}
                style={{
                  flex: 1,
                  background: scanning
                    ? "#ccc"
                    : "linear-gradient(135deg, #16a34a, #059669)",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: scanning ? "not-allowed" : "pointer",
                }}
              >
                {scanning ? `Scanning... ${progress}%` : "🔍 Scan Receipt"}
              </button>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setError("");
                }}
                disabled={scanning}
                style={{
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: scanning ? "not-allowed" : "pointer",
                }}
              >
                ↻ Retake
              </button>
            </div>

            {/* Progress Bar */}
            {scanning && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 5 }}>
                  {ocrMethod} - {progress}%
                </div>
                <div
                  style={{
                    height: 8,
                    backgroundColor: "#e0e0e0",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #667eea, #764ba2)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extracted Data */}
        {extractedData && (
          <div>
            <div
              style={{
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                padding: 15,
                borderRadius: 10,
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
                ✅ Receipt Scanned Successfully!
              </div>
              <div style={{ fontSize: 13, color: "#065f46" }}>
                Confidence: {(extractedData.confidence * 100).toFixed(0)}% • {ocrMethod}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: "block" }}>
                Merchant / Description:
              </label>
              <input
                type="text"
                value={extractedData.description}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, description: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 5,
                  border: "2px solid #16a34a",
                  fontSize: 16,
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: "block" }}>
                Amount (₹):
              </label>
              <input
                type="number"
                value={extractedData.amount}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, amount: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 5,
                  border: "2px solid #16a34a",
                  fontSize: 16,
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: "block" }}>
                Category:
              </label>
              <select
                value={extractedData.category}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, category: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 5,
                  border: "2px solid #16a34a",
                  fontSize: 16,
                }}
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Items Found */}
            {extractedData.items && extractedData.items.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: "block" }}>
                  Items Found:
                </label>
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 5,
                    padding: 10,
                    maxHeight: 100,
                    overflowY: "auto",
                    fontSize: 13,
                  }}
                >
                  {extractedData.items.map((item: string, idx: number) => (
                    <div key={idx} style={{ marginBottom: 5 }}>
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Text (Collapsible) */}
            {rawText && (
              <details style={{ marginBottom: 20 }}>
                <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                  📄 View Raw Text
                </summary>
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 5,
                    padding: 10,
                    marginTop: 10,
                    maxHeight: 150,
                    overflowY: "auto",
                    fontSize: 12,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {rawText}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleUseData}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #16a34a, #059669)",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✓ Use This Data
              </button>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setExtractedData(null);
                  setRawText("");
                }}
                style={{
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ↻ Scan Another
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              padding: 15,
              borderRadius: 8,
              marginTop: 20,
              fontSize: 14,
            }}
          >
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}