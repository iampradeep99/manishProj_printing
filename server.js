// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.text({ type: "*/*" })); // Accept raw PRN

app.post("/print-label", (req, res) => {
  const prnContent = req.body;
  const tempFile = path.join(__dirname, "label.prn");

  fs.writeFile(tempFile, prnContent, (err) => {
    if (err) {
      console.error("File write error", err);
      return res.status(500).send("Failed to write PRN file.");
    }

    // Windows print command (change as needed)
    const command = `copy /B "${tempFile}" "\\\\localhost\\Datamax-O'Neil E-4204B Mark III (Copy 1)"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Print command failed:", error);
        return res.status(500).send("Print command failed.");
      }
      res.send("Printed successfully.");
    });
  });
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});

// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const { exec } = require("child_process");
// const { v4: uuidv4 } = require("uuid");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// const port = 3001;
// app.use(express.json());
// function wrapText(text, maxLength = 40) {
//   if (!text) return [];

//   const words = text.split(" ");
//   const lines = [];
//   let currentLine = "";

//   for (const word of words) {
//     // If adding the next word would exceed the max length
//     if ((currentLine + word).length > maxLength) {
//       lines.push(currentLine.trim()); // Push current line
//       currentLine = word + " "; // Start new line
//     } else {
//       currentLine += word + " ";
//     }
//   }

//   if (currentLine.trim()) {
//     lines.push(currentLine.trim()); // Add the last line
//   }

//   return lines;
// }
// const getBarcodeBYWidth = (barcodeData, maxBarcodeWidthDots = 400) => {
//   const length = barcodeData.length;
//   const moduleWidth = Math.floor(maxBarcodeWidthDots / (length * 11)); // 11 dots per character (approx)
//   return Math.max(1, Math.min(moduleWidth, 5)); // Clamp between 1 and 5 for Zebra
// };
// const getBarcodeModuleWidth = (barcodeData, labelWidthDots = 400) => {
//   const approxModules = barcodeData.length * 11;
//   const moduleWidth = Math.floor(labelWidthDots / approxModules);
//   return Math.max(1, Math.min(moduleWidth, 5)); // clamp to 1–5
// };

// app.post("/print-label", async (req, res) => {
//   try {
//     const { data } = req.body;

//     if (!Array.isArray(data) || data.length === 0) {
//       return res.status(400).json({ error: "No label data provided" });
//     }

//     let prnContent = "";

//     // data.forEach((item) => {
//     //   prnContent += `^XA
//     //   ^FO140,20^A0N,17,17^FD${item.division}^FS
//     //   ^FO250,20^A0N,17,17^FD${item.deptClass.substring(0, 20)}^FS
//     //   ^FO60,50^BCN,70,190,N,N^FD${item.itemSupplier}^FS
//     //   ^FO320,127^A0N,17,17^FD${item.supCode}^FS
//     //   ^FO140,150^A0N,19,19^FD${item.itemShortDescription}^FS
//     //   ^FO140,170^A0N,15,15^FD${item.Maximum}^FS
//     //   ^FO140,190^A0N,30,30^FD${item.price}^FS
//     //   ^FO140,220^A0N,19,Y^FDColor: ${item.color}^FS
//     //   ^FO260,220^A0N,19,Y^FDSize: ${item.size}^FS
//     // ^XZ`;
//     // });

//     // Write the content to a temp .prn file
//     // ^FO60,50^BCN,70,190,N,N^FD${item.itemSupplier || ""}^FS

//     data.forEach((item) => {
//       const addressLines = wrapText(item.address, 40); // Wrap address to ~40 chars
//       const moduleWidth = getBarcodeModuleWidth("1000013292556", 400);
//       const maxLines = 3;
//       const startY = 260; // Starting Y for address lines
//       const lineHeight = 20;

//       prnContent += `^XA
//               ^FO140,20^A0N,17,17^FD${item.division || ""}^FS
//               ^FO250,20^A0N,17,17^FD${(item.deptClass || "").substring(
//                 0,
//                 20
//               )}^FS
// prnContent +=
// ^FO120,50
// ^BY${moduleWidth},3.0,80
// ^BCN,80,Y,N,N
// ^FD1000013292556^FS
//               ^FO320,127^A0N,17,17^FD${item.supCode || ""}^FS
//               ^FO140,150^A0N,19,19^FD${item.itemShortDescription || ""}^FS
//               ^FO140,170^A0N,15,15^FD${item.Maximum || ""}^FS
//               ^FO140,190^A0N,30,30^FD${item.price || ""}^FS
//               ^FO140,220^A0N,15,15^FD${item.Inclusive || ""}^FS
//               ^FO138,240^A0N,17,Y^FD${item.companyName || ""}^FS
//         `;

//       addressLines.slice(0, maxLines).forEach((line, i) => {
//         const y = startY + i * lineHeight;
//         prnContent += `^FO140,${y}^A0N,18,Y^FD${line}^FS\n`;
//       });

//       const colorY =
//         startY + Math.min(addressLines.length, maxLines) * lineHeight;

//       prnContent += `
//               ^FO140,${colorY}^A0N,19,Y^FDColor: ${item.color || ""}^FS
//               ^FO140,${colorY + lineHeight}^A0N,19,Y^FDSize: ${
//         item.size || ""
//       }^FS
//               ^FO140,${colorY + lineHeight * 2}^A0N,19,Y^FDQty: ${
//         item.Qty || ""
//       }^FS
//               ^XZ\n`;
//     });

//     const tempDir = path.join(__dirname, "temp");
//     if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
//     const prnFile = `label_${uuidv4()}.prn`;
//     const prnPath = path.join(tempDir, prnFile);

//     fs.writeFileSync(prnPath, prnContent, "utf8");

//     // Your printer network share
//     const printerShare = "\\\\196.162.89.137\\datamax";

//     // Use Windows 'copy' command to send the prn file to the printer share
//     exec(`copy /b "${prnPath}" "${printerShare}"`, (error, stdout, stderr) => {
//       // Clean up temp file
//       fs.unlink(prnPath, () => {});

//       if (error) {
//         console.error("Print error:", stderr || error);
//         return res
//           .status(500)
//           .json({ error: "Print failed", details: stderr || error.message });
//       }
//       res.json({ message: "Print successful", output: stdout.trim() });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ error: "Server crashed", details: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`Label print API running at http://localhost:${port}`);
// });

// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const { exec } = require("child_process");
// const { v4: uuidv4 } = require("uuid");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// const port = 3001;
// app.use(express.json());
// const bwipjs = require("bwip-js");
// function wrapText(text, maxLength = 40) {
//   if (!text) return [];

//   const words = text.split(" ");
//   const lines = [];
//   let currentLine = "";

//   for (const word of words) {
//     // If adding the next word would exceed the max length
//     if ((currentLine + word).length > maxLength) {
//       lines.push(currentLine.trim()); // Push current line
//       currentLine = word + " "; // Start new line
//     } else {
//       currentLine += word + " ";
//     }
//   }

//   if (currentLine.trim()) {
//     lines.push(currentLine.trim()); // Add the last line
//   }

//   return lines;
// }

// function generateBarcodeBase64(text) {
//   return new Promise((resolve, reject) => {
//     bwipjs.toBuffer(
//       {
//         bcid: "code128",
//         text,
//         scale: 2,
//         height: 10,
//         includetext: false,
//       },
//       (err, pngBuffer) => {
//         if (err) return reject(err);
//         resolve(pngBuffer.toString("base64"));
//       }
//     );
//   });
// }
// const base64ToHexZpl = (base64) => {
//   const raw = Buffer.from(base64, "base64");
//   let hex = "";
//   for (let i = 0; i < raw.length; i++) {
//     hex += raw[i].toString(16).padStart(2, "0").toUpperCase();
//   }
//   return hex;
// };

// app.post("/print-label", async (req, res) => {
//   const barcodeValue = "1000014276562";

//   bwipjs.toBuffer(
//     {
//       bcid: "code128", // Barcode type
//       text: barcodeValue, // Text to encode
//       scale: 4, // 3x scaling factor
//       height: 10, // Bar height in millimeters
//       includetext: true, // Show human-readable text
//       textxalign: "center", // Centered text
//     },
//     function (err, png) {
//       if (err) {
//         console.error("Barcode generation error:", err);
//       } else {
//         // Convert image buffer to base64
//         const base64Image = png.toString("base64");
//         console.log("\n📦 Base64 Barcode Image:\n");
//         console.log("data:image/png;base64," + base64Image);

//         // Optional: write to file
//         fs.writeFileSync("barcode.png", png);
//         console.log("\n🖼️  Saved barcode.png in current directory");
//       }
//     }
//   );

//   try {
//     const { data } = req.body;
//     if (!Array.isArray(data) || data.length === 0) {
//       return res.status(400).json({ error: "No label data provided" });
//     }

//     let prnContent = "";

//     for (const item of data) {
//       const barcodeText = item.itemSupplier || "1000014356680";

//       // Generate barcode image and convert to ZPL hex
//       const base64 = await generateBarcodeBase64(barcodeText);
//       const hex = base64ToHexZpl(base64);
//       const bytesPerRow = 200; // Approximate width in bytes
//       const totalBytes = hex.length / 2;
//       const totalRows = Math.ceil(totalBytes / bytesPerRow);

//       // ZPL image header (E: is temporary memory)
//       const imageName = "R:BCLABEL.GRF";
//       const zplImage = `~DG${imageName},${totalBytes},${bytesPerRow},${hex}`;

//       const addressLines = wrapText(item.address, 40);
//       const maxLines = 3;
//       const startY = 260;
//       const lineHeight = 20;
//       console.log(zplImage, "object");
//       prnContent += `^XA
//       ${zplImage}
//       ^FO140,20^A0N,17,17^FD${item.division || ""}^FS
//       ^FO250,20^A0N,17,17^FD${(item.deptClass || "").substring(0, 20)}^FS
//       ^FO70,30^XGR:BCLABEL.GRF,1,1^FS
//       ^FO320,127^A0N,17,17^FD${item.supCode || ""}^FS
//       ^FO140,150^A0N,19,19^FD${item.itemShortDescription || ""}^FS
//       ^FO140,170^A0N,15,15^FD${item.Maximum || ""}^FS
//       ^FO140,190^A0N,30,30^FD${item.price || ""}^FS
//       ^FO140,220^A0N,15,15^FD${item.Inclusive || ""}^FS
//       ^FO138,240^A0N,17,Y^FD${item.companyName || ""}^FS
//       `;

//       addressLines.slice(0, maxLines).forEach((line, i) => {
//         const y = startY + i * lineHeight;
//         prnContent += `^FO140,${y}^A0N,18,Y^FD${line}^FS\n`;
//       });

//       const colorY =
//         startY + Math.min(addressLines.length, maxLines) * lineHeight;

//       prnContent += `
//       ^FO140,${colorY}^A0N,19,Y^FDColor: ${item.color || ""}^FS
//       ^FO140,${colorY + lineHeight}^A0N,19,Y^FDSize: ${item.size || ""}^FS
//       ^FO140,${colorY + lineHeight * 2}^A0N,19,Y^FDQty: ${item.Qty || ""}^FS
//       ^XZ\n`;
//     }

//     const tempDir = path.join(__dirname, "temp");
//     if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
//     const prnFile = `label_${uuidv4()}.prn`;
//     const prnPath = path.join(tempDir, prnFile);

//     fs.writeFileSync(prnPath, prnContent, "utf8");

//     const printerShare = "\\\\192.168.0.150\\datamax";

//     exec(`copy /b "${prnPath}" "${printerShare}"`, (error, stdout, stderr) => {
//       fs.unlink(prnPath, () => {});
//       if (error) {
//         console.error("Print error:", stderr || error);
//         return res
//           .status(500)
//           .json({ error: "Print failed", details: stderr || error.message });
//       }
//       res.json({ message: "Print successful", output: stdout.trim() });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ error: "Server crashed", details: error.message });
//   }
// });
// app.listen(port, () => {
//   console.log(`Label print API running at http://localhost:${port}`);
// });

// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const { exec } = require("child_process");
// const { v4: uuidv4 } = require("uuid");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// const port = 3001;
// app.use(express.json());

// function wrapText(text, maxLength = 40) {
//   if (!text) return [];

//   const words = text.split(" ");
//   const lines = [];
//   let currentLine = "";

//   for (const word of words) {
//     if ((currentLine + word).length > maxLength) {
//       lines.push(currentLine.trim());
//       currentLine = word + " ";
//     } else {
//       currentLine += word + " ";
//     }
//   }

//   if (currentLine.trim()) {
//     lines.push(currentLine.trim());
//   }

//   return lines;
// }

// app.post("/print-label", async (req, res) => {
//   try {
//     const { data } = req.body;

//     if (!Array.isArray(data) || data.length === 0) {
//       return res.status(400).json({ error: "No label data provided" });
//     }

//     let prnContent = `\x02\x1BC\n\x02\x1BE3\n`; // <STX><ESC>C & <STX><ESC>E3: start & set label format

//     data.forEach((item) => {
//       const addressLines = wrapText(item.address, 40);
//       const maxLines = 3;
//       const startY = 260;
//       const lineHeight = 20;

//       prnContent += `\x02L\n`; // Start label format

//       // Text blocks
//       //   prnContent += `121100020001${item.division || ""}\n`;
//       //   prnContent += `121100030001${(item.deptClass || "").substring(0, 20)}\n`;
//       prnContent += `1211000800011000013292556\n`;
//       //   prnContent += `121100100001${item.itemShortDescription || ""}\n`;
//       //   prnContent += `121100120001${item.Maximum || ""}\n`;
//       //   prnContent += `121100140001${item.price || ""}\n`;
//       //   prnContent += `121100160001${item.Inclusive || ""}\n`;
//       //   prnContent += `121100180001${item.companyName || ""}\n`;

//       // Address lines
//       //   addressLines.slice(0, maxLines).forEach((line, i) => {
//       //     const y = startY + i * lineHeight;
//       //     prnContent += `1211${String(200 + i * 2).padStart(
//       //       4,
//       //       "0"
//       //     )}0001${line}\n`;
//       //   });

//       //   const colorY =
//       //     startY + Math.min(addressLines.length, maxLines) * lineHeight;
//       //   prnContent += `1211${colorY.toString().padStart(4, "0")}0001Color: ${
//       //     item.color || ""
//       //   }\n`;
//       //   prnContent += `1211${(colorY + lineHeight)
//       //     .toString()
//       //     .padStart(4, "0")}0001Size: ${item.size || ""}\n`;
//       //   prnContent += `1211${(colorY + lineHeight * 2)
//       //     .toString()
//       //     .padStart(4, "0")}0001Qty: ${item.Qty || ""}\n`;

//       //   // Barcode (CODE128: '1' type, H=100 dots tall, W=2, position X=020, Y=060)
//       //   prnContent += `191100060020${item.itemSupplier || "1000013292556"}\n`;

//       prnContent += `E\n`; // End label
//     });

//     const tempDir = path.join(__dirname, "temp");
//     if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

//     const prnFile = `label_${uuidv4()}.prn`;
//     const prnPath = path.join(tempDir, prnFile);
//     fs.writeFileSync(prnPath, prnContent, "utf8");

//     const printerShare = "\\\\192.168.0.150\\datamax";
//     exec(`copy /b "${prnPath}" "${printerShare}"`, (error, stdout, stderr) => {
//       fs.unlink(prnPath, () => {});

//       if (error) {
//         console.error("Print error:", stderr || error);
//         return res
//           .status(500)
//           .json({ error: "Print failed", details: stderr || error.message });
//       }

//       res.json({ message: "Print successful", output: stdout.trim() });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ error: "Server crashed", details: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`🖨️ DPL label print API running at http://localhost:${port}`);
// });

// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const { exec } = require("child_process");
// const { v4: uuidv4 } = require("uuid");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// const port = 3001;
// app.use(express.json());

// app.post("/print-label", async (req, res) => {
//   try {
//     const { data } = req.body;

//     if (!Array.isArray(data) || data.length === 0) {
//       return res.status(400).json({ error: "No label data provided" });
//     }

//     let zplContent = "";

//     data.forEach((item) => {
//       zplContent += `
// ^XA
// ^FO50,30^A0N,30,30^FDProduct: Manish^FS
// ^FO50,70^A0N,30,30^FDPrice: 500^FS
// ^FO50,120^BY2,2,70
// ^BCN,70,Y,N,N
// ^FD1000014276562^FS
// ^XZ
// `;
//     });

//     const tempDir = path.join(__dirname, "temp");
//     if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

//     const prnFile = `label_${uuidv4()}.prn`;
//     const prnPath = path.join(tempDir, prnFile);

//     fs.writeFileSync(prnPath, zplContent, "utf8");

//     const printerShare = "\\\\192.168.0.150\\datamax";
//     exec(`copy /b "${prnPath}" "${printerShare}"`, (error, stdout, stderr) => {
//       fs.unlink(prnPath, () => {});
//       if (error) {
//         console.error("Print error:", stderr || error);
//         return res
//           .status(500)
//           .json({ error: "Print failed", details: stderr || error.message });
//       }
//       res.json({ message: "Print successful", output: stdout.trim() });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ error: "Server crashed", details: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`🖨️ ZPL label print API running at http://localhost:${port}`);
// });

// const express = require("express");
// const fs = require("fs-extra");
// const path = require("path");
// const { exec } = require("child_process");
// const { createCanvas, loadImage } = require("canvas");
// const bwipjs = require("bwip-js");
// const { v4: uuidv4 } = require("uuid");
// const cors = require("cors");

// const app = express();
// const port = 3001;

// app.use(cors());
// app.use(express.json());
// app.use(express.static("output"));

// // --- Utility functions ---
// function wrapText(text, maxLength = 40) {
//   if (!text) return [];
//   const words = text.split(" ");
//   const lines = [];
//   let currentLine = "";

//   for (const word of words) {
//     if ((currentLine + word).length > maxLength) {
//       lines.push(currentLine.trim());
//       currentLine = word + " ";
//     } else {
//       currentLine += word + " ";
//     }
//   }
//   if (currentLine.trim()) lines.push(currentLine.trim());
//   return lines;
// }

// const getBarcodeModuleWidth = (barcodeData, labelWidthDots = 400) => {
//   const approxModules = barcodeData.length * 11;
//   const moduleWidth = Math.floor(labelWidthDots / approxModules);
//   return Math.max(1, Math.min(moduleWidth, 5)); // Clamp between 1 and 5
// };

// // --- /render-barcode route ---
// app.post("/render-barcode", async (req, res) => {
//   const { code = "1000013292556", info = "" } = req.body;

//   try {
//     const canvasWidth = 170;
//     const canvasHeight = 40;
//     const barcodeHeight = 40;
//     const marginTop = 0;
//     const marginCodeFromBarcode = 4;
//     const marginInfoFromCode = 4;

//     const canvas = createCanvas(canvasWidth, canvasHeight);
//     const ctx = canvas.getContext("2d");

//     ctx.fillStyle = "#FFFFFF";
//     ctx.fillRect(0, 0, canvasWidth, canvasHeight);

//     // Generate barcode at full scale
//     const png = await bwipjs.toBuffer({
//       bcid: "code128",
//       text: code,
//       includetext: false,
//       scale: 2, // High quality base
//       height: barcodeHeight,
//     });

//     const barcodeImg = await loadImage(png);

//     // Resize to visually mimic scale 1.8 or 1.9
//     const targetBarcodeWidth = barcodeImg.width * 0.6; // 90% of full scale
//     const targetBarcodeHeight = barcodeHeight;

//     const xBarcode = (canvasWidth - targetBarcodeWidth) / 2;
//     ctx.drawImage(
//       barcodeImg,
//       0,
//       0,
//       barcodeImg.width,
//       barcodeImg.height, // source
//       xBarcode,
//       marginTop, // destination x/y
//       targetBarcodeWidth,
//       targetBarcodeHeight // destination size
//     );

//     ctx.fillStyle = "#000000";
//     ctx.textAlign = "center";

//     ctx.font = "7pt Courier New";
//     const codeTextY = marginTop + barcodeHeight + marginCodeFromBarcode;
//     // ctx.fillText(code, canvasWidth / 2, codeTextY); // disabled as in your code

//     ctx.font = "8pt Arial";
//     const infoTextY = codeTextY + 10 + marginInfoFromCode;
//     ctx.fillText(info, canvasWidth / 2, infoTextY);

//     const outputDir = path.join(__dirname, "output");
//     await fs.ensureDir(outputDir);
//     const filename = `barcode_${uuidv4()}.png`;
//     const filepath = path.join(outputDir, filename);

//     const out = fs.createWriteStream(filepath);
//     const stream = canvas.createPNGStream();
//     stream.pipe(out);

//     out.on("finish", () => {
//       res.json({ success: true, imageUrl: `/${filename}` });
//     });
//   } catch (error) {
//     console.error("Rendering failed:", error);
//     res.status(500).json({ error: "Failed to render barcode" });
//   }
// });

// // --- /print-label route ---
// app.post("/print-label", async (req, res) => {
//   try {
//     const { data } = req.body;

//     if (!Array.isArray(data) || data.length === 0) {
//       return res.status(400).json({ error: "No label data provided" });
//     }

//     let prnContent = "";

//     data.forEach((item) => {
//       const addressLines = wrapText(item.address, 40);
//       const moduleWidth = getBarcodeModuleWidth("1000013292556", 400);
//       const maxLines = 3;
//       const startY = 260;
//       const lineHeight = 20;

//       prnContent += `^XA
// ^FO140,20^A0N,17,17^FD${item.division || ""}^FS
// ^FO250,20^A0N,17,17^FD${(item.deptClass || "").substring(0, 20)}^FS
// ^FO120,50
// ^BY${moduleWidth},3.0,80
// ^BCN,80,Y,N,N
// ^FD1000013292556^FS
// ^FO320,127^A0N,17,17^FD${item.supCode || ""}^FS
// ^FO140,150^A0N,19,19^FD${item.itemShortDescription || ""}^FS
// ^FO140,170^A0N,15,15^FD${item.Maximum || ""}^FS
// ^FO140,190^A0N,30,30^FD${item.price || ""}^FS
// ^FO140,220^A0N,15,15^FD${item.Inclusive || ""}^FS
// ^FO138,240^A0N,17,Y^FD${item.companyName || ""}^FS
// `;

//       addressLines.slice(0, maxLines).forEach((line, i) => {
//         const y = startY + i * lineHeight;
//         prnContent += `^FO140,${y}^A0N,18,Y^FD${line}^FS\n`;
//       });

//       const colorY =
//         startY + Math.min(addressLines.length, maxLines) * lineHeight;

//       prnContent += `^FO140,${colorY}^A0N,19,Y^FDColor: ${item.color || ""}^FS
// ^FO140,${colorY + lineHeight}^A0N,19,Y^FDSize: ${item.size || ""}^FS
// ^FO140,${colorY + lineHeight * 2}^A0N,19,Y^FDQty: ${item.Qty || ""}^FS
// ^XZ\n`;
//     });

//     const tempDir = path.join(__dirname, "temp");
//     await fs.ensureDir(tempDir);
//     const prnFile = `label_${uuidv4()}.prn`;
//     const prnPath = path.join(tempDir, prnFile);

//     await fs.writeFile(prnPath, prnContent, "utf8");

//     const printerShare = "\\\\196.162.89.137\\datamax";

//     exec(`copy /b "${prnPath}" "${printerShare}"`, (error, stdout, stderr) => {
//       // fs.unlink(prnPath, () => {});
//       // if (error) {
//       //   console.error("Print error:", stderr || error);
//       //   return res.status(500).json({
//       //     error: "Print failed",
//       //     details: stderr || error.message,
//       //   });
//       // }
//       // res.json({ message: "Print successful", output: stdout.trim() });
//       return res.json({ message: "PRN file generated", filePath: prnPath });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ error: "Server crashed", details: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

// const express = require("express");
// const fs = require("fs-extra");
// const path = require("path");
// const { exec } = require("child_process");
// const { createCanvas, loadImage } = require("canvas");
// const bwipjs = require("bwip-js");
// const { v4: uuidv4 } = require("uuid");
// const zlib = require("zlib");
// const cors = require("cors");

// const app = express();
// const port = 3001;

// app.use(cors());
// app.use(express.json());
// app.use(express.static("output"));

// /**
//  * Helper to wrap address text
//  */
// function wrapText(text, maxLength = 40) {
//   if (!text) return [];
//   const words = text.split(" ");
//   const lines = [];
//   let current = "";

//   for (let word of words) {
//     if ((current + word).length > maxLength) {
//       lines.push(current.trim());
//       current = word + " ";
//     } else {
//       current += word + " ";
//     }
//   }
//   if (current.trim()) lines.push(current.trim());
//   return lines;
// }

// /**
//  * Helper: render barcode to PNG and return ZPL `~DG` + `^XG`
//  */

// /**
//  * Converts barcode image to 1-bit ZPL (~DG format)
//  */
// async function renderBarcodeToZPL(
//   code = "1000013292556",
//   imageName = "BARCODE"
// ) {
//   const width = 170;
//   const height = 80;

//   // Create barcode buffer with bwip-js
//   const pngBuffer = await bwipjs.toBuffer({
//     bcid: "code128",
//     text: code,
//     scale: 2,
//     height,
//     includetext: false,
//     paddingwidth: 0,
//     paddingheight: 0,
//   });

//   const barcodeImage = await loadImage(pngBuffer);
//   const canvas = createCanvas(width, height);
//   const ctx = canvas.getContext("2d");

//   ctx.fillStyle = "white";
//   ctx.fillRect(0, 0, width, height);

//   // Draw barcode centered
//   ctx.drawImage(
//     barcodeImage,
//     0,
//     0,
//     barcodeImage.width,
//     barcodeImage.height,
//     0,
//     0,
//     width,
//     height
//   );

//   // Convert to monochrome bitmap (1-bit per pixel)
//   const imageData = ctx.getImageData(0, 0, width, height);
//   const monoBytes = [];

//   for (let y = 0; y < height; y++) {
//     let row = "";
//     for (let x = 0; x < width; x += 8) {
//       let byte = 0;
//       for (let b = 0; b < 8; b++) {
//         const i = (y * width + x + b) * 4;
//         const r = imageData.data[i];
//         const g = imageData.data[i + 1];
//         const bVal = imageData.data[i + 2];
//         const brightness = (r + g + bVal) / 3;
//         if (brightness < 128) {
//           byte |= 1 << (7 - b);
//         }
//       }
//       row += byte.toString(16).padStart(2, "0").toUpperCase();
//     }
//     monoBytes.push(row);
//   }

//   const totalBytes = monoBytes.length * (width / 8);
//   const bytesPerRow = width / 8;
//   const zpl = `~DG${imageName}.GRF,${totalBytes},${bytesPerRow},${monoBytes.join(
//     "\n"
//   )}`;
//   return zpl;
// }

// // --- Print label route ---
// app.post("/print-label", async (req, res) => {
//   try {
//     const { data } = req.body;
//     if (!Array.isArray(data) || data.length === 0) {
//       return res.status(400).json({ error: "No label data provided" });
//     }

//     const zplImageBlock = await renderBarcodeToZPL("1000013292556");

//     let prnContent = `${zplImageBlock}\n`;

//     data.forEach((item) => {
//       const addressLines = wrapText(item.address, 40);
//       const maxLines = 3;
//       const startY = 260;
//       const lineHeight = 20;

//       prnContent += `^XA
// ^FO140,20^A0N,17,17^FD${item.division || ""}^FS
// ^FO250,20^A0N,17,17^FD${(item.deptClass || "").substring(0, 20)}^FS
// ^FO120,50^XGBARCODE.GRF,1,1^FS
// ^FO320,127^A0N,17,17^FD${item.supCode || ""}^FS
// ^FO140,150^A0N,19,19^FD${item.itemShortDescription || ""}^FS
// ^FO140,170^A0N,15,15^FD${item.Maximum || ""}^FS
// ^FO140,190^A0N,30,30^FD${item.price || ""}^FS
// ^FO140,220^A0N,15,15^FD${item.Inclusive || ""}^FS
// ^FO138,240^A0N,17,Y^FD${item.companyName || ""}^FS
// `;

//       addressLines.slice(0, maxLines).forEach((line, i) => {
//         const y = startY + i * lineHeight;
//         prnContent += `^FO140,${y}^A0N,18,Y^FD${line}^FS\n`;
//       });

//       const colorY =
//         startY + Math.min(addressLines.length, maxLines) * lineHeight;

//       prnContent += `^FO140,${colorY}^A0N,19,Y^FDColor: ${item.color || ""}^FS
// ^FO140,${colorY + lineHeight}^A0N,19,Y^FDSize: ${item.size || ""}^FS
// ^FO140,${colorY + lineHeight * 2}^A0N,19,Y^FDQty: ${item.Qty || ""}^FS
// ^XZ\n`;
//     });

//     const tempDir = path.join(__dirname, "temp");
//     await fs.ensureDir(tempDir);
//     const prnFile = `label_${uuidv4()}.prn`;
//     const prnPath = path.join(tempDir, prnFile);
//     await fs.writeFile(prnPath, prnContent, "utf8");

//     const printerShare = "\\\\192.168.0.150\\datamax";

//     exec(`copy /b "${prnPath}" "${printerShare}"`, (error, stdout, stderr) => {
//       if (error) {
//         return res.status(500).json({
//           error: "Print failed",
//           details: stderr || error.message,
//         });
//       }
//       res.json({ message: "Print successful", filePath: prnPath });
//     });
//   } catch (error) {
//     console.error("Print error:", error);
//     res.status(500).json({ error: "Server crashed", details: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

// const express = require("express");
// const fs = require("fs-extra");
// const path = require("path");
// const { exec } = require("child_process");
// const { createCanvas, loadImage } = require("canvas");
// const bwipjs = require("bwip-js");
// const { v4: uuidv4 } = require("uuid");
// const cors = require("cors");

// const app = express();
// const port = 3001;

// app.use(cors());
// app.use(express.json());

// async function renderBarcodeToZPL(code, imageName = "BARCODE") {
//   const width = 256; // divisible by 8
//   const height = 60;

//   // Generate barcode PNG with bwip-js
//   const pngBuffer = await bwipjs.toBuffer({
//     bcid: "code128",
//     text: code,
//     scale: 2,
//     height,
//     includetext: false,
//     paddingwidth: 0,
//     paddingheight: 0,
//     backgroundcolor: "FFFFFF",
//   });

//   const barcodeImage = await loadImage(pngBuffer);
//   const canvas = createCanvas(width, height);
//   const ctx = canvas.getContext("2d");

//   // White background
//   ctx.fillStyle = "white";
//   ctx.fillRect(0, 0, width, height);

//   // Draw barcode centered horizontally and vertically (optional)
//   const xOffset = (width - barcodeImage.width) / 2;
//   const yOffset = (height - barcodeImage.height) / 2;

//   ctx.drawImage(barcodeImage, xOffset, yOffset);

//   const imageData = ctx.getImageData(0, 0, width, height);
//   const bytesPerRow = width / 8; // 21 bytes
//   const totalBytes = bytesPerRow * height;
//   const monoBytes = [];

//   for (let y = 0; y < height; y++) {
//     let rowHex = "";
//     for (let x = 0; x < bytesPerRow; x++) {
//       let byte = 0;
//       for (let bit = 0; bit < 8; bit++) {
//         const px = x * 8 + bit;
//         const idx = (y * width + px) * 4;
//         const r = imageData.data[idx];
//         const g = imageData.data[idx + 1];
//         const b = imageData.data[idx + 2];
//         const brightness = (r + g + b) / 3;
//         if (brightness < 128) {
//           byte |= 1 << (7 - bit);
//         }
//       }
//       rowHex += byte.toString(16).padStart(2, "0").toUpperCase();
//     }
//     monoBytes.push(rowHex);
//   }

//   const zpl = `~DGR:${imageName}.GRF,${totalBytes},${bytesPerRow},\n${monoBytes.join(
//     "\n"
//   )}\n`;

//   return zpl;
// }

// /**
//  * Generate full ZPL label using barcode + code + info,
//  * matching your C# layout with margins and fonts.
//  */

// /**
//  * Complete POST /print-label endpoint
//  * Accepts JSON { code: string, info: string }
//  * Generates ZPL and sends to printer.
//  */
// app.post("/print-label", async (req, res) => {
//   try {
//     const { code = "1000013292552", info = "1000013292552" } = req.body;

//     // Generate barcode image ZPL block with your code
//     const zplImageBlock = await renderBarcodeToZPL(code, "BARCODE");

//     // Compose the full label ZPL
//     // The barcode hex data is already included in zplImageBlock
//     const labelZPL = `
// ^XA
// ${zplImageBlock}
// ^FO140,50^XGR:BARCODE.GRF,1,1^FS

// ^XZ
// `;

//     // Save the ZPL to a temporary file
//     const tempDir = path.join(__dirname, "temp");
//     await fs.ensureDir(tempDir);
//     const prnFile = `label_${uuidv4()}.prn`;
//     const prnPath = path.join(tempDir, prnFile);
//     await fs.writeFile(prnPath, labelZPL, "utf8");

//     // Your printer UNC path, adjust accordingly
//     const printerShare = "\\\\192.168.0.150\\datamax";

//     // Print by copying the file to the printer share
//     exec(`copy /b "${prnPath}" "${printerShare}"`, (error, stdout, stderr) => {
//       if (error) {
//         console.error("Print error:", error, stderr);
//         return res.status(500).json({
//           error: "Print failed",
//           details: stderr || error.message,
//         });
//       }
//       res.json({ message: "Print successful", filePath: prnPath });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ error: "Server crashed", details: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

// const express = require("express");
// const fs = require("fs-extra");
// const path = require("path");
// const { exec } = require("child_process");
// const { createCanvas, loadImage } = require("canvas");
// const bwipjs = require("bwip-js");
// const { v4: uuidv4 } = require("uuid");
// const cors = require("cors");

// const app = express();
// const port = 3001;

// app.use(cors());
// app.use(express.json());
// function wrapText(text, maxLength = 40) {
//   if (!text) return [];

//   const words = text.split(" ");
//   const lines = [];
//   let currentLine = "";

//   for (const word of words) {
//     // If adding the next word would exceed the max length
//     if ((currentLine + word).length > maxLength) {
//       lines.push(currentLine.trim()); // Push current line
//       currentLine = word + " "; // Start new line
//     } else {
//       currentLine += word + " ";
//     }
//   }

//   if (currentLine.trim()) {
//     lines.push(currentLine.trim()); // Add the last line
//   }

//   return lines;
// }
// async function renderBarcodeToZPL(code, imageName = "BARCODE") {
//   const width = 256; // divisible by 8
//   const height = 60;

//   // Generate barcode PNG with bwip-js
//   const pngBuffer = await bwipjs.toBuffer({
//     bcid: "code128",
//     text: code,
//     scale: 2,
//     height,
//     includetext: false,
//     paddingwidth: 0,
//     paddingheight: 0,
//     backgroundcolor: "FFFFFF",
//   });

//   const barcodeImage = await loadImage(pngBuffer);
//   const canvas = createCanvas(width, height);
//   const ctx = canvas.getContext("2d");

//   // White background
//   ctx.fillStyle = "white";
//   ctx.fillRect(0, 0, width, height);

//   // Draw barcode centered horizontally and vertically (optional)
//   const xOffset = (width - barcodeImage.width) / 2;
//   const yOffset = (height - barcodeImage.height) / 2;

//   ctx.drawImage(barcodeImage, xOffset, yOffset);

//   const imageData = ctx.getImageData(0, 0, width, height);
//   const bytesPerRow = width / 8; // 21 bytes
//   const totalBytes = bytesPerRow * height;
//   const monoBytes = [];

//   for (let y = 0; y < height; y++) {
//     let rowHex = "";
//     for (let x = 0; x < bytesPerRow; x++) {
//       let byte = 0;
//       for (let bit = 0; bit < 8; bit++) {
//         const px = x * 8 + bit;
//         const idx = (y * width + px) * 4;
//         const r = imageData.data[idx];
//         const g = imageData.data[idx + 1];
//         const b = imageData.data[idx + 2];
//         const brightness = (r + g + b) / 3;
//         if (brightness < 128) {
//           byte |= 1 << (7 - bit);
//         }
//       }
//       rowHex += byte.toString(16).padStart(2, "0").toUpperCase();
//     }
//     monoBytes.push(rowHex);
//   }

//   const zpl = `~DGR:${imageName}.GRF,${totalBytes},${bytesPerRow},\n${monoBytes.join(
//     "\n"
//   )}\n`;

//   return zpl;
// }

// app.post("/print-label", async (req, res) => {
//   try {
//     const { data } = req.body;

//     let prnContent = "";

//     // data.forEach((item) => {
//     for (const item of data) {
//       const barcodeText = item.itemSupplier || "";
//       console.log(barcodeText, "barcodeText");
//       const zplImageBlock = await renderBarcodeToZPL(barcodeText, "BARCODE");
//       console.log(zplImageBlock, "zplImageBlock");
//       const addressLines = wrapText(item.address, 40);
//       const maxLines = 3;
//       const startY = 260;
//       const lineHeight = 20;

//       let labelZPL = `
// ^XA
// ${zplImageBlock}
// ^FO140,20^A0N,17,17^FD${item.division || ""}^FS
// ^FO250,20^A0N,17,17^FD${(item.deptClass || "").substring(0, 20)}^FS
// ^FO140,50^XGR:BARCODE.GRF,1,1^FS
// ^FO180,123^A0N,17,17^FD${item.itemSupplier || ""}^FS
// ^FO290,123^A0N,17,17^FD${item.supCode || ""}^FS
// ^FO140,150^A0N,19,19^FD${item.itemShortDescription || ""}^FS
// ^FO140,170^A0N,15,15^FD${item.Maximum || ""}^FS
// ^FO140,190^A0N,30,30^FD${item.price || ""}^FS
// ^FO140,220^A0N,15,15^FD${item.Inclusive || ""}^FS
// ^FO138,240^A0N,17,Y^FD${item.companyName || ""}^FS
// `;

//       addressLines.slice(0, maxLines).forEach((line, i) => {
//         const y = startY + i * lineHeight;
//         labelZPL += `^FO140,${y}^A0N,18,Y^FD${line}^FS\n`;
//       });

//       const colorY =
//         startY + Math.min(addressLines.length, maxLines) * lineHeight;

//       labelZPL += `
// ^FO140,${colorY}^A0N,19,Y^FDColor: ${item.color || ""}^FS
// ^FO140,${colorY + lineHeight}^A0N,19,Y^FDSize: ${item.size || ""}^FS
// ^FO140,${colorY + lineHeight * 2}^A0N,19,Y^FDQty: ${item.Qty || ""}^FS
// ^XZ
// `;

//       prnContent += labelZPL;
//     }

//     // Save the ZPL to a temporary file
//     const tempDir = path.join(__dirname, "temp");
//     await fs.ensureDir(tempDir);
//     const prnFile = `label_${uuidv4()}.prn`;
//     const prnPath = path.join(tempDir, prnFile);
//     await fs.writeFile(prnPath, prnContent, "utf8");

//     // Print to network printer
//     const printerShare = "\\\\192.168.0.150\\datamax";
//     exec(`copy /b "${prnPath}" "${printerShare}"`, (error, stdout, stderr) => {
//       if (error) {
//         console.error("Print error:", error, stderr);
//         return res.status(500).json({
//           error: "Print failed",
//           details: stderr || error.message,
//         });
//       }
//       res.json({ message: "Print successful", filePath: prnPath });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ error: "Server crashed", details: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
