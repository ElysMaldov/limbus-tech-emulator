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
    <main className="flex items-center justify-center pt-16 pb-4 min-h-screen bg-slate-900">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0 max-w-2xl mx-auto px-4">
        <header className="flex flex-col items-center gap-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
            Limbus Tech Emulator
          </h1>
          <p className="text-slate-400 text-center text-lg">
            Welcome to the Crane Robot Control Simulator
          </p>
        </header>

        <div className="w-full max-w-md space-y-6">
          <nav className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 space-y-6">
            <p className="text-slate-300 text-center text-lg font-medium">
              Select a Mode
            </p>
            <div className="space-y-3">
              <Link
                to="/crane"
                className="flex items-center justify-center gap-3 w-full p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
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
                className="flex items-center justify-center gap-3 w-full p-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors"
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
                Challenge 01
              </Link>
            </div>
          </nav>
        </div>

        <footer className="text-slate-500 text-sm">
          Limbus Tech Emulator © 2025
        </footer>
      </div>
    </main>
  );
}
