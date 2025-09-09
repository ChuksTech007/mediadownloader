import _YTDlpWrap from "yt-dlp-wrap";
import { existsSync } from "fs";
import path from "path";

const YTDlpWrap = _YTDlpWrap.default;

// Path to yt-dlp.exe in parent directory
const binaryPath = path.resolve("../yt-dlp.exe");

// Check if yt-dlp binary exists
if (existsSync(binaryPath)) {
  console.log("yt-dlp binary already exists in parent directory, skipping download.");
} else {
  console.log("yt-dlp binary not found, downloading to parent directory...");
  await YTDlpWrap.downloadFromGithub(binaryPath);
  console.log("yt-dlp binary downloaded successfully to parent directory.");
}

// Create wrapper instance pointing to the binary
const ytDlp = new YTDlpWrap(binaryPath);

console.log("yt-dlp binary is ready.");
