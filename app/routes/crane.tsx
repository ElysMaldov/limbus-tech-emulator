import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";

// Animation timing constants
const TIMING = {
  move: 1.5,
  openClaws: 0.5,
  lowerCrane: 1,
  closeClaws: 0.5,
  liftCrane: 1,
  openClawsDrop: 0.5
};

// Crane states
type CraneState =
  | "power-off"
  | "power-on"
  | "move-left"
  | "move-right"
  | "grab-item"
  | "drop-item";

// Sub-states for grab-item sequence
const GRAB_SUB_STATES = ["opening", "lowering", "grabbing", "lifting"] as const;
type GrabSubState = (typeof GRAB_SUB_STATES)[number];

// Sub-states for drop-item sequence
const DROP_SUB_STATES = ["moving", "dropping"] as const;
type DropSubState = (typeof DROP_SUB_STATES)[number];

// State definitions for UI
const STATE_DEFINITIONS: { id: CraneState; label: string; description: string }[] = [
  { id: "power-off", label: "Power Off", description: "Crane is powered down" },
  { id: "power-on", label: "Power On", description: "Crane is ready" },
  { id: "move-left", label: "Move Left", description: "Move to item zone" },
  { id: "move-right", label: "Move Right", description: "Move to drop zone" },
  { id: "grab-item", label: "Grab Item", description: "Grab sequence" },
  { id: "drop-item", label: "Drop Item", description: "Drop sequence" }
];

// Lightbulb Indicator Component
function PowerIndicator({ isOn }: { isOn: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 rounded-full transition-all duration-300 ${
          isOn
            ? "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]"
            : "bg-slate-600 shadow-none"
        }`}
      />
      <span className={`text-xs font-medium ${isOn ? "text-yellow-400" : "text-slate-500"}`}>
        {isOn ? "ON" : "OFF"}
      </span>
    </div>
  );
}

// Hook to animate a value smoothly
function useAnimatedValue(targetValue: number, duration: number) {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(targetValue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    fromRef.current = currentValue;
    startRef.current = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // easeInOut easing
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const value = fromRef.current + (targetValue - fromRef.current) * eased;
      setCurrentValue(value);
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration]);
  
  return currentValue;
}

// Crane SVG Component
function CraneClaw({
  clawAngle,
  cableExtension,
  isPowered
}: {
  clawAngle: number;
  cableExtension: number;
  isPowered: boolean;
}) {
  // Animate the claw angle smoothly
  const animatedClawAngle = useAnimatedValue(clawAngle, TIMING.openClaws);
  return (
    <svg
      width="200"
      height="400"
      viewBox="0 0 100 200"
      className={`overflow-visible transition-opacity duration-500 ${
        isPowered ? "opacity-100" : "opacity-40"
      }`}
    >
      {/* Fixed Mounting Bracket at top */}
      <rect x="30" y="0" width="40" height="16" rx="2" fill="#64748b" />
      <circle cx="40" cy="8" r="3" fill="#94a3b8" />
      <circle cx="60" cy="8" r="3" fill="#94a3b8" />

      {/* Fixed rod stub */}
      <rect x="48" y="16" width="4" height="8" fill="#64748b" />

      {/* Extending cable - animated */}
      <motion.rect
        x="48"
        y="24"
        width="4"
        fill="#64748b"
        animate={{ height: 24 + cableExtension }}
        transition={{ duration: TIMING.lowerCrane, ease: "easeInOut" }}
      />

      {/* Moving part - Hub and claws - animated */}
      <motion.g
        animate={{ y: cableExtension }}
        transition={{ duration: TIMING.lowerCrane, ease: "easeInOut" }}
      >
        {/* Central Hub - Outer Ring */}
        <circle cx="50" cy="54" r="18" fill="#64748b" />

        {/* Central Hub - Inner Ring */}
        <circle cx="50" cy="54" r="12" fill="#475569" />

        {/* Central Hub - Center */}
        <circle cx="50" cy="54" r="6" fill="#94a3b8" />
        <circle cx="50" cy="54" r="3" fill="#475569" />

        {/* Left Arm Group - Rotates around hub center */}
        <g transform={`rotate(${animatedClawAngle}, 50, 54)`}>
          {/* Upper arm segment */}
          <path d="M50,54 L35,75" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          {/* Joint */}
          <circle cx="32" cy="78" r="4" fill="#64748b" />
          {/* Lower claw - curved inward */}
          <path
            d="M32,78 Q22,95 20,115 Q19,128 28,135 Q35,128 32,115 Q30,100 35,82"
            fill="#64748b"
          />
        </g>

        {/* Right Arm Group - Rotates around hub center */}
        <g transform={`rotate(${-animatedClawAngle}, 50, 54)`}>
          {/* Upper arm segment */}
          <path d="M50,54 L65,75" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          {/* Joint */}
          <circle cx="68" cy="78" r="4" fill="#64748b" />
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

// Main Crane Robot Component
interface CraneRobotProps {
  state: CraneState;
  width?: number;
  height?: number;
  showStatus?: boolean;
  className?: string;
  onSubStateChange?: (subState: string | null) => void;
}

export function CraneRobot({
  state,
  width = 800,
  height = 500,
  showStatus = true,
  className = "",
  onSubStateChange
}: CraneRobotProps) {
  const isPowered = state !== "power-off";
  
  // Position: -200 = left (item zone), 200 = right (drop zone), 0 = center
  const [craneX, setCraneX] = useState(0);
  
  // Cable extension: 0 = up, 50 = down
  const [cableExtension, setCableExtension] = useState(0);
  
  // Claw angle: 45 = open, 1 = closed
  const [clawAngle, setClawAngle] = useState(1);
  
  // Is holding item
  const [isHoldingItem, setIsHoldingItem] = useState(false);
  
  // Item position (where it is on the ground when not held)
  const [itemX, setItemX] = useState(-200);
  
  // Track if item was grabbed while crane was at ground level
  // Used to ensure smooth transition when starting to lift
  const [grabbedAtGround, setGrabbedAtGround] = useState(false);
  
  // Sub-state tracking for complex operations
  const [grabSubState, setGrabSubState] = useState<GrabSubState | null>(null);
  const [dropSubState, setDropSubState] = useState<DropSubState | null>(null);

  // Execute grab sequence
  const executeGrabSequence = useCallback(async () => {
    if (!isPowered) return;
    
    // Step 1: Open claws
    setGrabSubState("opening");
    onSubStateChange?.("opening");
    setClawAngle(45);
    await delay(TIMING.openClaws * 1000 + 200);
    
    // Step 2: Lower crane
    setGrabSubState("lowering");
    onSubStateChange?.("lowering");
    setCableExtension(50);
    await delay(TIMING.lowerCrane * 1000);
    
    // Step 3: Close claws (grab)
    setGrabSubState("grabbing");
    onSubStateChange?.("grabbing");
    setClawAngle(1);
    // Wait for claws to close BEFORE attaching item
    await delay(TIMING.closeClaws * 1000 + 200);
    // Now claws are closed, attach the item
    setIsHoldingItem(true);
    setGrabbedAtGround(cableExtension >= 45); // Remember if we grabbed at ground level
    setItemX(craneX); // Item will be at crane's position when grabbed
    
    // Step 4: Lift crane
    setGrabSubState("lifting");
    onSubStateChange?.("lifting");
    setCableExtension(0);
    await delay(TIMING.liftCrane * 1000);
    
    setGrabbedAtGround(false); // Reset after lift completes
    setGrabSubState(null);
    onSubStateChange?.(null);
  }, [isPowered, craneX, cableExtension, onSubStateChange]);

  // Execute drop sequence
  const executeDropSequence = useCallback(async () => {
    if (!isPowered) return;
    
    // Step 1: Move to drop zone (if not already there)
    setDropSubState("moving");
    onSubStateChange?.("moving");
    setCraneX(200);
    await delay(TIMING.move * 1000);
    
    // Step 2: Open claws (drop)
    setDropSubState("dropping");
    onSubStateChange?.("dropping");
    setClawAngle(45);
    // Wait for claws to open BEFORE releasing item
    await delay(TIMING.openClawsDrop * 1000 + 200);
    // Now claws are open, release the item
    setIsHoldingItem(false);
    setGrabbedAtGround(false);
    setItemX(200); // Item stays at drop zone
    
    // Close claws after drop
    setClawAngle(1);
    await delay(TIMING.closeClaws * 1000);
    
    setDropSubState(null);
    onSubStateChange?.(null);
  }, [isPowered, onSubStateChange]);

  // Handle state changes
  useEffect(() => {
    switch (state) {
      case "power-off":
        setCraneX(0);
        setCableExtension(0);
        setClawAngle(1);
        setIsHoldingItem(false);
        setItemX(-200); // Reset item to item zone
        setGrabbedAtGround(false);
        setGrabSubState(null);
        setDropSubState(null);
        onSubStateChange?.(null);
        break;
        
      case "power-on":
        setCraneX(0);
        setCableExtension(0);
        setClawAngle(1);
        setGrabSubState(null);
        setDropSubState(null);
        onSubStateChange?.(null);
        break;
        
      case "move-left":
        if (isPowered) {
          setCraneX(-200);
        }
        break;
        
      case "move-right":
        if (isPowered) {
          setCraneX(200);
        }
        break;
        
      case "grab-item":
        if (isPowered && craneX !== -200) {
          // Move to left first if not there
          setCraneX(-200);
          setTimeout(() => {
            executeGrabSequence();
          }, TIMING.move * 1000);
        } else if (isPowered) {
          executeGrabSequence();
        }
        break;
        
      case "drop-item":
        if (isPowered && !isHoldingItem) {
          // Can't drop if not holding
          break;
        }
        if (isPowered) {
          executeDropSequence();
        }
        break;
    }
  }, [state, isPowered, craneX, isHoldingItem, executeGrabSequence, executeDropSequence, onSubStateChange]);

  // Calculate item position
  const getItemX = () => {
    if (isHoldingItem) {
      return craneX;
    }
    // Item stays where it was dropped
    return itemX;
  };

  const getItemY = () => {
    // Calculate the "attached to crane" Y position using original formula
    // When cableExtension=50 (lowered): 225 + 50 = 275
    // When cableExtension=0 (lifted): 225 + 0 = 225
    const craneAttachedY = 225 + cableExtension;
    
    // Ground level
    const groundY = 320;
    
    // When crane is lowered enough that the claw would be at/below ground,
    // the item should sit on ground regardless of isHoldingItem (to avoid jumps)
    const isCraneLoweredEnough = cableExtension >= 45; // Near fully lowered
    
    if (isHoldingItem) {
      // Item is held by crane
      // When crane is lowered, item sits on ground (320)
      // When crane is lifted, item follows crane at craneAttachedY
      // Use grabbedAtGround to ensure smooth transition - if we grabbed at ground,
      // stay at ground until crane actually starts lifting (cableExtension drops)
      if (grabbedAtGround && cableExtension >= 45) {
        return groundY;
      }
      return craneAttachedY;
    }
    // Item on ground, not held
    return groundY;
  };

  const currentStateDef = STATE_DEFINITIONS.find((s) => s.id === state);
  
  // Build status text
  let statusText = currentStateDef?.label ?? "Unknown";
  if (grabSubState) {
    statusText += ` (${grabSubState})`;
  } else if (dropSubState) {
    statusText += ` (${dropSubState})`;
  }

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

      {/* Item Zone Marker */}
      <div className="absolute bottom-0 left-[180px] w-24 h-4 bg-amber-500/50 rounded-t-lg" />
      <div className="absolute bottom-12 left-[195px] text-amber-400 text-sm font-semibold">
        ITEM ZONE
      </div>

      {/* Item */}
      <motion.div
        className="absolute w-20 h-20 bg-amber-500 rounded-lg shadow-lg"
        animate={{
          x: getItemX() + width / 2 - 40,
          y: getItemY()
        }}
        transition={{
          x: { duration: isHoldingItem ? TIMING.move : 0.3, ease: "easeInOut" },
          y: {
            duration: isHoldingItem ? TIMING.liftCrane : 0.3,
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
          x: craneX + width / 2 - 100
        }}
        transition={{
          duration: TIMING.move,
          ease: "easeInOut"
        }}
        style={{ top: 20, left: 0 }}
      >
        <CraneClaw
          clawAngle={clawAngle}
          cableExtension={cableExtension}
          isPowered={isPowered}
        />
      </motion.div>

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-700" />

      {/* Status Indicator */}
      {showStatus && (
        <div className="absolute top-4 left-4 bg-slate-900/80 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-3">
            <PowerIndicator isOn={isPowered} />
            <div className="h-4 w-px bg-slate-600" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">State</div>
              <div className="text-sm font-mono text-cyan-400">{statusText}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Demo page with controls
export default function CraneDemo() {
  const [craneState, setCraneState] = useState<CraneState>("power-off");
  const [subState, setSubState] = useState<string | null>(null);

  const handleStateChange = (newState: CraneState) => {
    setCraneState(newState);
  };

  const isStateDisabled = (stateId: CraneState) => {
    if (stateId === "power-off") return false;
    if (craneState === "power-off" && stateId !== "power-on") return true;
    if (subState !== null) return true; // Disable during sequences
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden p-4">
      <h1 className="text-3xl font-bold text-white mb-8">Crane Robot Control</h1>

      {/* Crane Display */}
      <CraneRobot
        state={craneState}
        onSubStateChange={setSubState}
      />

      {/* Controls */}
      <div className="mt-8 w-[800px] space-y-4">
        {/* State Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {STATE_DEFINITIONS.map((stateDef) => {
            const isActive = craneState === stateDef.id;
            const isDisabled = isStateDisabled(stateDef.id);
            
            return (
              <button
                key={stateDef.id}
                onClick={() => handleStateChange(stateDef.id)}
                disabled={isDisabled}
                className={`
                  px-4 py-3 rounded-lg font-medium transition-all text-left
                  ${isActive
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                title={stateDef.description}
              >
                <div className="flex items-center gap-2">
                  {stateDef.id === "power-off" && (
                    <div className={`w-3 h-3 rounded-full ${isActive ? "bg-red-400" : "bg-red-600"}`} />
                  )}
                  {stateDef.id === "power-on" && (
                    <div className={`w-3 h-3 rounded-full ${isActive ? "bg-green-400" : "bg-green-600"}`} />
                  )}
                  <span>{stateDef.label}</span>
                </div>
                <div className="text-xs opacity-70 mt-1">{stateDef.description}</div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 px-4 py-3 rounded-lg">
          <div className="text-slate-300 font-medium mb-2">Quick Actions</div>
          <div className="flex gap-2">
            <button
              onClick={() => handleStateChange("power-off")}
              className="flex-1 px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-200 rounded-lg font-medium transition-colors"
            >
              Emergency Stop
            </button>
            <button
              onClick={() => handleStateChange("power-on")}
              disabled={craneState !== "power-off"}
              className="flex-1 px-4 py-2 bg-green-900/50 hover:bg-green-900/70 disabled:opacity-50 disabled:cursor-not-allowed text-green-200 rounded-lg font-medium transition-colors"
            >
              Power On
            </button>
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-slate-800/50 px-4 py-3 rounded-lg text-sm text-slate-400">
          <p>
            <strong className="text-slate-300">Current State:</strong>{" "}
            {craneState} {subState && `→ ${subState}`}
          </p>
          <p className="mt-1">
            {craneState === "power-off"
              ? "System is powered down. Press 'Power On' to start."
              : subState
              ? "Executing sequence... Please wait."
              : "Ready for next command."}
          </p>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
