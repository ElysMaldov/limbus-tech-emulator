import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ConveyorRobot, CONVEYOR_STATE_DEFINITIONS, type ConveyorState } from "~/components/ConveyorRobot";

// Demo page with controls
export default function ConveyorDemo() {
  const [conveyorState, setConveyorState] = useState<ConveyorState>("power-off");
  const [isClient, setIsClient] = useState(false);
  const [serialNumber] = useState<string>("CV-2024-" + Math.floor(1000 + Math.random() * 9000));

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStateChange = (newState: ConveyorState) => {
    setConveyorState(newState);
  };

  const isStateDisabled = (stateId: ConveyorState) => {
    if (stateId === "power-off") return false;
    if (conveyorState === "power-off" && stateId !== "power-on") return true;
    return false;
  };

  // Prevent hydration mismatch by not rendering interactive content until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
        <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-bold text-black tracking-wide">
              Conveyor Machine Control
            </h1>
          </div>
        </header>
        <nav className="bg-[#F0F0F0] border-b-2 border-black px-4 py-2">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Home
            </Link>
            <Link to="/crane" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Crane
            </Link>
            <span className="font-bold text-black tracking-wider text-sm sm:text-base">Conveyor</span>
            <Link to="/challenge-01" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Challenge 01
            </Link>
            <Link to="/crane-factory" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Claw Factory
            </Link>
            <Link to="/challenge-02" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Challenge 02
            </Link>
            <Link to="/assembly-line" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Assembly Line
            </Link>
            <Link to="/machine-hierarchy" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Machine Hierarchy
            </Link>
          </div>
        </nav>
        <main className="flex-1 bg-white border-2 border-black m-2 sm:m-4 p-4 sm:p-8 flex items-center justify-center">
          <div className="text-black">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
      {/* Header Bar - Orange */}
      <header className="bg-[#F7931E] border-b-2 border-black px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-black tracking-wide">
            Conveyor Machine Control
          </h1>
          {/* Window-style buttons - hidden on smallest screens */}
          <div className="hidden sm:flex items-center gap-1">
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
      <nav className="bg-[#E8E8E8] border-b-2 border-black px-3 sm:px-4 py-2">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Home
          </Link>
          <Link to="/crane" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Crane
          </Link>
          <span className="font-bold text-black tracking-wider text-sm sm:text-base">Conveyor</span>
          <Link to="/challenge-01" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Challenge 01
          </Link>
          <Link to="/crane-factory" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Claw Factory
          </Link>
          <Link to="/challenge-02" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Challenge 02
          </Link>
          <Link to="/assembly-line" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Assembly Line
          </Link>
          <Link to="/machine-hierarchy" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Machine Hierarchy
          </Link>
        </div>
      </nav>

      {/* Main Content - White background */}
      <main className="flex-1 bg-white border-2 border-black m-2 sm:m-4 p-4 sm:p-6 md:p-8 overflow-auto">
        <div className="flex flex-col items-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-4 sm:mb-8">
            Conveyor Machine Demo
          </h2>

          {/* Conveyor Display - Full width, responsive */}
          <div className="w-full max-w-4xl">
            <ConveyorRobot state={conveyorState} serialNumber={serialNumber} />
          </div>

          {/* Controls */}
          <div className="mt-6 sm:mt-8 w-full max-w-4xl space-y-4">
            {/* State Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {CONVEYOR_STATE_DEFINITIONS.map((stateDef) => {
                const isActive = conveyorState === stateDef.id;
                const isDisabled = isStateDisabled(stateDef.id);

                return (
                  <button
                    key={stateDef.id}
                    onClick={() => handleStateChange(stateDef.id)}
                    disabled={isDisabled}
                    className={`
                      px-3 py-2 sm:px-4 sm:py-3 font-medium transition-all text-left border-2
                      ${
                        isActive
                          ? "bg-[#F7931E] text-black border-black"
                          : "bg-[#E8E8E8] text-black border-black hover:bg-[#D8D8D8]"
                      }
                      ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    title={stateDef.description}
                  >
                    <div className="flex items-center gap-2">
                      {stateDef.id === "power-off" && (
                        <div
                          className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isActive ? "bg-red-500" : "bg-red-600"}`}
                        />
                      )}
                      {stateDef.id === "power-on" && (
                        <div
                          className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isActive ? "bg-green-500" : "bg-green-600"}`}
                        />
                      )}
                      {stateDef.id === "move-left" && (
                        <span className="text-xs sm:text-sm">←</span>
                      )}
                      {stateDef.id === "move-right" && (
                        <span className="text-xs sm:text-sm">→</span>
                      )}
                      <span className="text-xs sm:text-sm">{stateDef.label}</span>
                    </div>
                    <div className="text-[10px] sm:text-xs opacity-70 mt-1">
                      {stateDef.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-[#E0E0E0] border-2 border-black px-3 sm:px-4 py-2 sm:py-3">
              <div className="text-black font-medium mb-2 text-sm sm:text-base">Quick Actions</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleStateChange("power-off")}
                  className="flex-1 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-black font-medium transition-colors text-sm sm:text-base"
                >
                  Emergency Stop
                </button>
                <button
                  onClick={() => handleStateChange("power-on")}
                  disabled={conveyorState !== "power-off"}
                  className="flex-1 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white border-2 border-black font-medium transition-colors text-sm sm:text-base"
                >
                  Power On
                </button>
              </div>
            </div>

            {/* Status Info */}
            <div className="bg-[#E0E0E0] border-2 border-black px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-black">
              <p>
                <strong className="text-black">Current State:</strong>{" "}
                {conveyorState}
              </p>
              <p className="mt-1">
                {conveyorState === "power-off"
                  ? "System is powered down. Press 'Power On' to start."
                  : "Ready for next command."}
              </p>
            </div>

            {/* Machine Info */}
            <div className="bg-[#E8E8E8] border-2 border-black px-3 sm:px-4 py-2 sm:py-3">
              <div className="text-black font-medium mb-2 text-sm sm:text-base">Machine Information</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-600">Serial Number:</span>{" "}
                  <span className="font-mono text-black">{serialNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>{" "}
                  <span className="text-black">Conveyor Belt Machine</span>
                </div>
                <div>
                  <span className="text-gray-600">Capabilities:</span>{" "}
                  <span className="text-black">Move Left, Move Right</span>
                </div>
                <div>
                  <span className="text-gray-600">Max Speed:</span>{" "}
                  <span className="text-black">1.5s per traversal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="bg-[#E8E8E8] border-t-2 border-black px-3 sm:px-4 py-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-black text-xs sm:text-sm text-center sm:text-left">
            Conveyor Machine Control - Limbus Tech Emulator
          </span>
          <div className="flex items-center gap-2">
            <div className="w-5 sm:w-6 h-4 sm:h-5 bg-[#E0E0E0] border-2 border-black flex items-center justify-center">
              <span className="text-black text-xs">◀</span>
            </div>
            <div className="w-24 sm:w-32 h-4 sm:h-5 bg-[#C0C0C0] border-2 border-black"></div>
            <div className="w-5 sm:w-6 h-4 sm:h-5 bg-[#E0E0E0] border-2 border-black flex items-center justify-center">
              <span className="text-black text-xs">▶</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
