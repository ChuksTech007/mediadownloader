import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(
  cors({
    origin: [
      "https://mediadownloader-api.onrender.com",
      "http://localhost:5173",
    ],
  })
);
app.use(express.json());

// Ensure downloads folder exists
const downloadsDir = path.resolve(__dirname, "./downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}
app.use("/downloads", express.static(downloadsDir));

// ---------- Detect yt-dlp path ----------
function getYtDlpCommand() {
  // Windows
  if (process.platform === "win32") {
    const exePath = path.join(__dirname, "yt-dlp.exe");
    if (fs.existsSync(exePath)) return exePath;
  }

  // Linux (Render) → use included binary
  const linuxPath = path.join(__dirname, "yt-dlp");
  if (fs.existsSync(linuxPath)) return linuxPath;

  // Fallback → python module (requires yt-dlp in requirements.txt)
  return "python3";
}

function buildArgs(url, extra = []) {
  if (ytDlpPath === "python3") {
    return ["-m", "yt_dlp", ...extra, url];
  }
  return [...extra, url];
}

const ytDlpPath = getYtDlpCommand();
console.log("✅ yt-dlp binary is ready from path:", ytDlpPath);

// ---------- Utility: Pick options ----------
function pickOptions(info) {
  const title = info.title ?? "Untitled";
  const thumb =
    (info.thumbnails?.length
      ? info.thumbnails[info.thumbnails.length - 1]?.url
      : null) || info.thumbnail || null;

  const videoOptions = (info.formats || [])
    .filter((f) => f.ext === "mp4" && f.vcodec !== "none" && f.acodec !== "none")
    .map((f) => ({
      format_id: f.format_id,
      label: f.format_note || `${f.height || "?"}p`,
      ext: f.ext,
      fps: f.fps || null,
      filesize: f.filesize || f.filesize_approx || null,
    }))
    .sort((a, b) => {
      const ah = parseInt(a.label) || 0;
      const bh = parseInt(b.label) || 0;
      return bh - ah;
    });

  const audioOptions = (info.formats || [])
    .filter((f) => f.acodec !== "none" && (!f.vcodec || f.vcodec === "none"))
    .map((f) => ({
      format_id: f.format_id,
      label: f.format_note || f.ext.toUpperCase(),
      ext: f.ext,
      filesize: f.filesize || f.filesize_approx || null,
    }));

  return { title, thumb, options: [...videoOptions, ...audioOptions] };
}

// ---------- API Routes ----------

// Resolve video info
app.get("/api/resolve", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });

  const args = buildArgs(url, ["-J", "--no-warnings", "--no-check-certificate"]);
  const cookiesPath = path.join(__dirname, "cookies.txt");
  if (fs.existsSync(cookiesPath)) args.push("--cookies", cookiesPath);

  const proc = spawn(ytDlpPath, args, { stdio: ["ignore", "pipe", "pipe"] });

  let rawOutput = "";
  let errOutput = "";

  proc.stdout.on("data", (data) => (rawOutput += data.toString()));
  proc.stderr.on("data", (data) => {
    errOutput += data.toString();
    console.error("yt-dlp stderr:", data.toString());
  });

  proc.on("close", (code) => {
    if (res.headersSent) return;

    if (code !== 0) {
      return res.status(500).json({
        error: "yt-dlp failed",
        details: errOutput || `Exit code ${code}`,
      });
    }

    if (!rawOutput.trim()) {
      return res.status(500).json({
        error: "yt-dlp returned no data",
        details: errOutput,
      });
    }

    try {
      const info = JSON.parse(rawOutput.trim());
      const entry = info.entries?.[0] || info;
      res.json(pickOptions(entry));
    } catch (err) {
      console.error("JSON parse error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Invalid yt-dlp JSON",
          details: rawOutput.slice(0, 500),
        });
      }
    }
  });

  proc.on("error", (err) => {
    console.error("Spawn error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to run yt-dlp" });
    }
  });
});

// Download video
app.get("/api/download", (req, res) => {
  const { url, format_id } = req.query;
  if (!url) return res.status(400).send("Missing URL");

  const format = format_id || "best";
  const outFile = path.join(downloadsDir, `video-${Date.now()}.mp4`);

  const args = buildArgs(url, [
    "-f",
    format,
    "-o",
    "-", // stream to stdout
    "--no-part",
    "--no-playlist",
    "--merge-output-format",
    "mp4",
  ]);

  const cookiesPath = path.join(__dirname, "cookies.txt");
  if (fs.existsSync(cookiesPath)) args.push("--cookies", cookiesPath);

  const proc = spawn(ytDlpPath, args, { stdio: ["ignore", "pipe", "pipe"] });

  res.setHeader("Content-Disposition", "attachment; filename=video.mp4");
  res.setHeader("Content-Type", "video/mp4");

  const fileStream = fs.createWriteStream(outFile);
  proc.stdout.pipe(res);
  proc.stdout.pipe(fileStream);

  proc.stderr.on("data", (data) => console.error("yt-dlp stderr:", data.toString()));

  proc.on("error", (err) => {
    console.error("Download error:", err.message);
    if (!res.headersSent) res.status(500).send("Failed to download video.");
  });
});

// Root
app.get("/", (req, res) => {
  res.send("✅ FastDownloader backend is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
