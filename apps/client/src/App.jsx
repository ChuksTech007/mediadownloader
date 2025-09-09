import React, { useState } from "react";

// --- SVG Icon Components ---
const LoaderIcon = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const VideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-400">
        <path d="m22 8-6 4 6 4V8Z" />
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
);

const AudioIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-purple-400">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);


export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);


  const serverUrl = "https://fastdownloader-backend.onrender.com";
  // const serverUrl = "http://localhost:5000";

  async function handleResolve(e) {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError(null);
    setMeta(null);

    try {
      const res = await fetch(`${serverUrl}/api/resolve?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to resolve URL");
      setMeta(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload(format_id) {
    const href = `${serverUrl}/api/download?url=${encodeURIComponent(url)}&format_id=${encodeURIComponent(format_id || "best")}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-[#111827] to-[#000000] text-gray-200 font-sans flex flex-col items-center justify-center p-4 selection:bg-purple-500/50">
        <div className="w-full max-w-2xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Media Downloader
              </span>
            </h1>
            <p className="text-gray-400 mt-2 max-w-md mx-auto">
              Paste any video URL to download it in your desired format.
            </p>
          </header>

          <main>
            <form onSubmit={handleResolve}>
              <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <div className="relative flex items-center bg-gray-900 rounded-xl p-1">
                      <input
                          type="url"
                          required
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="flex-1 bg-transparent text-white px-4 py-3 focus:outline-none placeholder-gray-500"
                      />
                      <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center justify-center rounded-lg px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {loading ? <LoaderIcon /> : "Resolve"}
                      </button>
                  </div>
              </div>
            </form>

            {error && (
              <div className="mt-6 p-4 border border-red-500/30 rounded-xl bg-red-500/10 text-red-300 flex items-center animate-fade-in">
                <ErrorIcon />
                <span>{error}</span>
              </div>
            )}

            {meta && (
              <div className="mt-8 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6 shadow-2xl animate-fade-in">
                <div className="flex flex-col sm:flex-row gap-5">
                  {meta.thumb && (
                    <img
                      src={meta.thumb}
                      alt={meta.title || "thumbnail"}
                      className="w-full sm:w-48 h-auto object-cover rounded-lg border border-gray-700"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="font-bold text-lg text-white">{meta.title || "Untitled"}</h2>
                    <p className="text-sm text-gray-400 mt-2">
                      Choose a format below to start your download.
                    </p>
                    <button
                      onClick={() => handleDownload("best")}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                      <DownloadIcon/>
                      Download Best Quality
                    </button>
                  </div>
                </div>

                <hr className="my-5 border-gray-700" />
                
                <div className="grid sm:grid-cols-2 gap-3">
                  {meta.options?.map((opt) => (
                    <button
                      key={opt.format_id}
                      onClick={() => handleDownload(opt.format_id)}
                      className="group flex items-center gap-3 text-left border border-gray-700 rounded-xl p-3 hover:bg-gray-800/80 transition-colors duration-200 w-full"
                      title={`Format: ${opt.format_id}`}
                    >
                      {opt.vcodec !== 'none' && opt.acodec !== 'none' ? <VideoIcon /> : <AudioIcon />}
                      <div className="flex-1">
                        <div className="font-semibold text-white">{opt.label}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <span>{opt.ext?.toUpperCase()}</span>
                          {opt.fps && <span>• {opt.fps}fps</span>}
                          {opt.filesize && <span>• {(opt.filesize / (1024 * 1024)).toFixed(1)} MB</span>}
                        </div>
                      </div>
                      <DownloadIcon className="text-gray-500 group-hover:text-white transition-colors"/>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>

          <footer className="text-center mt-12 text-gray-500 text-sm">
            © {new Date().getFullYear()} Media Downloader. All rights reserved.
          </footer>
        </div>
      </div>
    </>
  );
}

