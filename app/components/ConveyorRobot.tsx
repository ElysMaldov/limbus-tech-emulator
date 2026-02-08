import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

// Animation timing constants
const TIMING = {
  move: 1.5
};

// Conveyor states
export type ConveyorState =
  | "power-off"
  | "power-on"
  | "move-left"
  | "move-right";

// State definitions for UI
export const CONVEYOR_STATE_DEFINITIONS: {
  id: ConveyorState;
  label: string;
  description: string;
}[] = [
  { id: "power-off", label: "Power Off", description: "Conveyor is powered down" },
  { id: "power-on", label: "Power On", description: "Conveyor is ready" },
  { id: "move-left", label: "Move Left", description: "Move belt to the left" },
  { id: "move-right", label: "Move Right", description: "Move belt to the right" }
];

// Power Indicator Component
function PowerIndicator({ isOn }: { isOn: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
          isOn
            ? "bg-[#F7931E] shadow-[0_0_10px_rgba(247,147,30,0.8)]"
            : "bg-gray-500 shadow-none"
        }`}
      />
      <span
        className={`text-xs font-medium ${isOn ? "text-[#F7931E]" : "text-gray-500"}`}
      >
        {isOn ? "ON" : "OFF"}
      </span>
    </div>
  );
}

// Conveyor Belt SVG Component
function ConveyorBelt({
  isPowered,
  beltDirection
}: {
  isPowered: boolean;
  beltDirection: "left" | "right" | "stopped";
}) {
  return (
    <svg
      viewBox="0 0 400 120"
      className="w-full h-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Conveyor frame - left roller housing */}
      <rect x="10" y="20" width="30" height="80" rx="4" fill="#475569" />
      
      {/* Conveyor frame - right roller housing */}
      <rect x="360" y="20" width="30" height="80" rx="4" fill="#475569" />
      
      {/* Conveyor frame - top support beam */}
      <rect x="30" y="10" width="340" height="20" rx="2" fill="#64748b" />
      
      {/* Conveyor frame - bottom support beam */}
      <rect x="30" y="90" width="340" height="20" rx="2" fill="#64748b" />

      {/* Left roller */}
      <circle
        cx="35"
        cy="60"
        r="25"
        fill="#334155"
        stroke="#1e293b"
        strokeWidth="2"
      />
      <circle cx="35" cy="60" r="12" fill="#64748b" />
      <circle cx="35" cy="60" r="6" fill="#94a3b8" />

      {/* Right roller */}
      <circle
        cx="365"
        cy="60"
        r="25"
        fill="#334155"
        stroke="#1e293b"
        strokeWidth="2"
      />
      <circle cx="365" cy="60" r="12" fill="#64748b" />
      <circle cx="365" cy="60" r="6" fill="#94a3b8" />

      {/* Belt - top section with animated arrows */}
      <rect
        x="35"
        y="28"
        width="330"
        height="24"
        fill={isPowered ? "#1e293b" : "#334155"}
        opacity={isPowered ? 1 : 0.7}
      />
      
      {/* Animated belt texture - arrows indicating direction */}
      {isPowered && beltDirection !== "stopped" && (
        <motion.g
          animate={{
            x: beltDirection === "right" ? [0, 40] : [0, -40]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((offset) => (
            <g key={offset} transform={`translate(${35 + offset}, 40)`}>
              <path
                d={beltDirection === "right" ? "M-8,-6 L8,0 L-8,6" : "M8,-6 L-8,0 L8,6"}
                fill="none"
                stroke="#F7931E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </motion.g>
      )}

      {/* Belt - bottom section */}
      <rect
        x="35"
        y="68"
        width="330"
        height="24"
        fill="#334155"
        opacity={0.7}
      />

      {/* Support legs */}
      <rect x="50" y="110" width="12" height="20" fill="#475569" />
      <rect x="338" y="110" width="12" height="20" fill="#475569" />
      
      {/* Power indicator on frame */}
      <circle
        cx="200"
        cy="15"
        r="5"
        fill={isPowered ? "#22c55e" : "#ef4444"}
        className={isPowered ? "animate-pulse" : ""}
      />
    </svg>
  );
}

// Main Conveyor Robot Component
interface ConveyorRobotProps {
  state: ConveyorState;
  showStatus?: boolean;
  className?: string;
  onPositionChange?: (position: number) => void;
  serialNumber?: string;
}

function ConveyorRobotInner({
  state,
  showStatus = true,
  className = "",
  onPositionChange,
  serialNumber = "???"
}: ConveyorRobotProps) {
  const isPowered = state !== "power-off";
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Position: -200 = left, 200 = right, 0 = center
  const [itemPosition, setItemPosition] = useState(0);
  const [beltDirection, setBeltDirection] = useState<"left" | "right" | "stopped">("stopped");

  // Handle state changes
  useEffect(() => {
    switch (state) {
      case "power-off":
        setItemPosition(0);
        setBeltDirection("stopped");
        onPositionChange?.(0);
        break;

      case "power-on":
        setBeltDirection("stopped");
        break;

      case "move-left":
        if (isPowered) {
          setItemPosition(-200);
          setBeltDirection("left");
          onPositionChange?.(-200);
        }
        break;

      case "move-right":
        if (isPowered) {
          setItemPosition(200);
          setBeltDirection("right");
          onPositionChange?.(200);
        }
        break;
    }
  }, [state, isPowered, onPositionChange]);

  const currentStateDef = CONVEYOR_STATE_DEFINITIONS.find((s) => s.id === state);
  const statusText = currentStateDef?.label ?? "Unknown";

  // Responsive values based on container width
  const baseWidth = 800;
  const scale = containerWidth / baseWidth;
  const itemSize = 60 * scale;
  const conveyorHeight = 120 * scale;

  return (
    <div
      ref={containerRef}
      className={`relative bg-[#E0E0E0] border-2 border-black overflow-hidden ${className}`}
      style={{ aspectRatio: "16/10" }}
    >
      {/* Zone Markers */}
      <div className="absolute bottom-0 left-[15%] sm:left-[18%] md:left-[180px] w-16 sm:w-20 md:w-24 h-3 sm:h-4 bg-[#F7931E]/30 rounded-t-lg border-t border-x border-black" />
      <div className="absolute bottom-[15%] sm:bottom-16 left-[12%] sm:left-[15%] md:left-[195px] text-[#D06000] text-[10px] sm:text-xs md:text-sm font-semibold hidden sm:block">
        LEFT ZONE
      </div>
      <div className="absolute bottom-[15%] sm:bottom-16 left-[15%] sm:left-[18%] md:left-[195px] text-[#D06000] text-[10px] font-semibold sm:hidden">
        LEFT
      </div>

      <div className="absolute bottom-0 right-[15%] sm:right-[18%] md:right-[180px] w-16 sm:w-20 md:w-24 h-3 sm:h-4 bg-[#F7931E]/30 rounded-t-lg border-t border-x border-black" />
      <div className="absolute bottom-[15%] sm:bottom-16 right-[12%] sm:right-[15%] md:right-[195px] text-[#D06000] text-[10px] sm:text-xs md:text-sm font-semibold hidden sm:block">
        RIGHT ZONE
      </div>
      <div className="absolute bottom-[15%] sm:bottom-16 right-[15%] sm:right-[18%] md:right-[195px] text-[#D06000] text-[10px] font-semibold sm:hidden">
        RIGHT
      </div>

      {/* Center Zone Marker */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 sm:w-20 md:w-24 h-3 sm:h-4 bg-[#22c55e]/30 rounded-t-lg border-t border-x border-black" />
      <div className="absolute bottom-[15%] sm:bottom-16 left-1/2 -translate-x-1/2 text-[#15803d] text-[10px] sm:text-xs md:text-sm font-semibold">
        CENTER
      </div>

      {/* Conveyor Belt Assembly - vertically centered */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
        style={{
          width: Math.min(400 * scale, containerWidth * 0.9),
          height: conveyorHeight
        }}
      >
        <ConveyorBelt isPowered={isPowered} beltDirection={beltDirection} />
      </div>

      {/* Item on conveyor - positioned on top of the belt */}
      <motion.div
        className="absolute bg-[#F7931E] rounded-lg shadow-lg border-2 border-black"
        style={{
          width: itemSize,
          height: itemSize,
          top: `calc(50% - ${conveyorHeight / 2 + itemSize / 2 - 15 * scale}px)`
        }}
        animate={{
          x: itemPosition * scale + containerWidth / 2 - itemSize / 2
        }}
        transition={{
          duration: TIMING.move,
          ease: "easeInOut"
        }}
      >
        {/* Box details */}
        <div className="absolute inset-1 sm:inset-2 border-2 border-[#D06000] rounded" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D06000]" />
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#D06000]" />
        
        {/* Label on box */}
        <div className="absolute bottom-1 left-1 right-1 text-center">
          <span className="text-[8px] sm:text-[10px] font-bold text-[#D06000]">ITEM</span>
        </div>
      </motion.div>

      {/* Ground/Support surface */}
      <div className="absolute bottom-0 left-0 right-0 h-4 sm:h-6 md:h-8 bg-[#C0C0C0] border-t border-black flex items-center justify-center">
        <span className="text-[10px] sm:text-xs md:text-sm font-bold text-[#D06000]">
          Conveyor Robot #{serialNumber}
        </span>
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-[#E0E0E0] px-2 sm:px-4 py-1 sm:py-2 border-2 border-black">
          <div className="flex items-center gap-2 sm:gap-3">
            <PowerIndicator isOn={isPowered} />
            <div className="h-3 sm:h-4 w-px bg-black" />
            <div>
              <div className="text-[10px] sm:text-xs text-gray-900 uppercase tracking-wider">
                State
              </div>
              <div className="text-xs sm:text-sm font-mono text-[#D06000]">
                {statusText}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direction indicator */}
      {isPowered && beltDirection !== "stopped" && (
        <motion.div
          className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-[#F7931E] px-2 sm:px-3 py-1 border-2 border-black"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <div className="text-xs sm:text-sm font-bold text-black">
            {beltDirection === "left" ? "← LEFT" : "RIGHT →"}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Wrapper to ensure client-only rendering for framer-motion
export function ConveyorRobot(props: ConveyorRobotProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return placeholder during SSR
    return (
      <div
        className={`relative bg-[#F5F5F5] border-2 border-black overflow-hidden flex items-center justify-center ${props.className || ""}`}
        style={{ aspectRatio: "16/10" }}
      >
        <div className="text-black/50">Loading...</div>
      </div>
    );
  }

  return <ConveyorRobotInner {...props} />;
}
