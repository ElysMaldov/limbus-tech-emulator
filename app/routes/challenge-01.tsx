import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router";

// Animation timing constants
const TIMING = {
  move: 0.5,
  openClaws: 0.2,
  lowerCrane: 0.3,
  closeClaws: 0.2,
  liftCrane: 0.3,
  openClawsDrop: 0.2
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
const GRAB_SUB_STATES = ["moving", "opening", "lowering", "grabbing", "lifting"] as const;
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
            ? "bg-[#F7931E] shadow-[0_0_10px_rgba(247,147,30,0.8)]"
            : "bg-gray-500 shadow-none"
        }`}
      />
      <span className={`text-xs font-medium ${isOn ? "text-[#F7931E]" : "text-gray-500"}`}>
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
  onPositionChange?: (position: number) => void;
  onHoldingChange?: (isHolding: boolean) => void;
}

export function CraneRobot({
  state,
  width = 800,
  height = 500,
  showStatus = true,
  className = "",
  onSubStateChange,
  onPositionChange,
  onHoldingChange
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
    onHoldingChange?.(true);
    
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
    onHoldingChange?.(false);
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
        onPositionChange?.(0);
        onHoldingChange?.(false);
        break;
        
      case "power-on":
        setCraneX(0);
        setCableExtension(0);
        setClawAngle(1);
        setGrabSubState(null);
        setDropSubState(null);
        onSubStateChange?.(null);
        onPositionChange?.(0);
        break;
        
      case "move-left":
        if (isPowered) {
          setCraneX(-200);
          onPositionChange?.(-200);
        }
        break;
        
      case "move-right":
        if (isPowered) {
          setCraneX(200);
          onPositionChange?.(200);
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
  }, [state, isPowered, executeGrabSequence, executeDropSequence, onSubStateChange, onPositionChange, onHoldingChange]);

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
      className={`relative bg-[#E0E0E0] border-2 border-black overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Track/Rail */}
      <div className="absolute top-16 left-0 right-0 h-4 bg-[#A0A0A0] border-b border-black" />

      {/* Drop Zone Marker */}
      <div className="absolute bottom-0 right-[180px] w-24 h-4 bg-[#F7931E]/50 rounded-t-lg border-t border-x border-black" />
      <div className="absolute bottom-12 right-[195px] text-[#D06000] text-sm font-semibold">
        DROP ZONE
      </div>

      {/* Item Zone Marker */}
      <div className="absolute bottom-0 left-[180px] w-24 h-4 bg-[#F7931E]/50 rounded-t-lg border-t border-x border-black" />
      <div className="absolute bottom-12 left-[195px] text-[#D06000] text-sm font-semibold">
        ITEM ZONE
      </div>

      {/* Item */}
      <motion.div
        className="absolute w-20 h-20 bg-[#F7931E] rounded-lg shadow-lg border-2 border-black"
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
        <div className="absolute inset-2 border-2 border-[#D06000] rounded" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D06000]" />
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#D06000]" />
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
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#A0A0A0] border-t border-black" />

      {/* Status Indicator */}
      {showStatus && (
        <div className="absolute top-4 left-4 bg-[#C0C0C0] px-4 py-2 border-2 border-black">
          <div className="flex items-center gap-3">
            <PowerIndicator isOn={isPowered} />
            <div className="h-4 w-px bg-black" />
            <div>
              <div className="text-xs text-gray-700 uppercase tracking-wider">
                State
              </div>
              <div className="text-sm font-mono text-[#D06000]">
                {statusText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Play a satisfying success sound using Web Audio API
function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create oscillator for the main tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure the sound - a pleasant ascending chime
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.1); // G5
    
    // Volume envelope - quick attack, smooth decay
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Add a second oscillator for harmony
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.type = "triangle";
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
    
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode2.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.4);
  } catch {
    // Silently fail if audio is not supported
  }
}

// Property Question Component
interface PropertyQuestionProps {
  questionNumber: number;
  question: string;
  placeholder: string;
  validateAnswer: (answer: string) => boolean;
  onCorrect: () => void;
  isRevealed: boolean;
  revealedContent: React.ReactNode;
  errorMessage: string;
  type?: "property" | "method";
}

function PropertyQuestion({
  questionNumber,
  question,
  placeholder,
  validateAnswer,
  onCorrect,
  isRevealed,
  revealedContent,
  errorMessage,
  type = "property"
}: PropertyQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [showError, setShowError] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (validateAnswer(answer.toLowerCase())) {
      setIsCorrect(true);
      setShowError(false);
      playSuccessSound();
      onCorrect();
    } else {
      setShowError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (isRevealed || isCorrect) {
    return (
      <div className="bg-green-50 border-2 border-green-500 p-4 rounded">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            ✓
          </div>
          <span className="text-green-700 font-semibold">{type === "method" ? "Method Unlocked!" : "Property Unlocked!"}</span>
        </div>
        {revealedContent}
      </div>
    );
  }

  return (
    <div className="bg-[#F0F0F0] border-2 border-black p-4">
      <div className="flex items-start gap-3">
        <span className="text-[#F7931E] font-bold text-lg">{questionNumber}.</span>
        <div className="flex-1">
          <p className="text-black mb-3">{question}</p>
          <input
            type="text"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setShowError(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-white border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:border-[#F7931E]"
          />
          {showError && (
            <p className="text-red-600 text-sm mt-2">{errorMessage}</p>
          )}
          <button
            onClick={handleSubmit}
            className="mt-3 px-4 py-2 bg-[#C0C0C0] border-2 border-black text-black font-medium hover:bg-[#B0B0B0] active:bg-[#A0A0A0]"
          >
            Check Answer
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo page with controls
export default function Challenge01() {
  const [craneState, setCraneState] = useState<CraneState>("power-off");
  const [subState, setSubState] = useState<string | null>(null);
  const [cranePosition, setCranePosition] = useState<number>(0);
  const [isHoldingItem, setIsHoldingItem] = useState<boolean>(false);

  // Revealed state for properties
  const [revealedProperties, setRevealedProperties] = useState({
    power: false,
    position: false,
    hold: false
  });

  // Revealed state for methods
  const [revealedMethods, setRevealedMethods] = useState({
    "power-off": false,
    "power-on": false,
    "move-left": false,
    "move-right": false,
    "grab-item": false,
    "drop-item": false
  });

  // Accordion state
  const [showProperties, setShowProperties] = useState(true);
  const [showMethods, setShowMethods] = useState(false);

  const revealProperty = (property: keyof typeof revealedProperties) => {
    setRevealedProperties(prev => ({ ...prev, [property]: true }));
  };

  const revealMethod = (method: keyof typeof revealedMethods) => {
    setRevealedMethods(prev => ({ ...prev, [method]: true }));
  };

  // Get position label
  const getPositionLabel = (pos: number): string => {
    if (pos <= -150) return "Left";
    if (pos >= 150) return "Right";
    return "Center";
  };

  const handleStateChange = (newState: CraneState) => {
    setCraneState(newState);
  };

  const isStateDisabled = (stateId: CraneState) => {
    if (stateId === "power-off") return false;
    if (craneState === "power-off" && stateId !== "power-on") return true;
    if (subState !== null) return true; // Disable during sequences
    return false;
  };

  // Check if all properties are revealed
  const allPropertiesRevealed = Object.values(revealedProperties).every(v => v);
  
  // Check if all methods are revealed
  const allMethodsRevealed = Object.values(revealedMethods).every(v => v);

  // Auto-open methods section when properties are done
  useEffect(() => {
    if (allPropertiesRevealed) {
      setShowMethods(true);
    }
  }, [allPropertiesRevealed]);

  return (
    <div className="min-h-screen bg-[#C0C0C0] flex flex-col">
      {/* Header Bar - Orange */}
      <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-black tracking-wide">
            Challenge 01 - Build a Robot with OOP
          </h1>
          {/* Window-style buttons */}
          <div className="flex items-center gap-1">
            <div className="w-6 h-5 bg-[#C0C0C0] border-2 border-black flex items-center justify-center">
              <div className="w-3 h-0.5 bg-black"></div>
            </div>
            <div className="w-6 h-5 bg-[#C0C0C0] border-2 border-black flex items-center justify-center">
              <div className="w-3 h-3 border border-black"></div>
            </div>
            <div className="w-6 h-5 bg-[#C0C0C0] border-2 border-black flex items-center justify-center">
              <span className="text-black text-lg leading-none">×</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-[#C0C0C0] border-b-2 border-black px-4 py-2">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-black hover:underline tracking-wider">
            Home
          </Link>
          <Link to="/crane" className="text-black hover:underline tracking-wider">
            Crane
          </Link>
          <span className="font-bold text-black tracking-wider">Challenge</span>
        </div>
      </nav>

      {/* Main Content - Two Column Layout */}
      <main className="flex-1 bg-white border-2 border-black m-4 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Column - Crane Robot View */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-black mb-4 text-center">
              Crane Robot
            </h2>

            {/* Crane Display */}
            <CraneRobot
              state={craneState}
              onSubStateChange={setSubState}
              onPositionChange={setCranePosition}
              onHoldingChange={setIsHoldingItem}
              showStatus={false}
              className="w-full"
              width={700}
              height={480}
            />

            {/* Controls */}
            <div className="mt-4 space-y-4">
              {/* Status Card - With ??? placeholders */}
              <div className="bg-[#C0C0C0] border-2 border-black p-6">
                <div className="flex items-center justify-around">
                  {/* Power Status */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-700 uppercase tracking-wider">Power</div>
                    {revealedProperties.power ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full transition-all duration-300 ${
                            craneState !== "power-off"
                              ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                              : "bg-gray-500 shadow-none"
                          }`}
                        />
                        <span className={`text-lg font-bold ${craneState !== "power-off" ? "text-green-600" : "text-gray-500"}`}>
                          {craneState !== "power-off" ? "ON" : "OFF"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-2xl font-mono font-bold text-gray-500">???</div>
                    )}
                  </div>
                  <div className="h-12 w-px bg-black" />
                  {/* Claw Position */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-700 uppercase tracking-wider">Claw Position</div>
                    {revealedProperties.position ? (
                      <div className="text-2xl font-mono font-bold text-[#D06000]">
                        {getPositionLabel(cranePosition)}
                      </div>
                    ) : (
                      <div className="text-2xl font-mono font-bold text-gray-500">???</div>
                    )}
                  </div>
                  <div className="h-12 w-px bg-black" />
                  {/* Holding Item */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-700 uppercase tracking-wider">Holding Item</div>
                    {revealedProperties.hold ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full transition-all duration-300 ${
                            isHoldingItem
                              ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]"
                              : "bg-gray-500 shadow-none"
                          }`}
                        />
                        <span className={`text-lg font-bold ${isHoldingItem ? "text-blue-700" : "text-gray-500"}`}>
                          {isHoldingItem ? "YES" : "NO"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-2xl font-mono font-bold text-gray-500">???</div>
                    )}
                  </div>
                </div>
              </div>

              {/* State Buttons - Grid with ??? placeholders */}
              <AnimatePresence>
                {allPropertiesRevealed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {STATE_DEFINITIONS.map((stateDef) => {
                      const isActive = craneState === stateDef.id;
                      const isDisabled = isStateDisabled(stateDef.id);
                      const isRevealed = revealedMethods[stateDef.id];
                      
                      if (!isRevealed) {
                        // Show ??? placeholder
                        return (
                          <div
                            key={stateDef.id}
                            className="px-4 py-3 bg-[#D0D0D0] border-2 border-black text-center"
                          >
                            <div className="text-2xl font-mono font-bold text-gray-500">???</div>
                          </div>
                        );
                      }
                      
                      return (
                        <button
                          key={stateDef.id}
                          onClick={() => handleStateChange(stateDef.id)}
                          disabled={isDisabled}
                          className={`
                            px-4 py-3 font-medium transition-all text-left border-2
                            ${isActive
                              ? "bg-[#F7931E] text-black border-black"
                              : "bg-[#C0C0C0] text-black border-black hover:bg-[#B0B0B0]"
                            }
                            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                          title={stateDef.description}
                        >
                          <div className="flex items-center gap-2">
                            {stateDef.id === "power-off" && (
                              <div className={`w-3 h-3 rounded-full ${isActive ? "bg-red-500" : "bg-red-600"}`} />
                            )}
                            {stateDef.id === "power-on" && (
                              <div className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : "bg-green-600"}`} />
                            )}
                            <span>{stateDef.label}</span>
                          </div>
                          <div className="text-xs opacity-70 mt-1">{stateDef.description}</div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hint when properties not all revealed */}
              {!allPropertiesRevealed && (
                <div className="bg-[#F7931E]/20 border-2 border-[#F7931E] p-4 text-center">
                  <p className="text-[#D06000] font-medium">
                    🔒 Complete all property questions to unlock the next section
                  </p>
                </div>
              )}

              {/* Hint when properties done but methods not complete */}
              {allPropertiesRevealed && !allMethodsRevealed && (
                <div className="bg-[#F7931E]/20 border-2 border-[#F7931E] p-4 text-center">
                  <p className="text-[#D06000] font-medium">
                    🔒 Answer method questions to unlock the controls
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Questions */}
          <div className="self-start">
            <div className="bg-[#F5F5F5] border-2 border-black">
              <button
                onClick={() => setShowProperties(!showProperties)}
                className="w-full px-6 py-4 flex items-center justify-between bg-[#E0E0E0] hover:bg-[#D0D0D0] transition-colors"
              >
                <h2 className="text-xl font-bold text-black">PROPERTIES</h2>
                <span className={`text-2xl transition-transform duration-300 ${showProperties ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              
              <AnimatePresence initial={false}>
                {showProperties && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-4">
            <p className="text-gray-700 mb-6">
              In Object-Oriented Programming, <strong>properties</strong> are the object's characteristics - the data that an object needs to keep track of. 
              Help define the properties for our Crane Robot!
            </p>

            <div className="space-y-4">
              {/* Question 1: Power */}
              <PropertyQuestion
                questionNumber={1}
                question="The robot needs to know if it's turned on or off. What property name should we use to store this?"
                placeholder="Type your answer..."
                validateAnswer={(answer) => answer.includes("power")}
                onCorrect={() => revealProperty("power")}
                isRevealed={revealedProperties.power}
                errorMessage="The robot should know if its power is on or not."
                revealedContent={
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full ${
                        craneState !== "power-off"
                          ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                          : "bg-gray-500"
                      }`}
                    />
                    <span className={`font-bold ${craneState !== "power-off" ? "text-green-600" : "text-gray-500"}`}>
                      {craneState !== "power-off" ? "ON" : "OFF"}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">(Property: power)</span>
                  </div>
                }
              />

              {/* Question 2: Position */}
              <PropertyQuestion
                questionNumber={2}
                question="The robot needs to track where its claw is located (left, center, or right). What property name should we use?"
                placeholder="Type your answer..."
                validateAnswer={(answer) => answer.includes("position")}
                onCorrect={() => revealProperty("position")}
                isRevealed={revealedProperties.position}
                errorMessage="The robot should know the position of its claw."
                revealedContent={
                  <div className="text-xl font-mono font-bold text-[#D06000]">
                    {getPositionLabel(cranePosition)}
                    <span className="text-gray-500 text-sm ml-2">(Property: position)</span>
                  </div>
                }
              />

              {/* Question 3: Hold */}
              <PropertyQuestion
                questionNumber={3}
                question="The robot needs to remember whether it's currently holding an item or not. What property name should we use?"
                placeholder="Type your answer..."
                validateAnswer={(answer) => answer.includes("hold")}
                onCorrect={() => revealProperty("hold")}
                isRevealed={revealedProperties.hold}
                errorMessage="The robot should know if it's holding an item."
                revealedContent={
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full ${
                        isHoldingItem
                          ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]"
                          : "bg-gray-500"
                      }`}
                    />
                    <span className={`font-bold ${isHoldingItem ? "text-blue-700" : "text-gray-500"}`}>
                      {isHoldingItem ? "YES" : "NO"}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">(Property: isHolding / holdItem)</span>
                  </div>
                }
              />
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {allPropertiesRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-green-100 border-2 border-green-500 p-4 rounded"
                >
                  <h3 className="font-bold text-green-800 mb-2">🎉 Congratulations!</h3>
                  <p className="text-green-700 text-sm">
                    You've successfully defined the properties for the Crane Robot! In OOP terms, you just created the 
                    <strong> attributes</strong> of the class. The METHODS section is now unlocked!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Educational Note */}
            <div className="mt-6 bg-blue-50 border-2 border-blue-300 p-4 rounded">
              <h3 className="font-bold text-blue-800 mb-2">💡 Did you know?</h3>
              <p className="text-blue-700 text-sm">
                In OOP, properties represent the <strong>state</strong> of an object. Just like our crane robot tracks 
                power, position, and whether it's holding something, real-world objects have properties too. 
                For example, a Car object might have properties like <code>color</code>, <code>speed</code>, and <code>fuelLevel</code>.
              </p>
            </div>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* METHODS Section */}
            <div className="bg-[#F5F5F5] border-2 border-black mt-4">
              <button
                onClick={() => setShowMethods(!showMethods)}
                disabled={!allPropertiesRevealed}
                className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                  allPropertiesRevealed 
                    ? "bg-[#E0E0E0] hover:bg-[#D0D0D0] cursor-pointer" 
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                <h2 className="text-xl font-bold text-black">METHODS</h2>
                {!allPropertiesRevealed && <span className="text-gray-500 text-sm">🔒 Locked</span>}
                {allPropertiesRevealed && (
                  <span className={`text-2xl transition-transform duration-300 ${showMethods ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                )}
              </button>
              
              <AnimatePresence initial={false}>
                {showMethods && allPropertiesRevealed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-4">
                      <p className="text-gray-700 mb-6">
                        In Object-Oriented Programming, <strong>methods</strong> (object functions/behavior) are the actions that an object can perform. 
                        They define the behavior of the object. Help define the methods for our Crane Robot!
                      </p>

                      <div className="space-y-4">
                        {/* Method 1: Power On */}
                        <PropertyQuestion
                          questionNumber={1}
                          question="What method should we call to turn the robot on and make it ready to operate?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) => answer.includes("power") && (answer.includes("on") || answer.includes("start"))}
                          onCorrect={() => revealMethod("power-on")}
                          isRevealed={revealedMethods["power-on"]}
                          errorMessage="The robot needs a method to power on."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-600" />
                              <span className="font-bold">Power On</span>
                              <span className="text-gray-500 text-sm">(Method: powerOn)</span>
                            </div>
                          }
                        />

                        {/* Method 2: Power Off */}
                        <PropertyQuestion
                          questionNumber={2}
                          question="What method should we call to turn the robot off and shut it down?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) => answer.includes("power") && (answer.includes("off") || answer.includes("stop"))}
                          onCorrect={() => revealMethod("power-off")}
                          isRevealed={revealedMethods["power-off"]}
                          errorMessage="The robot needs a method to power off."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-600" />
                              <span className="font-bold">Power Off</span>
                              <span className="text-gray-500 text-sm">(Method: powerOff)</span>
                            </div>
                          }
                        />

                        {/* Method 3: Move Left */}
                        <PropertyQuestion
                          questionNumber={3}
                          question="What method should move the claw to the left, toward the item zone?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) => answer.includes("left") || answer.includes("move")}
                          onCorrect={() => revealMethod("move-left")}
                          isRevealed={revealedMethods["move-left"]}
                          errorMessage="The robot needs a method to move left toward the item."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-600" />
                              <span className="font-bold">Move Left</span>
                              <span className="text-gray-500 text-sm">(Method: moveLeft)</span>
                            </div>
                          }
                        />

                        {/* Method 4: Move Right */}
                        <PropertyQuestion
                          questionNumber={4}
                          question="What method should move the claw to the right, toward the drop zone?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) => answer.includes("right") || answer.includes("move")}
                          onCorrect={() => revealMethod("move-right")}
                          isRevealed={revealedMethods["move-right"]}
                          errorMessage="The robot needs a method to move right toward the drop zone."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-600" />
                              <span className="font-bold">Move Right</span>
                              <span className="text-gray-500 text-sm">(Method: moveRight)</span>
                            </div>
                          }
                        />

                        {/* Method 5: Grab Item */}
                        <PropertyQuestion
                          questionNumber={5}
                          question="What method should make the robot grab an item with its claw?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) => answer.includes("grab") || answer.includes("pick")}
                          onCorrect={() => revealMethod("grab-item")}
                          isRevealed={revealedMethods["grab-item"]}
                          errorMessage="The robot needs a method to grab items."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-600" />
                              <span className="font-bold">Grab Item</span>
                              <span className="text-gray-500 text-sm">(Method: grabItem)</span>
                            </div>
                          }
                        />

                        {/* Method 6: Drop Item */}
                        <PropertyQuestion
                          questionNumber={6}
                          question="What method should make the robot release/drop the item it's holding?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) => answer.includes("drop") || answer.includes("release")}
                          onCorrect={() => revealMethod("drop-item")}
                          isRevealed={revealedMethods["drop-item"]}
                          errorMessage="The robot needs a method to drop items."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-600" />
                              <span className="font-bold">Drop Item</span>
                              <span className="text-gray-500 text-sm">(Method: dropItem)</span>
                            </div>
                          }
                        />
                      </div>

                      {/* Success Message for Methods */}
                      <AnimatePresence>
                        {allMethodsRevealed && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 bg-green-100 border-2 border-green-500 p-4 rounded"
                          >
                            <h3 className="font-bold text-green-800 mb-2">🎉 Fantastic!</h3>
                            <p className="text-green-700 text-sm">
                              You've defined all the methods for the Crane Robot! In OOP terms, you just created the 
                              <strong> behaviors</strong> of the class. All robot controls are now unlocked!
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Educational Note for Methods */}
                      <div className="mt-6 bg-blue-50 border-2 border-blue-300 p-4 rounded">
                        <h3 className="font-bold text-blue-800 mb-2">💡 Did you know?</h3>
                        <p className="text-blue-700 text-sm">
                          In OOP, methods represent the <strong>behavior</strong> of an object. They are functions that 
                          operate on the object's data (properties). For example, a Car object might have methods like 
                          <code>accelerate()</code>, <code>brake()</code>, and <code>honk()</code>.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="bg-[#C0C0C0] border-t-2 border-black px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-black text-sm">Challenge 01 - Limbus Tech Emulator</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-5 bg-[#C0C0C0] border-2 border-black flex items-center justify-center">
              <span className="text-black text-xs">◀</span>
            </div>
            <div className="w-32 h-5 bg-[#A0A0A0] border-2 border-black"></div>
            <div className="w-6 h-5 bg-[#C0C0C0] border-2 border-black flex items-center justify-center">
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
