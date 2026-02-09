import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

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
  { id: "power-off", label: "Power Off", description: "Claw is powered down" },
  { id: "power-on", label: "Power On", description: "Claw is ready" },
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
      width="200"
      height="400"
      viewBox="0 0 100 200"
      className={`overflow-visible transition-opacity duration-500 ${
        isPowered ? "opacity-100" : "opacity-40"
      }`}
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
        transition={{ duration: TIMING.lowerCrane, ease: "easeInOut" }}
      />

      {/* Moving part - Hub and claws - animated */}
      <motion.g
        animate={{ y: cableExtension }}
        transition={{ duration: TIMING.lowerCrane, ease: "easeInOut" }}
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
        <g transform={`rotate(${animatedClawAngle}, 50, 54)`}>
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
        <g transform={`rotate(${-animatedClawAngle}, 50, 54)`}>
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

// Main Claw Machine Component
interface CraneRobotProps {
  state: CraneState;
  width?: number;
  height?: number;
  showStatus?: boolean;
  className?: string;
  onSubStateChange?: (subState: string | null) => void;
  onPositionChange?: (position: number) => void;
  onHoldingChange?: (isHolding: boolean) => void;
  serialNumber?: string;
  showSerialNumber?: boolean;
}

export function CraneRobot({
  state,
  width = 800,
  height = 500,
  showStatus = true,
  className = "",
  onSubStateChange,
  onPositionChange,
  onHoldingChange,
  serialNumber = "???",
  showSerialNumber = false
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
    onPositionChange?.(-200);
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
  }, [isPowered, onSubStateChange, onPositionChange]);

  // Execute drop sequence
  const executeDropSequence = useCallback(async () => {
    if (!isPowered) return;

    // Step 1: Move to drop zone (if not already there)
    setDropSubState("moving");
    onSubStateChange?.("moving");
    setCraneX(200);
    onPositionChange?.(200);
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
  }, [isPowered, onSubStateChange, onPositionChange]);

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
  }, [
    state,
    isPowered,
    executeGrabSequence,
    executeDropSequence,
    onSubStateChange,
    onPositionChange,
    onHoldingChange
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

  return (
    <div
      className={`relative bg-[#F5F5F5] border-2 border-black overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Track/Rail */}
      <div className="absolute top-16 left-0 right-0 h-4 bg-[#C0C0C0] border-b border-black" />

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
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#C0C0C0] border-t border-black flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {showSerialNumber ? (
            <motion.span
              key="serial-revealed"
              className="text-sm font-bold text-[#D06000]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              Claw Machine #{serialNumber}
            </motion.span>
          ) : (
            <motion.span
              key="serial-hidden"
              className="text-sm font-bold text-gray-500"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Claw Machine #???
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div className="absolute top-4 left-4 bg-[#E0E0E0] px-4 py-2 border-2 border-black">
          <div className="flex items-center gap-3">
            <PowerIndicator isOn={isPowered} />
            <div className="h-4 w-px bg-black" />
            <div>
              <div className="text-xs text-gray-900 uppercase tracking-wider">
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
    const audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();

    // Create oscillator for the main tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure the sound - a pleasant ascending chime
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(
      783.99,
      audioContext.currentTime + 0.1
    ); // G5

    // Volume envelope - quick attack, smooth decay
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

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
    gainNode2.gain.linearRampToValueAtTime(
      0.15,
      audioContext.currentTime + 0.05
    );
    gainNode2.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.4
    );

    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.4);
  } catch {
    // Silently fail if audio is not supported
  }
}

// Play a gentle error sound with decrescendo - sad descending chime
function playErrorSound() {
  try {
    const audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();

    // Main oscillator - sine wave for smoothness (like success sound)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Descending decrescendo: G4 (392Hz) down to C4 (261.63Hz)
    // This is the reverse direction of the success sound
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
    oscillator.frequency.exponentialRampToValueAtTime(
      261.63,
      audioContext.currentTime + 0.4
    ); // C4 - descending

    // Decrescendo volume envelope - fades out smoothly
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.05); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.5
    ); // Long smooth fade out

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Second oscillator for harmony - perfect 5th below (descending)
    // Eb4 (311.13Hz) down to G3 (196Hz)
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);

    oscillator2.type = "triangle";
    oscillator2.frequency.setValueAtTime(311.13, audioContext.currentTime); // Eb4
    oscillator2.frequency.exponentialRampToValueAtTime(
      196,
      audioContext.currentTime + 0.4
    ); // G3 - descending

    // Decrescendo for second oscillator
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode2.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.45
    );

    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.45);
  } catch {
    // Silently fail if audio is not supported
  }
}

// Confetti Particle Component
function ConfettiParticle({ color, delay }: { color: string; delay: number }) {
  const randomX = (Math.random() - 0.5) * 300;
  const randomRotation = Math.random() * 720 - 360;
  const randomScale = 0.5 + Math.random() * 0.5;

  return (
    <motion.div
      className="absolute w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
      initial={{
        x: 0,
        y: 0,
        scale: 0,
        rotate: 0,
        opacity: 1
      }}
      animate={{
        x: randomX,
        y: [0, -100, 200],
        scale: [0, randomScale, 0],
        rotate: randomRotation,
        opacity: [1, 1, 0]
      }}
      transition={{
        duration: 1.5,
        delay: delay,
        ease: "easeOut"
      }}
    />
  );
}

// Success Animation Component
function SuccessAnimation({ type }: { type: "property" | "method" }) {
  const colors = ["#F7931E", "#22C55E", "#3B82F6", "#EAB308", "#EC4899"];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {/* Confetti burst */}
      {[...Array(20)].map((_, i) => (
        <ConfettiParticle
          key={i}
          color={colors[i % colors.length]}
          delay={i * 0.02}
        />
      ))}

      {/* Star burst */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 80;
        return (
          <motion.div
            key={`star-${i}`}
            className="absolute text-2xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance
            }}
            transition={{
              duration: 0.8,
              delay: 0.1,
              ease: "easeOut"
            }}
          >
            ⭐
          </motion.div>
        );
      })}

      {/* Main badge */}
      <motion.div
        className="absolute"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: [0, 1.2, 1], rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.2
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 0.5,
            delay: 0.5
          }}
          className={`px-6 py-3 border-4 border-black shadow-xl ${
            type === "method" ? "bg-purple-500" : "bg-green-500"
          }`}
        >
          <span className="text-white font-black text-xl uppercase tracking-wider">
            {type === "method" ? "🔓 Method Unlocked!" : "🔓 Property Found!"}
          </span>
        </motion.div>
      </motion.div>

      {/* Floating emojis */}
      <motion.div
        className="absolute text-4xl"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: -100, opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, delay: 0.3 }}
      >
        {type === "method" ? "⚙️" : "📦"}
      </motion.div>
    </div>
  );
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
  const [showAnimation, setShowAnimation] = useState(false);

  const handleSubmit = () => {
    if (validateAnswer(answer.toLowerCase())) {
      setIsCorrect(true);
      setShowError(false);
      setShowAnimation(true);
      playSuccessSound();
      onCorrect();
      // Hide animation after 2 seconds
      setTimeout(() => setShowAnimation(false), 2000);
    } else {
      setShowError(true);
      playErrorSound();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (isRevealed || isCorrect) {
    return (
      <motion.div
        className="bg-green-50 border-2 border-green-500 p-4 rounded relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {showAnimation && <SuccessAnimation type={type} />}
        <motion.div
          className="flex items-center gap-2 mb-2"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-lg font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, delay: 0.4 }}
          >
            ✓
          </motion.div>
          <motion.span
            className="text-green-700 font-bold text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {type === "method" ? "Method Unlocked!" : "Property Unlocked!"}
          </motion.span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {revealedContent}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-[#F8F8F8] border-2 border-black p-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <motion.span
          className="text-[#F7931E] font-bold text-lg"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: questionNumber * 0.1 }}
        >
          {questionNumber}.
        </motion.span>
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
            className="w-full px-3 py-2 bg-white border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:border-[#F7931E] transition-colors"
          />
          <AnimatePresence>
            {showError && (
              <motion.p
                className="text-red-600 text-sm mt-2 flex items-center gap-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span>❌</span> {errorMessage}
              </motion.p>
            )}
          </AnimatePresence>
          <motion.button
            onClick={handleSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-3 px-4 py-2 bg-[#E0E0E0] border-2 border-black text-black font-medium hover:bg-[#D0D0D0] active:bg-[#C0C0C0]"
          >
            Check Answer
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Demo page with controls
export default function Challenge01() {
  const [craneState, setCraneState] = useState<CraneState>("power-off");
  const [subState, setSubState] = useState<string | null>(null);
  const [cranePosition, setCranePosition] = useState<number>(0);
  const [isHoldingItem, setIsHoldingItem] = useState<boolean>(false);
  const [serialNumber] = useState<string>(
    "CR-2024-" + Math.floor(1000 + Math.random() * 9000)
  );

  // Revealed state for properties
  const [revealedProperties, setRevealedProperties] = useState({
    power: false,
    position: false,
    hold: false,
    serial: false
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
    setRevealedProperties((prev) => ({ ...prev, [property]: true }));
  };

  const revealMethod = (method: keyof typeof revealedMethods) => {
    setRevealedMethods((prev) => ({ ...prev, [method]: true }));
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
  const allPropertiesRevealed = Object.values(revealedProperties).every(
    (v) => v
  );

  // Check if all methods are revealed
  const allMethodsRevealed = Object.values(revealedMethods).every((v) => v);

  // Auto-open methods section when properties are done
  useEffect(() => {
    if (allPropertiesRevealed) {
      setShowMethods(true);
    }
  }, [allPropertiesRevealed]);

  // Blueprint dialog state
  const [showBlueprint, setShowBlueprint] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
      {/* Header Bar - Orange */}
      <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-black tracking-wide">
            Challenge 01 - Build a Machine with OOP
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
          <Link
            to="/"
            className="text-black hover:underline tracking-wider"
          >
            Home
          </Link>
          <Link
            to="/crane"
            className="text-black hover:underline tracking-wider"
          >
            Crane
          </Link>
          <Link
            to="/conveyor"
            className="text-black hover:underline tracking-wider"
          >
            Conveyor
          </Link>
          <span className="font-bold text-black tracking-wider">
            Challenge 01
          </span>
          <Link
            to="/crane-factory"
            className="text-black hover:underline tracking-wider"
          >
            Claw Factory
          </Link>
          <Link
            to="/challenge-02"
            className="text-black hover:underline tracking-wider"
          >
            Challenge 02
          </Link>
          <Link
            to="/assembly-line"
            className="text-black hover:underline tracking-wider"
          >
            Assembly Line
          </Link>
          <Link
            to="/machine-hierarchy"
            className="text-black hover:underline tracking-wider"
          >
            Machine Hierarchy
          </Link>
        </div>
      </nav>

      {/* Main Content - Two Column Layout */}
      <main className="flex-1 bg-white border-2 border-black m-4 p-6 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column - Claw Machine View */}
          <div className="flex flex-col lg:sticky lg:top-6 z-10">
            <h2 className="text-xl font-bold text-black mb-4 text-center">
              Claw Machine
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
              serialNumber={serialNumber}
              showSerialNumber={revealedProperties.serial}
            />

            {/* Controls */}
            <div className="mt-4 space-y-4">
              {/* Status Card - With ??? placeholders */}
              <div className="bg-[#E0E0E0] border-2 border-black p-6">
                <div className="flex items-center justify-around">
                  {/* Power Status */}
                  <div className="flex flex-col items-center gap-2">
                    <AnimatePresence mode="wait">
                      {revealedProperties.power ? (
                        <motion.div
                          key="power-label"
                          className="text-xs text-gray-900 uppercase tracking-wider"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          Power
                        </motion.div>
                      ) : (
                        <motion.div
                          key="power-hidden"
                          className="text-xs text-gray-500 uppercase tracking-wider"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          ???
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      {revealedProperties.power ? (
                        <motion.div
                          key="power-value"
                          className="flex items-center gap-2"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                        >
                          <motion.div
                            className={`w-6 h-6 rounded-full ${
                              craneState !== "power-off"
                                ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                                : "bg-gray-500 shadow-none"
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                          />
                          <motion.span
                            className={`text-lg font-bold ${craneState !== "power-off" ? "text-green-600" : "text-gray-500"}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            {craneState !== "power-off" ? "ON" : "OFF"}
                          </motion.span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="power-locked"
                          className="text-2xl font-mono font-bold text-gray-500"
                          animate={{
                            opacity: [1, 0.5, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ???
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="h-12 w-px bg-black" />
                  {/* Claw Position */}
                  <div className="flex flex-col items-center gap-2">
                    <AnimatePresence mode="wait">
                      {revealedProperties.position ? (
                        <motion.div
                          key="position-label"
                          className="text-xs text-gray-900 uppercase tracking-wider"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          Claw Position
                        </motion.div>
                      ) : (
                        <motion.div
                          key="position-hidden"
                          className="text-xs text-gray-500 uppercase tracking-wider"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          ???
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      {revealedProperties.position ? (
                        <motion.div
                          key="position-value"
                          className="text-2xl font-mono font-bold text-[#D06000]"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                          }}
                        >
                          {getPositionLabel(cranePosition)}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="position-locked"
                          className="text-2xl font-mono font-bold text-gray-500"
                          animate={{
                            opacity: [1, 0.5, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.3
                          }}
                        >
                          ???
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="h-12 w-px bg-black" />
                  {/* Holding Item */}
                  <div className="flex flex-col items-center gap-2">
                    <AnimatePresence mode="wait">
                      {revealedProperties.hold ? (
                        <motion.div
                          key="hold-label"
                          className="text-xs text-gray-900 uppercase tracking-wider"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          Holding Item
                        </motion.div>
                      ) : (
                        <motion.div
                          key="hold-hidden"
                          className="text-xs text-gray-500 uppercase tracking-wider"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          ???
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      {revealedProperties.hold ? (
                        <motion.div
                          key="hold-value"
                          className="flex items-center gap-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                        >
                          <motion.div
                            className={`w-6 h-6 rounded-full ${
                              isHoldingItem
                                ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]"
                                : "bg-gray-500 shadow-none"
                            }`}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring" }}
                          />
                          <motion.span
                            className={`text-lg font-bold ${isHoldingItem ? "text-blue-700" : "text-gray-500"}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            {isHoldingItem ? "YES" : "NO"}
                          </motion.span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="hold-locked"
                          className="text-2xl font-mono font-bold text-gray-500"
                          animate={{
                            opacity: [1, 0.5, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.6
                          }}
                        >
                          ???
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                        // Show ??? placeholder with pulse animation
                        return (
                          <motion.div
                            key={stateDef.id}
                            className="px-4 py-3 bg-[#D0D0D0] border-2 border-black text-center"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: Math.random()
                            }}
                          >
                            <div className="text-2xl font-mono font-bold text-gray-500">
                              ???
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.button
                          key={stateDef.id}
                          onClick={() => handleStateChange(stateDef.id)}
                          disabled={isDisabled}
                          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          whileHover={!isDisabled ? { scale: 1.02 } : {}}
                          whileTap={!isDisabled ? { scale: 0.98 } : {}}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                          }}
                          className={`
                            px-4 py-3 font-medium transition-all text-left border-2
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
                                className={`w-3 h-3 rounded-full ${isActive ? "bg-red-500" : "bg-red-600"}`}
                              />
                            )}
                            {stateDef.id === "power-on" && (
                              <div
                                className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : "bg-green-600"}`}
                              />
                            )}
                            <span>{stateDef.label}</span>
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            {stateDef.description}
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hint when properties not all revealed */}
              {!allPropertiesRevealed && (
                <div className="bg-[#F7931E]/20 border-2 border-[#F7931E] p-4 text-center">
                  <p className="text-[#D06000] font-medium">
                    🔒 Complete all property questions to unlock the next
                    section
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
            <div className="bg-[#FAFAFA] border-2 border-black">
              <button
                onClick={() => setShowProperties(!showProperties)}
                className="w-full px-6 py-4 flex items-center justify-between bg-[#F0F0F0] hover:bg-[#E0E0E0] transition-colors"
              >
                <h2 className="text-xl font-bold text-black">PROPERTIES</h2>
                <span
                  className={`text-2xl transition-transform duration-300 ${showProperties ? "rotate-180" : ""}`}
                >
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
                      <p className="text-gray-900 mb-6">
                        In Object-Oriented Programming,{" "}
                        <strong>properties</strong> are the object's
                        characteristics - the data that an object needs to keep
                        track of. Help define the properties for our Crane
                        Machine!
                      </p>

                      <div className="space-y-4">
                        {/* Question 1: Serial Number */}
                        <PropertyQuestion
                          questionNumber={1}
                          question="The machine needs a unique identifier to distinguish it from other machines. What property should store this identifier?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) =>
                            answer.includes("serial") ||
                            answer.includes("id") ||
                            answer.includes("number")
                          }
                          onCorrect={() => revealProperty("serial")}
                          isRevealed={revealedProperties.serial}
                          errorMessage="The machine should have a unique identifier like a serial number."
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-mono font-bold text-[#D06000]">
                                {serialNumber}
                              </span>
                              <span className="text-gray-500 text-sm">
                                (Property: SerialNumber)
                              </span>
                            </div>
                          }
                        />

                        {/* Question 2: Power */}
                        <PropertyQuestion
                          questionNumber={2}
                          question="The machine needs to know if it's turned on or off. What property name should we use to store this?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) => answer.includes("power")}
                          onCorrect={() => revealProperty("power")}
                          isRevealed={revealedProperties.power}
                          errorMessage="The machine should know if its power is on or not."
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full ${
                                  craneState !== "power-off"
                                    ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                                    : "bg-gray-500"
                                }`}
                              />
                              <span
                                className={`font-bold ${craneState !== "power-off" ? "text-green-600" : "text-gray-500"}`}
                              >
                                {craneState !== "power-off" ? "ON" : "OFF"}
                              </span>
                              <span className="text-gray-500 text-sm ml-2">
                                (Property: Power)
                              </span>
                            </div>
                          }
                        />

                        {/* Question 3: Position */}
                        <PropertyQuestion
                          questionNumber={3}
                          question="The machine needs to track where its claw is located (left, center, or right). What property name should we use?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) =>
                            answer.includes("position")
                          }
                          onCorrect={() => revealProperty("position")}
                          isRevealed={revealedProperties.position}
                          errorMessage="The machine should know the position of its claw."
                          revealedContent={
                            <div className="text-xl font-mono font-bold text-[#D06000]">
                              {getPositionLabel(cranePosition)}
                              <span className="text-gray-500 text-sm ml-2">
                                (Property: Position)
                              </span>
                            </div>
                          }
                        />

                        {/* Question 4: Hold */}
                        <PropertyQuestion
                          questionNumber={4}
                          question="The machine needs to remember whether it's currently holding an item or not. What property name should we use?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) => answer.includes("hold")}
                          onCorrect={() => revealProperty("hold")}
                          isRevealed={revealedProperties.hold}
                          errorMessage="The machine should know if it's holding an item."
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full ${
                                  isHoldingItem
                                    ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]"
                                    : "bg-gray-500"
                                }`}
                              />
                              <span
                                className={`font-bold ${isHoldingItem ? "text-blue-700" : "text-gray-500"}`}
                              >
                                {isHoldingItem ? "YES" : "NO"}
                              </span>
                              <span className="text-gray-500 text-sm ml-2">
                                (Property: IsHolding / HoldItem)
                              </span>
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
                            <h3 className="font-bold text-green-800 mb-2">
                              🎉 Congratulations!
                            </h3>
                            <p className="text-green-700 text-sm">
                              You've successfully defined the properties for the
                              Claw Machine! In OOP terms, you just created the
                              <strong> properties</strong> of the class. The
                              METHODS section is now unlocked!
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Educational Note */}
                      <div className="mt-6 bg-blue-50 border-2 border-blue-300 p-4 rounded">
                        <h3 className="font-bold text-blue-800 mb-2">
                          💡 Did you know?
                        </h3>
                        <p className="text-blue-700 text-sm">
                          In OOP, properties represent the{" "}
                          <strong>state</strong> of an object. Just like our
                          claw machine tracks power, position, and whether it's
                          holding something, real-world objects have properties
                          too. For example, a Car object might have properties
                          like <code>color</code>, <code>speed</code>, and{" "}
                          <code>fuelLevel</code>.
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
                    ? "bg-[#F0F0F0] hover:bg-[#E0E0E0] cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                <h2 className="text-xl font-bold text-black">METHODS</h2>
                {!allPropertiesRevealed && (
                  <span className="text-gray-500 text-sm">🔒 Locked</span>
                )}
                {allPropertiesRevealed && (
                  <span
                    className={`text-2xl transition-transform duration-300 ${showMethods ? "rotate-180" : ""}`}
                  >
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
                      <p className="text-gray-900 mb-6">
                        In Object-Oriented Programming, <strong>methods</strong>{" "}
                        (object functions/behavior) are the actions that an
                        object can perform. They define the behavior of the
                        object. Help define the methods for our Claw Machine!
                      </p>

                      <div className="space-y-4">
                        {/* Method 1: Power On */}
                        <PropertyQuestion
                          questionNumber={1}
                          question="What method should we call to turn the machine on and make it ready to operate?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) =>
                            answer.includes("power") &&
                            (answer.includes("on") || answer.includes("start"))
                          }
                          onCorrect={() => revealMethod("power-on")}
                          isRevealed={revealedMethods["power-on"]}
                          errorMessage="The machine needs a method to power on."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-600" />
                              <span className="font-bold">Power On</span>
                              <span className="text-gray-500 text-sm">
                                (Method: PowerOn)
                              </span>
                            </div>
                          }
                        />

                        {/* Method 2: Power Off */}
                        <PropertyQuestion
                          questionNumber={2}
                          question="What method should we call to turn the machine off and shut it down?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) =>
                            answer.includes("power") &&
                            (answer.includes("off") || answer.includes("stop"))
                          }
                          onCorrect={() => revealMethod("power-off")}
                          isRevealed={revealedMethods["power-off"]}
                          errorMessage="The machine needs a method to power off."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-600" />
                              <span className="font-bold">Power Off</span>
                              <span className="text-gray-500 text-sm">
                                (Method: PowerOff)
                              </span>
                            </div>
                          }
                        />

                        {/* Method 3: Move Left */}
                        <PropertyQuestion
                          questionNumber={3}
                          question="What method should move the claw to the left, toward the item zone?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) =>
                            answer.includes("left") || answer.includes("move")
                          }
                          onCorrect={() => revealMethod("move-left")}
                          isRevealed={revealedMethods["move-left"]}
                          errorMessage="The machine needs a method to move left toward the item."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-600" />
                              <span className="font-bold">Move Left</span>
                              <span className="text-gray-500 text-sm">
                                (Method: MoveLeft)
                              </span>
                            </div>
                          }
                        />

                        {/* Method 4: Move Right */}
                        <PropertyQuestion
                          questionNumber={4}
                          question="What method should move the claw to the right, toward the drop zone?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) =>
                            answer.includes("right") || answer.includes("move")
                          }
                          onCorrect={() => revealMethod("move-right")}
                          isRevealed={revealedMethods["move-right"]}
                          errorMessage="The machine needs a method to move right toward the drop zone."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-600" />
                              <span className="font-bold">Move Right</span>
                              <span className="text-gray-500 text-sm">
                                (Method: MoveRight)
                              </span>
                            </div>
                          }
                        />

                        {/* Method 5: Grab Item */}
                        <PropertyQuestion
                          questionNumber={5}
                          question="What method should make the machine grab an item with its claw?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) =>
                            answer.includes("grab") || answer.includes("pick")
                          }
                          onCorrect={() => revealMethod("grab-item")}
                          isRevealed={revealedMethods["grab-item"]}
                          errorMessage="The machine needs a method to grab items."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-600" />
                              <span className="font-bold">Grab Item</span>
                              <span className="text-gray-500 text-sm">
                                (Method: GrabItem)
                              </span>
                            </div>
                          }
                        />

                        {/* Method 6: Drop Item */}
                        <PropertyQuestion
                          questionNumber={6}
                          question="What method should make the machine release/drop the item it's holding?"
                          placeholder="Type your answer..."
                          validateAnswer={(answer) =>
                            answer.includes("drop") ||
                            answer.includes("release")
                          }
                          onCorrect={() => revealMethod("drop-item")}
                          isRevealed={revealedMethods["drop-item"]}
                          errorMessage="The machine needs a method to drop items."
                          type="method"
                          revealedContent={
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-600" />
                              <span className="font-bold">Drop Item</span>
                              <span className="text-gray-500 text-sm">
                                (Method: DropItem)
                              </span>
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
                            <h3 className="font-bold text-green-800 mb-2">
                              🎉 Fantastic!
                            </h3>
                            <p className="text-green-700 text-sm">
                              You've defined all the methods for the Crane
                              Machine! In OOP terms, you just created the
                              <strong> behaviors</strong> of the class. All
                              machine controls are now unlocked!
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Educational Note for Methods */}
                      <div className="mt-6 bg-blue-50 border-2 border-blue-300 p-4 rounded">
                        <h3 className="font-bold text-blue-800 mb-2">
                          💡 Did you know?
                        </h3>
                        <p className="text-blue-700 text-sm">
                          In OOP, methods represent the{" "}
                          <strong>behavior</strong> of an object. They are
                          functions that operate on the object's data
                          (properties). For example, a Car object might have
                          methods like
                          <code>accelerate()</code>, <code>brake()</code>, and{" "}
                          <code>honk()</code>.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Print Blueprint Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <button
                onClick={() =>
                  allPropertiesRevealed &&
                  allMethodsRevealed &&
                  setShowBlueprint(true)
                }
                disabled={!allPropertiesRevealed || !allMethodsRevealed}
                className={`w-full px-6 py-4 border-2 border-black font-bold text-lg transition-colors flex items-center justify-center gap-3 ${
                  allPropertiesRevealed && allMethodsRevealed
                    ? "bg-[#F7931E] text-black hover:bg-[#E08000] cursor-pointer"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                }`}
              >
                <span>🖨️</span>
                Print Blueprint
                {(!allPropertiesRevealed || !allMethodsRevealed) && (
                  <span className="text-sm font-normal ml-2">
                    🔒 Complete all questions
                  </span>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Blueprint Dialog */}
      <BlueprintDialog
        isOpen={showBlueprint}
        onClose={() => setShowBlueprint(false)}
      />

      {/* Footer Bar */}
      <footer className="bg-[#E8E8E8] border-t-2 border-black px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-black text-sm">
            Challenge 01 - Limbus Tech Emulator
          </span>
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

// C# Code for the ClawMachine class
const csharpCode = `public class ClawMachine
{
    // Properties
    private string SerialNumber;
    private bool Power;
    private string Position;
    private bool IsHolding;

    // Constructor
    public ClawMachine()
    {
        SerialNumber = "CR-2024-0000";
        Power = false;
        Position = "Center";
        IsHolding = false;
    }

    // Methods
    public void PowerOn()
    {
        Power = true;
        Console.WriteLine("Claw powered on");
    }

    public void PowerOff()
    {
        Power = false;
        Console.WriteLine("Claw powered off");
    }

    public void MoveLeft()
    {
        if (Power)
        {
            Position = "Left";
            Console.WriteLine("Moving left to item zone");
        }
    }

    public void MoveRight()
    {
        if (Power)
        {
            Position = "Right";
            Console.WriteLine("Moving right to drop zone");
        }
    }

    public void GrabItem()
    {
        if (Power && Position == "Left")
        {
            IsHolding = true;
            Console.WriteLine("Item grabbed");
        }
    }

    public void DropItem()
    {
        if (Power && IsHolding)
        {
            IsHolding = false;
            Console.WriteLine("Item dropped");
        }
    }
}`;

// Blueprint Dialog Component
interface BlueprintDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function BlueprintDialog({ isOpen, onClose }: BlueprintDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-[#282828] border-2 border-[#F7931E] rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#F7931E] border-b-2 border-black px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">
            📋 Claw Machine Class
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#E0E0E0] border-2 border-black flex items-center justify-center hover:bg-[#D0D0D0]"
          >
            <span className="text-black text-lg">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - UML */}
            <div>
              <h3 className="text-[#F7931E] font-bold text-lg mb-4 border-b border-[#F7931E]/30 pb-2">
                UML Class Diagram
              </h3>
              <div className="bg-[#1d2021] border border-[#504945] rounded p-4 font-mono text-sm">
                {/* UML Box */}
                <div className="border-2 border-white/30 rounded overflow-hidden">
                  {/* Class Name */}
                  <div className="bg-[#3c3836] border-b-2 border-white/30 p-3 text-center">
                    <span className="text-[#fabd2f] font-bold text-lg">
                      ClawMachine
                    </span>
                  </div>

                  {/* Properties Section */}
                  <div className="border-b-2 border-white/30 p-3">
                    <div className="text-[#b8bb26] mb-2 text-xs uppercase tracking-wider">
                      Properties
                    </div>
                    <div className="text-[#ebdbb2] space-y-1">
                      <div>- SerialNumber: string</div>
                      <div>- Power: bool</div>
                      <div>- Position: string</div>
                      <div>- IsHolding: bool</div>
                    </div>
                  </div>

                  {/* Methods Section */}
                  <div className="p-3">
                    <div className="text-[#b8bb26] mb-2 text-xs uppercase tracking-wider">
                      Methods
                    </div>
                    <div className="text-[#83a598] space-y-1">
                      <div>+ PowerOn()</div>
                      <div>+ PowerOff()</div>
                      <div>+ MoveLeft()</div>
                      <div>+ MoveRight()</div>
                      <div>+ GrabItem()</div>
                      <div>+ DropItem()</div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 text-xs text-[#a89984]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#ebdbb2]">-</span> private
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#83a598]">+</span> public
                  </div>
                </div>
              </div>

              {/* OOP Concepts */}
              <div className="mt-4 bg-[#3c3836] border border-[#504945] rounded p-4">
                <h4 className="text-[#fabd2f] font-bold mb-2">
                  OOP Concepts Used
                </h4>
                <ul className="text-[#ebdbb2] text-sm space-y-1">
                  <li>
                    • <strong className="text-[#b8bb26]">Class:</strong>{" "}
                    Blueprint for the machine
                  </li>
                  <li>
                    • <strong className="text-[#b8bb26]">Properties:</strong>{" "}
                    Object's state/data
                  </li>
                  <li>
                    • <strong className="text-[#b8bb26]">Methods:</strong>{" "}
                    Object's behavior
                  </li>
                  <li>
                    • <strong className="text-[#b8bb26]">Encapsulation:</strong>{" "}
                    Data + Behavior together
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - C# Code */}
            <div>
              <h3 className="text-[#F7931E] font-bold text-lg mb-4 border-b border-[#F7931E]/30 pb-2">
                C# Implementation
              </h3>
              <div className="rounded overflow-hidden">
                <SyntaxHighlighter
                  language="csharp"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.85rem",
                    lineHeight: "1.5",
                    backgroundColor: "#1d2021"
                  }}
                >
                  {csharpCode}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
