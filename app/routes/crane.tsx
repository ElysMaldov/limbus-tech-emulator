import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router";

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
const GRAB_SUB_STATES = [
  "moving",
  "opening",
  "lowering",
  "grabbing",
  "lifting"
] as const;
type GrabSubState = (typeof GRAB_SUB_STATES)[number];

// Sub-states for drop-item sequence
const DROP_SUB_STATES = ["moving", "dropping"] as const;
type DropSubState = (typeof DROP_SUB_STATES)[number];

// State definitions for UI
const STATE_DEFINITIONS: {
  id: CraneState;
  label: string;
  description: string;
}[] = [
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
      const eased =
        progress < 0.5
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
      viewBox="0 0 100 200"
      className={`w-full h-full overflow-visible transition-opacity duration-500 ${
        isPowered ? "opacity-100" : "opacity-40"
      }`}
      preserveAspectRatio="xMidYMin meet"
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
          <path
            d="M50,54 L35,75"
            stroke="#64748b"
            strokeWidth="6"
            strokeLinecap="round"
          />
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
          <path
            d="M50,54 L65,75"
            stroke="#64748b"
            strokeWidth="6"
            strokeLinecap="round"
          />
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

// Main Claw Machine Component
interface CraneRobotProps {
  state: CraneState;
  showStatus?: boolean;
  className?: string;
  onSubStateChange?: (subState: string | null) => void;
}

function CraneRobotInner({
  state,
  showStatus = true,
  className = "",
  onSubStateChange
}: CraneRobotProps) {
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

  // Position: -200 = left (item zone), 200 = right (drop zone), 0 = center
  // Scale positions based on container width (base width 800)
  const scaleX = containerWidth / 800;
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
  const [grabbedAtGround, setGrabbedAtGround] = useState(false);

  // Sub-state tracking for complex operations
  const [grabSubState, setGrabSubState] = useState<GrabSubState | null>(null);
  const [dropSubState, setDropSubState] = useState<DropSubState | null>(null);

  // Execute grab sequence
  const executeGrabSequence = useCallback(async () => {
    if (!isPowered) return;

    // Step 1: Move crane and item to item zone
    setGrabSubState("moving");
    onSubStateChange?.("moving");
    setCraneX(-200);
    setItemX(-200);
    setIsHoldingItem(false);
    await delay(TIMING.move * 1000);

    // Step 2: Open claws
    setGrabSubState("opening");
    onSubStateChange?.("opening");
    setClawAngle(45);
    await delay(TIMING.openClaws * 1000 + 200);

    // Step 3: Lower crane
    setGrabSubState("lowering");
    onSubStateChange?.("lowering");
    setCableExtension(50);
    await delay(TIMING.lowerCrane * 1000);

    // Step 4: Close claws (grab)
    setGrabSubState("grabbing");
    onSubStateChange?.("grabbing");
    setClawAngle(1);
    await delay(TIMING.closeClaws * 1000 + 200);

    // Attach the item
    setIsHoldingItem(true);
    setGrabbedAtGround(true);

    // Step 5: Lift crane
    setGrabSubState("lifting");
    onSubStateChange?.("lifting");
    setCableExtension(0);
    await delay(TIMING.liftCrane * 1000);

    setGrabbedAtGround(false);
    setGrabSubState(null);
    onSubStateChange?.(null);
  }, [isPowered, onSubStateChange]);

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
    // Release item immediately as claws open
    setIsHoldingItem(false);
    setGrabbedAtGround(false);
    setItemX(200); // Item stays at drop zone
    await delay(TIMING.openClawsDrop * 1000 + 200);

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
        if (isPowered) {
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
  }, [
    state,
    isPowered,
    executeGrabSequence,
    executeDropSequence,
    onSubStateChange
  ]);

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

  // Responsive values based on container width
  const baseWidth = 800;
  const scale = containerWidth / baseWidth;
  const craneWidth = 200 * scale;
  const itemSize = 80 * scale;
  const zoneWidth = 96 * scale; // w-24 = 6rem = 96px

  return (
    <div
      ref={containerRef}
      className={`relative bg-[#E0E0E0] border-2 border-black overflow-hidden ${className}`}
      style={{ aspectRatio: "16/10" }}
    >
      {/* Track/Rail */}
      <div className="absolute top-[12%] sm:top-[14%] md:top-16 left-0 right-0 h-2 sm:h-3 md:h-4 bg-[#C0C0C0] border-b border-black" />

      {/* Drop Zone Marker */}
      <div
        className="absolute bottom-0 right-[15%] sm:right-[18%] md:right-[180px] h-2 sm:h-3 md:h-4 bg-[#F7931E]/50 rounded-t-lg border-t border-x border-black"
        style={{ width: zoneWidth }}
      />
      <div className="absolute bottom-[10%] sm:bottom-12 right-[12%] sm:right-[15%] md:right-[195px] text-[#D06000] text-[10px] sm:text-xs md:text-sm font-semibold hidden sm:block">
        DROP ZONE
      </div>
      <div className="absolute bottom-[10%] sm:bottom-12 right-[15%] sm:right-[18%] md:right-[195px] text-[#D06000] text-[10px] font-semibold sm:hidden">
        DROP
      </div>

      {/* Item Zone Marker */}
      <div
        className="absolute bottom-0 left-[15%] sm:left-[18%] md:left-[180px] h-2 sm:h-3 md:h-4 bg-[#F7931E]/50 rounded-t-lg border-t border-x border-black"
        style={{ width: zoneWidth }}
      />
      <div className="absolute bottom-[10%] sm:bottom-12 left-[12%] sm:left-[15%] md:left-[195px] text-[#D06000] text-[10px] sm:text-xs md:text-sm font-semibold hidden sm:block">
        ITEM ZONE
      </div>
      <div className="absolute bottom-[10%] sm:bottom-12 left-[15%] sm:left-[18%] md:left-[195px] text-[#D06000] text-[10px] font-semibold sm:hidden">
        ITEM
      </div>

      {/* Item */}
      <motion.div
        className="absolute bg-[#F7931E] rounded-lg shadow-lg border-2 border-black"
        style={{
          width: itemSize,
          height: itemSize,
          left: 0,
          top: 0
        }}
        animate={{
          x: getItemX() * scale + containerWidth / 2 - itemSize / 2,
          y: getItemY() * scale
        }}
        transition={{
          x: { duration: isHoldingItem ? TIMING.move : 0.3, ease: "easeInOut" },
          y: {
            duration: isHoldingItem ? TIMING.liftCrane : 0.3,
            ease: "easeInOut"
          }
        }}
      >
        <div className="absolute inset-1 sm:inset-2 border-2 border-[#D06000] rounded" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D06000]" />
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#D06000]" />
      </motion.div>

      {/* Crane Assembly */}
      <motion.div
        className="absolute"
        style={{ top: "5%", left: 0 }}
        animate={{
          x: craneX * scale + containerWidth / 2 - craneWidth / 2
        }}
        transition={{
          duration: TIMING.move,
          ease: "easeInOut"
        }}
      >
        <div style={{ width: craneWidth, height: craneWidth * 2 }}>
          <CraneClaw
            clawAngle={clawAngle}
            cableExtension={cableExtension * scale}
            isPowered={isPowered}
          />
        </div>
      </motion.div>

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-4 sm:h-6 md:h-8 bg-[#C0C0C0] border-t border-black" />

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
    </div>
  );
}

// Wrapper to ensure client-only rendering for framer-motion
function CraneRobot(props: CraneRobotProps) {
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

  return <CraneRobotInner {...props} />;
}

export { CraneRobot };

// Demo page with controls
export default function CraneDemo() {
  const [craneState, setCraneState] = useState<CraneState>("power-off");
  const [subState, setSubState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStateChange = (newState: CraneState) => {
    setCraneState(newState);
  };

  const isStateDisabled = (stateId: CraneState) => {
    if (stateId === "power-off") return false;
    if (craneState === "power-off" && stateId !== "power-on") return true;
    if (subState !== null) return true; // Disable during sequences
    return false;
  };

  // Prevent hydration mismatch by not rendering interactive content until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
        <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-bold text-black tracking-wide">
              Claw Machine Control
            </h1>
          </div>
        </header>
        <nav className="bg-[#F0F0F0] border-b-2 border-black px-4 py-2">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Home
            </Link>
            <span className="font-bold text-black tracking-wider text-sm sm:text-base">Claw</span>
            <Link to="/challenge-01" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Challenge
            </Link>
            <Link to="/crane-factory" className="text-black hover:underline tracking-wider text-sm sm:text-base">
              Factory
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
            Claw Machine Control
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
          <span className="font-bold text-black tracking-wider text-sm sm:text-base">Claw</span>
          <Link to="/conveyor" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Conveyor
          </Link>
          <Link to="/challenge-01" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Challenge
          </Link>
          <Link to="/crane-factory" className="text-black hover:underline tracking-wider text-sm sm:text-base">
            Factory
          </Link>
        </div>
      </nav>

      {/* Main Content - White background */}
      <main className="flex-1 bg-white border-2 border-black m-2 sm:m-4 p-4 sm:p-6 md:p-8 overflow-auto">
        <div className="flex flex-col items-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-4 sm:mb-8">
            Claw Machine Control
          </h2>

          {/* Crane Display - Full width, responsive */}
          <div className="w-full max-w-4xl">
            <CraneRobot state={craneState} onSubStateChange={setSubState} />
          </div>

          {/* Controls */}
          <div className="mt-6 sm:mt-8 w-full max-w-4xl space-y-4">
            {/* State Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {STATE_DEFINITIONS.map((stateDef) => {
                const isActive = craneState === stateDef.id;
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
                  disabled={craneState !== "power-off"}
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
      </main>

      {/* Footer Bar */}
      <footer className="bg-[#E8E8E8] border-t-2 border-black px-3 sm:px-4 py-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-black text-xs sm:text-sm text-center sm:text-left">
            Claw Machine Control - Limbus Tech Emulator
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
