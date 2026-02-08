import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Limbus Tech Emulator" },
    { name: "description", content: "Limbus Tech Emulator - Crane Robot Control" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
      {/* Header Bar - Orange like the image */}
      <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-black tracking-wide">
            Limbus Tech Emulator
          </h1>
          {/* Window-style buttons */}
          <div className="flex items-center gap-1">
            <div className="w-6 h-5 bg-[#E0E0E0] border-2 border-black flex items-center justify-center">
              <div className="w-3 h-0.5 bg-black"></div>
            </div>
            <div className="w-6 h-5 bg-[#E0E0E0] border-2 border-black flex items-center justify-center">
              <div className="w-3 h-3 border border-black"></div>
            </div>
            <div className="w-6 h-5 bg-[#E0E0E0] border-2 border-black flex items-center justify-center">
              <span className="text-black text-lg leading-none">×</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-[#E8E8E8] border-b-2 border-black px-4 py-2">
        <div className="flex items-center gap-8">
          <span className="font-bold text-black tracking-wider">Home</span>
          <Link to="/crane" className="text-black hover:underline tracking-wider">
            Crane
          </Link>
          <Link to="/challenge-01" className="text-black hover:underline tracking-wider">
            Challenge 01
          </Link>
          <Link to="/challenge-02" className="text-black hover:underline tracking-wider">
            Challenge 02
          </Link>
        </div>
      </nav>

      {/* Main Content - White background like image */}
      <main className="flex-1 bg-white border-2 border-black m-4 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12 pt-8">
            <h2 className="text-[#F7931E] text-4xl md:text-5xl font-bold uppercase tracking-wide mb-2">
              Limbus Tech Emulator
            </h2>
            <p className="text-black text-lg">
              Developed by{" "}
              <a
                href="https://github.com/ElysMaldov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F7931E] hover:underline font-medium"
              >
                ElysMaldov
              </a>
            </p>
          </div>

          {/* Start Button - Gray with black border like image */}
          <div className="flex justify-center mb-16">
            <Link
              to="/crane"
              className="px-12 py-3 bg-[#E8E8E8] border-2 border-black text-black font-medium hover:bg-[#D8D8D8] transition-colors tracking-wider"
            >
              Start
            </Link>
          </div>

          {/* Mode Selection */}
          <div className="space-y-4 max-w-md mx-auto">
            <p className="text-black text-center text-lg font-medium mb-6">
              Select a Mode
            </p>
            <div className="space-y-3">
              <Link
                to="/crane"
                className="flex items-center justify-center gap-3 w-full p-4 bg-[#E8E8E8] border-2 border-black text-black hover:bg-[#D8D8D8] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
                  <path d="M14 2v6h6" />
                  <path d="M2 15h10" />
                  <path d="m5 12-3 3 3 3" />
                </svg>
                Crane Robot Control
              </Link>

              <Link
                to="/challenge-01"
                className="flex items-center justify-center gap-3 w-full p-4 bg-[#E8E8E8] border-2 border-black text-black hover:bg-[#D8D8D8] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="M5 3v4" />
                  <path d="M19 17v4" />
                  <path d="M3 5h4" />
                  <path d="M17 19h4" />
                </svg>
                Challenge 01 - Build a Robot
              </Link>

              <Link
                to="/challenge-02"
                className="flex items-center justify-center gap-3 w-full p-4 bg-[#E8E8E8] border-2 border-black text-black hover:bg-[#D8D8D8] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Challenge 02 - Encapsulation
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Bar - like the navigation bar at bottom of image */}
      <footer className="bg-[#E8E8E8] border-t-2 border-black px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-black text-sm">Limbus Tech Emulator © 2026</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-5 bg-[#E0E0E0] border-2 border-black flex items-center justify-center">
              <span className="text-black text-xs">◀</span>
            </div>
            <div className="w-32 h-5 bg-[#C0C0C0] border-2 border-black"></div>
            <div className="w-6 h-5 bg-[#E0E0E0] border-2 border-black flex items-center justify-center">
              <span className="text-black text-xs">▶</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
