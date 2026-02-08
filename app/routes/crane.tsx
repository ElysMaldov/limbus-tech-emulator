import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Animation timing constants
const TIMING = {
  moveToItem: 2,
  openClaws: 0.5,
  lowerCrane: 1,
  closeClaws: 0.5,
  liftCrane: 1,
  moveToDrop: 2,
  openClawsDrop: 0.5,
  reset: 1
};

// Phase definitions with labels
const PHASES = [
  { id: 0, label: "Ready", description: "Initial position" },
  { id: 1, label: "Moving to Item", description: "Move crane to item location" },
  { id: 2, label: "Opening Claws", description: "Open claws to grab" },
  { id: 3, label: "Lowering", description: "Lower crane to item" },
  { id: 4, label: "Grabbing", description: "Close claws on item" },
  { id: 5, label: "Lifting", description: "Lift item up" },
  { id: 6, label: "Moving to Drop", description: "Move to drop zone" },
  { id: 7, label: "Dropping", description: "Open claws to drop" },
  { id: 8, label: "Resetting", description: "Return to start" }
];

// Crane SVG Component - Mounting bracket stays fixed, cable extends with animation
function CraneClaw({
  clawAngle,
  cableExtension
}: {
  clawAngle: number;
  cableExtension: number;
}) {
  return (
    <svg
      width="200"
      height="400"
      viewBox="0 0 100 200"
      className="overflow-visible"
    >
      {/* Fixed Mounting Bracket at top */}
      <rect
        x="30"
        y="0"
        width="40"
        height="16"
        rx="2"
        fill="#64748b"
      />
      <circle
        cx="40"
        cy="8"
        r="3"
        fill="#94a3b8"
      />
      <circle
        cx="60"
        cy="8"
        r="3"
        fill="#94a3b8"
      />

      {/* Fixed rod stub */}
      <rect
        x="48"
        y="16"
        width="4"
        height="8"
        fill="#64748b"
      />

      {/* Extending cable - animated */}
      <motion.rect
        x="48"
        y="24"
        width="4"
        fill="#64748b"
        animate={{ height: 24 + cableExtension }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      {/* Moving part - Hub and claws - animated */}
      <motion.g
        animate={{ y: cableExtension }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        {/* Central Hub - Outer Ring */}
        <circle
          cx="50"
          cy="54"
          r="18"
          fill="#64748b"
        />

        {/* Central Hub - Inner Ring */}
        <circle
          cx="50"
          cy="54"
          r="12"
          fill="#475569"
        />

        {/* Central Hub - Center */}
        <circle
          cx="50"
          cy="54"
          r="6"
          fill="#94a3b8"
        />
        <circle
          cx="50"
          cy="54"
          r="3"
          fill="#475569"
        />

        {/* Left Arm Group - Rotates around hub center */}
        <g transform={`rotate(${clawAngle}, 50, 54)`}>
          {/* Upper arm segment */}
          <path
            d="M50,54 L35,75"
            stroke="#64748b"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Joint */}
          <circle
            cx="32"
            cy="78"
            r="4"
            fill="#64748b"
          />
          {/* Lower claw - curved inward */}
          <path
            d="M32,78 Q22,95 20,115 Q19,128 28,135 Q35,128 32,115 Q30,100 35,82"
            fill="#64748b"
          />
        </g>

        {/* Right Arm Group - Rotates around hub center */}
        <g transform={`rotate(${-clawAngle}, 50, 54)`}>
          {/* Upper arm segment */}
          <path
            d="M50,54 L65,75"
            stroke="#64748b"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Joint */}
          <circle
            cx="68"
            cy="78"
            r="4"
            fill="#64748b"
          />
          {/* Lower claw - curved inward */}
          <path
            d="M68,78 Q78,95 80,115 Q81,128 72,135 Q65,128 68,115 Q70,100 65,82"
            fill="#64748b"
          />
        </g>
      </motion.g>
    </svg>
  );
}

// Props for the CraneRobot component
interface CraneRobotProps {
  /** Current animation phase (0-8) */
  phase: number;
  /** Width of the container in pixels (default: 800) */
  width?: number;
  /** Height of the container in pixels (default: 500) */
  height?: number;
  /** Whether to show the status indicator overlay */
  showStatus?: boolean;
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Custom className for the container */
  className?: string;
}

// Main Crane Robot Component - can be controlled via props
export function CraneRobot({
  phase,
  width = 800,
  height = 500,
  showStatus = true,
  showLegend = true,
  className = ""
}: CraneRobotProps) {
  // Derive isHoldingItem from phase
  const isHoldingItem = phase >= 4 && phase <= 6;

  const getCraneX = () => {
    if (phase === 0) return 0;
    if (phase === 1) return -200;
    if (phase >= 2 && phase <= 5) return -200;
    if (phase === 6) return 200;
    if (phase >= 7) return 200;
    return 0;
  };

  const getCraneY = () => {
    // Phase 3: Lowering, Phase 4: Grabbing - crane stays lowered
    if (phase === 3 || phase === 4) return 50;
    // Phase 5: Lifting and beyond - crane is lifted
    return 0;
  };

  const getClawAngle = () => {
    // Open during opening phase (2), lowering (3), and dropping (7)
    if (phase === 2 || phase === 3 || phase === 7) return 45;
    // Closed during grabbing (4), lifting (5), and moving (6)
    return 1;
  };

  const getItemX = () => {
    if (isHoldingItem) {
      if (phase === 6) return 200;
      if (phase >= 7) return 200;
      return -200;
    }
    if (phase >= 7) return 200;
    return -200;
  };

  const getItemY = () => {
    // When holding the item, it moves with the crane
    if (isHoldingItem) {
      // Base ground position (320) minus how much the crane has lowered
      // When crane is at getCraneY() = 50 (lowered), item is at ground (320)
      // When crane is at getCraneY() = 0 (lifted), item is lifted much higher to fit inside claw
      return 320 - (50 - getCraneY()) - 45;
    }
    // Item stays on ground when not being held
    return 320;
  };

  const currentPhaseLabel = PHASES.find(p => p.id === phase)?.label ?? "Unknown";

  return (
    <div 
      className={`relative bg-slate-800 rounded-xl border-4 border-slate-700 overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Track/Rail */}
      <div className="absolute top-16 left-0 right-0 h-4 bg-slate-600" />

      {/* Drop Zone Marker */}
      <div className="absolute bottom-0 right-[180px] w-24 h-4 bg-green-500/50 rounded-t-lg" />
      <div className="absolute bottom-12 right-[195px] text-green-400 text-sm font-semibold">
        DROP ZONE
      </div>

      {/* Item */}
      <motion.div
        className="absolute w-20 h-20 bg-amber-500 rounded-lg shadow-lg"
        animate={{
          x: getItemX() + width / 2 - 40,
          y: getItemY()
        }}
        transition={{
          x: {
            duration:
              isHoldingItem && phase === 6 ? TIMING.moveToDrop : 0.3,
            ease: "easeInOut"
          },
          y: {
            duration:
              isHoldingItem && (phase === 5 || phase === 3)
                ? TIMING.liftCrane
                : phase === 3 || phase === 5
                  ? TIMING.lowerCrane
                  : 0.3,
            ease: "easeInOut"
          }
        }}
        style={{ left: 0, top: 0 }}
      >
        <div className="absolute inset-2 border-2 border-amber-600 rounded" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-600" />
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-600" />
      </motion.div>

      {/* Crane Assembly */}
      <motion.div
        className="absolute"
        animate={{
          x: getCraneX() + width / 2 - 100
        }}
        transition={{
          duration:
            phase === 1
              ? TIMING.moveToItem
              : phase === 6
                ? TIMING.moveToDrop
                : 0.3,
          ease: "easeInOut"
        }}
        style={{ top: 20, left: 0 }}
      >
        {/* The Crane SVG - mounting bracket stays fixed, cable extends */}
        <CraneClaw
          clawAngle={getClawAngle()}
          cableExtension={getCraneY()}
        />
      </motion.div>

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-700" />

      {/* Status Indicator */}
      {showStatus && (
        <div className="absolute top-4 left-4 bg-slate-900/80 px-4 py-2 rounded-lg">
          <div className="text-xs text-slate-400 uppercase tracking-wider">
            Phase
          </div>
          <div className="text-sm font-mono text-cyan-400">
            {currentPhaseLabel}
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-slate-900/80 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded" />
              <span>Item</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/50 rounded" />
              <span>Drop Zone</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Demo page with manual controls and optional animation loop
export default function CraneDemo() {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showAnimationLoop, setShowAnimationLoop] = useState(false);

  useEffect(() => {
    if (!showAnimationLoop) return;

    const runAnimation = async () => {
      await delay(500);
      setAnimationPhase(1);
      await delay(TIMING.moveToItem * 1000);

      setAnimationPhase(2);
      await delay(TIMING.openClaws * 1000 + 300);

      setAnimationPhase(3);
      await delay(TIMING.lowerCrane * 1000);

      setAnimationPhase(4);
      await delay(TIMING.closeClaws * 1000 + 300);

      setAnimationPhase(5);
      await delay(TIMING.liftCrane * 1000);

      setAnimationPhase(6);
      await delay(TIMING.moveToDrop * 1000);

      setAnimationPhase(7);
      await delay(TIMING.openClawsDrop * 1000 + 500);

      setAnimationPhase(8);
      await delay(TIMING.reset * 1000);

      setAnimationPhase(0);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 10000);
    return () => clearInterval(interval);
  }, [showAnimationLoop]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden p-4">
      <h1 className="text-3xl font-bold text-white mb-8">Crane Robot Demo</h1>

      {/* Crane Display */}
      <CraneRobot phase={animationPhase} />

      {/* Controls */}
      <div className="mt-8 w-[800px] space-y-4">
        {/* Animation Loop Toggle */}
        <div className="flex items-center justify-between bg-slate-800 px-4 py-3 rounded-lg">
          <span className="text-slate-300 font-medium">Animation Loop</span>
          <button
            onClick={() => setShowAnimationLoop(!showAnimationLoop)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showAnimationLoop
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-slate-600 hover:bg-slate-500 text-slate-200"
            }`}
          >
            {showAnimationLoop ? "ON" : "OFF"}
          </button>
        </div>

        {/* Manual Phase Controls */}
        <div className="bg-slate-800 px-4 py-4 rounded-lg">
          <div className="text-slate-300 font-medium mb-3">Manual Phase Control</div>
          <div className="grid grid-cols-5 gap-2">
            {PHASES.map((phase) => (
              <button
                key={phase.id}
                onClick={() => setAnimationPhase(phase.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  animationPhase === phase.id
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                title={phase.description}
              >
                <div className="text-xs opacity-70 mb-0.5">Phase {phase.id}</div>
                <div className="text-xs">{phase.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setAnimationPhase(0)}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Reset to Start
          </button>
          <button
            onClick={() => setAnimationPhase((prev) => Math.max(0, prev - 1))}
            disabled={animationPhase === 0}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded-lg font-medium transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={() => setAnimationPhase((prev) => Math.min(8, prev + 1))}
            disabled={animationPhase === 8}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="mt-6 text-slate-400 text-sm text-center max-w-md">
        {showAnimationLoop 
          ? "Animation loop is running. Click the toggle to stop and manually control the crane."
          : "Manual mode active. Use the phase buttons or Prev/Next to control the crane."}
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
