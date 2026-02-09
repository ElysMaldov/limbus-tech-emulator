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
const GRAB_SUB_STATES = ["moving", "opening", "lowering", "grabbing", "lifting"] as const;
type GrabSubState = (typeof GRAB_SUB_STATES)[number];

// Sub-states for drop-item sequence
const DROP_SUB_STATES = ["moving", "dropping"] as const;
type DropSubState = (typeof DROP_SUB_STATES)[number];

// State definitions for UI
const STATE_DEFINITIONS: { id: CraneState; label: string; description: string }[] = [
  { id: "power-off", label: "Power Off", description: "Claw is powered down" },
  { id: "power-on", label: "Power On", description: "Claw is ready" },
  { id: "move-left", label: "Move Left", description: "Move to item zone" },
  { id: "move-right", label: "Move Right", description: "Move to drop zone" },
  { id: "grab-item", label: "Grab Item", description: "Grab sequence" },
  { id: "drop-item", label: "Drop Item", description: "Drop sequence" }
];

// Access modifier type
type AccessModifier = "public" | "private";

// Field definitions for encapsulation challenge
interface FieldDefinition {
  id: string;
  name: string;
  type: "property" | "method";
  correctAccess: AccessModifier;
  description: string;
}

const ENCAPSULATION_FIELDS: FieldDefinition[] = [
  { id: "serialNumber", name: "SerialNumber", type: "property", correctAccess: "public", description: "Unique identifier for the machine" },
  { id: "power", name: "Power", type: "property", correctAccess: "public", description: "Current power state (on/off)" },
  { id: "position", name: "Position", type: "property", correctAccess: "public", description: "Claw position (left/center/right)" },
  { id: "isHolding", name: "IsHolding", type: "property", correctAccess: "public", description: "Whether machine is holding an item" },
  { id: "biosPassword", name: "BiosPassword", type: "property", correctAccess: "private", description: "4-digit system maintenance code" },
  { id: "powerOn", name: "PowerOn()", type: "method", correctAccess: "public", description: "Turn the machine on" },
  { id: "powerOff", name: "PowerOff()", type: "method", correctAccess: "public", description: "Turn the machine off" },
  { id: "moveLeft", name: "MoveLeft()", type: "method", correctAccess: "public", description: "Move claw to the left" },
  { id: "moveRight", name: "MoveRight()", type: "method", correctAccess: "public", description: "Move claw to the right" },
  { id: "grabItem", name: "GrabItem()", type: "method", correctAccess: "public", description: "Grab an item with the claw" },
  { id: "dropItem", name: "DropItem()", type: "method", correctAccess: "public", description: "Drop the held item" },
  { id: "systemMaintenance", name: "SystemMaintenance()", type: "method", correctAccess: "private", description: "Perform routine system diagnostics and maintenance" },
];

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

// Private Overlay Component - Shows when sensitive data is protected
function PrivateOverlay({ 
  isBiosPasswordPrivate, 
  isSystemMaintenancePrivate,
  hasFullProtection 
}: { 
  isBiosPasswordPrivate: boolean;
  isSystemMaintenancePrivate: boolean;
  hasFullProtection: boolean;
}) {
  const [showOverlay, setShowOverlay] = useState(true);
  
  // Auto-hide after 5 seconds
  useEffect(() => {
    if (isBiosPasswordPrivate || isSystemMaintenancePrivate) {
      setShowOverlay(true);
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isBiosPasswordPrivate, isSystemMaintenancePrivate]);
  
  if ((!isBiosPasswordPrivate && !isSystemMaintenancePrivate) || !showOverlay) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated lock icons floating up */}
      <AnimatePresence>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            initial={{ 
              y: 100, 
              x: (i - 2) * 60, 
              opacity: 0,
              scale: 0.5
            }}
            animate={{ 
              y: -150, 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1, 0.8]
            }}
            transition={{ 
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 1
            }}
          >
            🔒
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main overlay badge */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={`
          px-8 py-4 border-4 border-black shadow-2xl transform -rotate-6
          ${hasFullProtection 
            ? "bg-green-500" 
            : "bg-[#F7931E]"
          }
        `}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-center"
        >
          <div className="text-5xl mb-2">
            {hasFullProtection ? "🔒🔒" : "🔒"}
          </div>
          <div className="text-3xl font-black text-black uppercase tracking-widest">
            {hasFullProtection ? "FULLY SECURED!" : "PRIVATE!"}
          </div>
          <div className="text-sm font-bold text-black mt-1">
            {isBiosPasswordPrivate && "BiosPassword"}
            {isBiosPasswordPrivate && isSystemMaintenancePrivate && " + "}
            {isSystemMaintenancePrivate && "SystemMaintenance()"}
          </div>
          <div className="text-xs text-black/70 mt-1">
            {hasFullProtection 
              ? "All sensitive data is now protected!" 
              : "Protected from unauthorized access!"
            }
          </div>
        </motion.div>
      </motion.div>

      {/* Shield pulse effect */}
      <motion.div
        className="absolute inset-0 border-8 border-green-500/0"
        animate={{
          borderColor: hasFullProtection 
            ? ["rgba(34,197,94,0)", "rgba(34,197,94,0.5)", "rgba(34,197,94,0)"] 
            : ["rgba(247,147,30,0)", "rgba(247,147,30,0.5)", "rgba(247,147,30,0)"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}

// Explosion Animation Component
function ExplosionEffect({ isPlaying }: { isPlaying: boolean }) {
  if (!isPlaying) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {/* Shockwave rings */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-4 border-red-600"
          initial={{ width: 50, height: 50, opacity: 1 }}
          animate={{ 
            width: 800, 
            height: 800, 
            opacity: 0 
          }}
          transition={{ 
            duration: 1, 
            delay: i * 0.1,
            ease: "easeOut" 
          }}
        />
      ))}
      
      {/* Explosion particles */}
      {[...Array(30)].map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const distance = 300 + Math.random() * 200;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-4 h-4 rounded-full"
            style={{
              backgroundColor: i % 2 === 0 ? "#F7931E" : "#DC2626",
            }}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{ 
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: 0,
              opacity: 0
            }}
            transition={{ 
              duration: 0.8,
              ease: "easeOut"
            }}
          />
        );
      })}
      
      {/* BOOM text */}
      <motion.div
        className="absolute text-8xl font-black text-red-600"
        style={{ textShadow: "4px 4px 0 #000, -2px -2px 0 #F7931E" }}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: [0, 1.5, 1.2], rotate: [-20, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        BOOM!
      </motion.div>
      
      {/* Flash effect */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

// Crane SVG Component
function CraneClaw({
  clawAngle,
  cableExtension,
  isPowered,
  isBroken
}: {
  clawAngle: number;
  cableExtension: number;
  isPowered: boolean;
  isBroken: boolean;
}) {
  const animatedClawAngle = useAnimatedValue(clawAngle, TIMING.openClaws);
  
  if (isBroken) {
    // Broken/jagged appearance
    return (
      <svg
        width="200"
        height="400"
        viewBox="0 0 100 200"
        className="overflow-visible opacity-40"
      >
        {/* Broken mounting bracket */}
        <rect x="30" y="0" width="40" height="16" rx="2" fill="#7f1d1d" />
        <circle cx="40" cy="8" r="3" fill="#450a0a" />
        <circle cx="60" cy="8" r="3" fill="#450a0a" />
        
        {/* Broken cable hanging loose */}
        <motion.rect
          x="48"
          y="24"
          width="4"
          fill="#7f1d1d"
          animate={{ height: 80 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Broken hub */}
        <motion.g
          animate={{ y: 80, rotate: [0, 5, -5, 0] }}
          transition={{ 
            y: { duration: 0.5 },
            rotate: { duration: 2, repeat: Infinity }
          }}
        >
          <circle cx="50" cy="54" r="18" fill="#7f1d1d" />
          <circle cx="50" cy="54" r="12" fill="#450a0a" />
          <circle cx="50" cy="54" r="6" fill="#7f1d1d" />
          
          {/* Broken left arm */}
          <g transform={`rotate(60, 50, 54)`}>
            <path d="M50,54 L35,75" stroke="#7f1d1d" strokeWidth="6" strokeLinecap="round" />
            <circle cx="32" cy="78" r="4" fill="#7f1d1d" />
            <path d="M32,78 L25,95 L30,100 L35,82" fill="#7f1d1d" />
          </g>
          
          {/* Broken right arm */}
          <g transform={`rotate(-60, 50, 54)`}>
            <path d="M50,54 L65,75" stroke="#7f1d1d" strokeWidth="6" strokeLinecap="round" />
            <circle cx="68" cy="78" r="4" fill="#7f1d1d" />
            <path d="M68,78 L75,95 L70,100 L65,82" fill="#7f1d1d" />
          </g>
        </motion.g>
      </svg>
    );
  }
  
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
  biosPassword?: string;
  isBroken?: boolean;
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
  biosPassword = "0000",
  isBroken = false
}: CraneRobotProps) {
  const isPowered = state !== "power-off" && !isBroken;
  
  const [craneX, setCraneX] = useState(0);
  const [cableExtension, setCableExtension] = useState(0);
  const [clawAngle, setClawAngle] = useState(1);
  const [isHoldingItem, setIsHoldingItem] = useState(false);
  const [itemX, setItemX] = useState(-200);
  const [grabbedAtGround, setGrabbedAtGround] = useState(false);
  const [grabSubState, setGrabSubState] = useState<GrabSubState | null>(null);
  const [dropSubState, setDropSubState] = useState<DropSubState | null>(null);

  // Execute grab sequence
  const executeGrabSequence = useCallback(async () => {
    if (!isPowered || isBroken) return;
    
    setGrabSubState("moving");
    onSubStateChange?.("moving");
    setCraneX(-200);
    onPositionChange?.(-200);
    setItemX(-200);
    setIsHoldingItem(false);
    await delay(TIMING.move * 1000);
    
    setGrabSubState("opening");
    onSubStateChange?.("opening");
    setClawAngle(45);
    await delay(TIMING.openClaws * 1000 + 200);
    
    setGrabSubState("lowering");
    onSubStateChange?.("lowering");
    setCableExtension(50);
    await delay(TIMING.lowerCrane * 1000);
    
    setGrabSubState("grabbing");
    onSubStateChange?.("grabbing");
    setClawAngle(1);
    await delay(TIMING.closeClaws * 1000 + 200);
    
    setIsHoldingItem(true);
    setGrabbedAtGround(true);
    onHoldingChange?.(true);
    
    setGrabSubState("lifting");
    onSubStateChange?.("lifting");
    setCableExtension(0);
    await delay(TIMING.liftCrane * 1000);
    
    setGrabbedAtGround(false);
    setGrabSubState(null);
    onSubStateChange?.(null);
  }, [isPowered, isBroken, onSubStateChange, onPositionChange, onHoldingChange]);

  // Execute drop sequence
  const executeDropSequence = useCallback(async () => {
    if (!isPowered || isBroken) return;
    
    setDropSubState("moving");
    onSubStateChange?.("moving");
    setCraneX(200);
    onPositionChange?.(200);
    await delay(TIMING.move * 1000);
    
    setDropSubState("dropping");
    onSubStateChange?.("dropping");
    setClawAngle(45);
    setIsHoldingItem(false);
    setGrabbedAtGround(false);
    onHoldingChange?.(false);
    setItemX(200);
    await delay(TIMING.openClawsDrop * 1000 + 200);
    
    setClawAngle(1);
    await delay(TIMING.closeClaws * 1000);
    
    setDropSubState(null);
    onSubStateChange?.(null);
  }, [isPowered, isBroken, onSubStateChange, onPositionChange, onHoldingChange]);

  // Handle state changes
  useEffect(() => {
    if (isBroken) return;
    
    switch (state) {
      case "power-off":
        setCraneX(0);
        setCableExtension(0);
        setClawAngle(1);
        setIsHoldingItem(false);
        setItemX(-200);
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
          break;
        }
        if (isPowered) {
          executeDropSequence();
        }
        break;
    }
  }, [state, isPowered, isBroken, executeGrabSequence, executeDropSequence, onSubStateChange, onPositionChange, onHoldingChange]);

  const getItemX = () => {
    if (isHoldingItem) {
      return craneX;
    }
    return itemX;
  };

  const getItemY = () => {
    const craneAttachedY = 225 + cableExtension;
    const groundY = 320;
    const isCraneLoweredEnough = cableExtension >= 45;
    
    if (isHoldingItem) {
      if (grabbedAtGround && cableExtension >= 45) {
        return groundY;
      }
      return craneAttachedY;
    }
    return groundY;
  };

  const currentStateDef = STATE_DEFINITIONS.find((s) => s.id === state);
  
  let statusText = currentStateDef?.label ?? "Unknown";
  if (isBroken) {
    statusText = "DESTROYED";
  } else if (grabSubState) {
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
      <div className={`absolute top-16 left-0 right-0 h-4 border-b border-black ${isBroken ? 'bg-red-900/30' : 'bg-[#C0C0C0]'}`} />

      {/* Drop Zone Marker */}
      <div className={`absolute bottom-0 right-[180px] w-24 h-4 rounded-t-lg border-t border-x border-black ${isBroken ? 'bg-red-900/30' : 'bg-[#F7931E]/50'}`} />
      <div className={`absolute bottom-12 right-[195px] text-sm font-semibold ${isBroken ? 'text-red-800' : 'text-[#D06000]'}`}>
        DROP ZONE
      </div>

      {/* Item Zone Marker */}
      <div className={`absolute bottom-0 left-[180px] w-24 h-4 rounded-t-lg border-t border-x border-black ${isBroken ? 'bg-red-900/30' : 'bg-[#F7931E]/50'}`} />
      <div className={`absolute bottom-12 left-[195px] text-sm font-semibold ${isBroken ? 'text-red-800' : 'text-[#D06000]'}`}>
        ITEM ZONE
      </div>

      {/* Item */}
      <motion.div
        className={`absolute w-20 h-20 rounded-lg shadow-lg border-2 border-black ${isBroken ? 'bg-red-800' : 'bg-[#F7931E]'}`}
        animate={{
          x: getItemX() + width / 2 - 40,
          y: getItemY(),
          rotate: isBroken ? 45 : 0
        }}
        transition={{
          x: { duration: isHoldingItem ? TIMING.move : 0.3, ease: "easeInOut" },
          y: {
            duration: isHoldingItem ? TIMING.liftCrane : 0.3,
            ease: "easeInOut"
          },
          rotate: { duration: 0.3 }
        }}
        style={{ left: 0, top: 0 }}
      >
        <div className={`absolute inset-2 border-2 rounded ${isBroken ? 'border-red-900' : 'border-[#D06000]'}`} />
        <div className={`absolute top-1/2 left-0 right-0 h-0.5 ${isBroken ? 'bg-red-900' : 'bg-[#D06000]'}`} />
        <div className={`absolute top-0 bottom-0 left-1/2 w-0.5 ${isBroken ? 'bg-red-900' : 'bg-[#D06000]'}`} />
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
          isBroken={isBroken}
        />
      </motion.div>

      {/* Ground */}
      <div className={`absolute bottom-0 left-0 right-0 h-8 border-t border-black flex items-center justify-center ${isBroken ? 'bg-red-900/50' : 'bg-[#C0C0C0]'}`}>
        <span className={`text-sm font-bold ${isBroken ? 'text-red-800 line-through' : 'text-[#D06000]'}`}>
          Claw Machine #{serialNumber}
        </span>
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div className={`absolute top-4 left-4 px-4 py-2 border-2 border-black ${isBroken ? 'bg-red-900/50' : 'bg-[#E0E0E0]'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  isPowered
                    ? "bg-[#F7931E] shadow-[0_0_10px_rgba(247,147,30,0.8)]"
                    : isBroken
                    ? "bg-red-600 shadow-none"
                    : "bg-gray-500 shadow-none"
                }`}
              />
              <span className={`text-xs font-medium ${isPowered ? "text-[#F7931E]" : isBroken ? "text-red-600" : "text-gray-500"}`}>
                {isBroken ? "ERR" : isPowered ? "ON" : "OFF"}
              </span>
            </div>
            <div className="h-4 w-px bg-black" />
            <div>
              <div className={`text-xs uppercase tracking-wider ${isBroken ? 'text-red-800' : 'text-gray-900'}`}>
                State
              </div>
              <div className={`text-sm font-mono ${isBroken ? 'text-red-600' : 'text-[#D06000]'}`}>
                {statusText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Play success sound
function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.type = "triangle";
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime);
    
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode2.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.4);
  } catch {
    // Silently fail
  }
}

// Play a gentle error sound with decrescendo - sad descending chime
function playErrorSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Main oscillator - sine wave for smoothness
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Descending: G4 down to C4
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(392, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(261.63, audioContext.currentTime + 0.4);
    
    // Decrescendo volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Second oscillator for harmony
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.type = "triangle";
    oscillator2.frequency.setValueAtTime(311.13, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(196, audioContext.currentTime + 0.4);
    
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode2.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);
    
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.45);
  } catch {
    // Silently fail
  }
}

// Play explosion sound
function playExplosionSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create noise buffer for explosion
    const bufferSize = audioContext.sampleRate * 1.5;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    // Lowpass filter for rumble effect
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    noise.start();
  } catch {
    // Silently fail
  }
}

// Encapsulation Question Component
interface EncapsulationQuestionProps {
  field: FieldDefinition;
  selectedAccess: AccessModifier;
  onAccessChange: (access: AccessModifier) => void;
  isCorrect: boolean | null;
  onCheck: () => void;
}

function EncapsulationQuestion({
  field,
  selectedAccess,
  onAccessChange,
  isCorrect,
  onCheck
}: EncapsulationQuestionProps) {
  const [hasChecked, setHasChecked] = useState(false);
  
  const handleCheck = () => {
    setHasChecked(true);
    onCheck();
  };
  
  const isDangerous = false;
  
  return (
    <div className={`bg-[#F8F8F8] border-2 p-4 ${isDangerous ? 'border-red-600 bg-red-50' : 'border-black'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold ${
          isCorrect === true ? 'bg-green-500' : 
          isCorrect === false ? 'bg-red-500' : 
          isDangerous ? 'bg-red-600' : 'bg-[#F7931E]'
        }`}>
          {isCorrect === true ? '✓' : isCorrect === false ? '✗' : field.type === "property" ? "P" : "M"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <code className={`px-2 py-1 rounded text-sm font-mono ${isDangerous ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
              {field.name}
            </code>
            <span className={`text-xs px-2 py-0.5 rounded ${field.type === "property" ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {field.type}
            </span>
            {isDangerous && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-600 text-white font-bold">
                ⚠️ DANGER
              </span>
            )}
          </div>
          <p className={`text-sm mb-3 ${isDangerous ? 'text-red-700' : 'text-gray-700'}`}>
            {field.description}
          </p>
          
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Access Modifier:</label>
            <select
              value={selectedAccess}
              onChange={(e) => onAccessChange(e.target.value as AccessModifier)}
              disabled={isCorrect === true}
              className={`px-3 py-2 border-2 rounded text-sm font-mono ${
                isCorrect === true ? 'bg-green-100 border-green-500 text-green-700' :
                isCorrect === false ? 'bg-red-100 border-red-500 text-red-700' :
                'bg-white border-black text-black'
              }`}
            >
              <option value="public">public</option>
              <option value="private">private</option>
            </select>
            
            {isCorrect !== true && (
              <button
                onClick={handleCheck}
                className="px-4 py-2 bg-[#E0E0E0] border-2 border-black text-black text-sm font-medium hover:bg-[#D0D0D0] active:bg-[#C0C0C0]"
              >
                Check
              </button>
            )}
          </div>
          
          {/* Field-specific feedback messages */}
          {isCorrect === false && (
            <p className="text-red-600 text-sm mt-2">
              ❌ {field.id === "serialNumber" && "Think: Should external systems be able to read the machine's ID for identification?"}
              {field.id === "power" && "Consider: Does the user interface need to check if the machine is on or off?"}
              {field.id === "position" && "Hint: Would external code need to know where the claw is located?"}
              {field.id === "isHolding" && "Think about: Does the control system need to verify if an item is being carried?"}
              {field.id === "biosPassword" && "Security question: Should anyone be able to see this sensitive maintenance code?"}
              {field.id === "powerOn" && "Consider: Does the operator need to call this to activate the machine?"}
              {field.id === "powerOff" && "Hint: Would an external shutdown button need to trigger this method?"}
              {field.id === "moveLeft" && "Think: Does the movement controller need to command the machine to move?"}
              {field.id === "moveRight" && "Consider: Would external navigation code call this method?"}
              {field.id === "grabItem" && "Hint: Does the operator interface need to initiate grabbing?"}
              {field.id === "dropItem" && "Think: Would the control system need to command a drop action?"}
              {field.id === "systemMaintenance" && "Consider: Should external systems run internal diagnostics, or should only the machine manage its own maintenance?"}
            </p>
          )}
          
          {isCorrect === true && (
            <p className="text-green-600 text-sm mt-2">
              ✅ {field.id === "serialNumber" && "Correct! SerialNumber should be public so external systems can identify the machine for maintenance, tracking, or inventory purposes."}
              {field.id === "power" && "Right! Power needs to be public so the UI can display whether the machine is active, and other systems can check before sending commands."}
              {field.id === "position" && "Correct! External controllers need to know the claw Position to coordinate operations and provide visual feedback to operators."}
              {field.id === "isHolding" && "Good! IsHolding must be public so the control system can determine if the machine is ready to grab, move, or drop items."}
              {field.id === "biosPassword" && "Exactly! This sensitive maintenance code should be private—only the machine's internal systems should access BiosPassword for authentication, preventing unauthorized use."}
              {field.id === "powerOn" && "Correct! The operator needs to call PowerOn() to activate the machine, so it must be accessible from outside the class."}
              {field.id === "powerOff" && "Right! External shutdown procedures and safety systems need to call PowerOff(), requiring public access."}
              {field.id === "moveLeft" && "Good! The movement controller sends commands to the machine, so MoveLeft() must be public to receive external navigation instructions."}
              {field.id === "moveRight" && "Correct! External automation systems and operators need to call MoveRight() during normal operations."}
              {field.id === "grabItem" && "Right! The operator interface or automated systems trigger GrabItem() when an item is detected at the pickup zone."}
              {field.id === "dropItem" && "Correct! Drop commands come from external systems calling DropItem() when the machine reaches the destination zone."}
              {field.id === "systemMaintenance" && "Good thinking! SystemMaintenance() should be private since it's an internal diagnostic routine that shouldn't be triggered by external code—only the machine's internal systems should run maintenance checks."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Challenge Component
export default function Challenge02() {
  const [craneState, setCraneState] = useState<CraneState>("power-off");
  const [subState, setSubState] = useState<string | null>(null);
  const [cranePosition, setCranePosition] = useState<number>(0);
  const [isHoldingItem, setIsHoldingItem] = useState<boolean>(false);
  const [serialNumber] = useState<string>("CR-2024-" + Math.floor(1000 + Math.random() * 9000));
  const [biosPassword] = useState<string>(() => String(Math.floor(1000 + Math.random() * 9000)));
  
  // Destruction state
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  
  // Password protection state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  
  // Access modifier selections
  const [accessModifiers, setAccessModifiers] = useState<Record<string, AccessModifier>>(() => {
    const initial: Record<string, AccessModifier> = {};
    ENCAPSULATION_FIELDS.forEach(field => {
      initial[field.id] = "public";
    });
    return initial;
  });
  
  // Correct answers tracking
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, boolean | null>>(() => {
    const initial: Record<string, boolean | null> = {};
    ENCAPSULATION_FIELDS.forEach(field => {
      initial[field.id] = null;
    });
    return initial;
  });
  
  // Check if all answers are correct
  const allCorrect = Object.values(correctAnswers).every(v => v === true);
  
  // Check which sensitive fields are set to private
  const isBiosPasswordPrivate = accessModifiers.biosPassword === "private" && correctAnswers.biosPassword === true;
  const isSystemMaintenancePrivate = accessModifiers.systemMaintenance === "private" && correctAnswers.systemMaintenance === true;
  const hasAnyPrivateProtection = isBiosPasswordPrivate || isSystemMaintenancePrivate;
  const hasFullProtection = isBiosPasswordPrivate && isSystemMaintenancePrivate;
  
  // Accordion state
  const [showEncapsulation, setShowEncapsulation] = useState(true);
  
  // Blueprint dialog state
  const [showBlueprint, setShowBlueprint] = useState(false);

  const handleAccessChange = (fieldId: string, access: AccessModifier) => {
    setAccessModifiers(prev => ({ ...prev, [fieldId]: access }));
    // Reset correctness when changing answer
    setCorrectAnswers(prev => ({ ...prev, [fieldId]: null }));
  };

  const checkAnswer = (fieldId: string) => {
    const field = ENCAPSULATION_FIELDS.find(f => f.id === fieldId);
    if (!field) return;
    
    const isCorrect = accessModifiers[fieldId] === field.correctAccess;
    setCorrectAnswers(prev => ({ ...prev, [fieldId]: isCorrect }));
    
    if (isCorrect) {
      playSuccessSound();
    } else {
      playErrorSound();
    }
  };

  const handleStateChange = (newState: CraneState) => {
    if (isDestroyed) return;
    setCraneState(newState);
  };

  const isStateDisabled = (stateId: CraneState) => {
    if (isDestroyed) return true;
    if (stateId === "power-off") return false;
    if (craneState === "power-off" && stateId !== "power-on") return true;
    if (subState !== null) return true;
    return false;
  };

  const handleSystemMaintenanceClick = () => {
    // Show password modal instead of directly destroying
    setShowPasswordModal(true);
    setPasswordInput("");
    setPasswordError(null);
    setShowSecurityWarning(false);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === biosPassword) {
      // Correct password - proceed with destruction
      setShowPasswordModal(false);
      setShowExplosion(true);
      playExplosionSound();
      
      setTimeout(() => {
        setIsDestroyed(true);
        setCraneState("power-off");
      }, 300);
    } else {
      // Wrong password
      setPasswordError("Incorrect password! Access denied.");
      playErrorSound();
      // Show security warning after first failed attempt
      setShowSecurityWarning(true);
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePasswordSubmit();
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordInput("");
    setPasswordError(null);
    setShowSecurityWarning(false);
  };

  const handleReset = () => {
    setIsDestroyed(false);
    setShowExplosion(false);
    setShowPasswordModal(false);
    setPasswordInput("");
    setPasswordError(null);
    setShowSecurityWarning(false);
    setCraneState("power-off");
    setSubState(null);
    setCranePosition(0);
    setIsHoldingItem(false);
  };

  const getPositionLabel = (pos: number): string => {
    if (pos <= -150) return "Left";
    if (pos >= 150) return "Right";
    return "Center";
  };

  // Count correct answers
  const correctCount = Object.values(correctAnswers).filter(v => v === true).length;
  const totalFields = ENCAPSULATION_FIELDS.length;

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
      {/* Reset Button - Top Left */}
      <button
        onClick={handleReset}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-[#E0E0E0] border-2 border-black text-black font-bold hover:bg-[#D0D0D0] active:bg-[#C0C0C0] flex items-center gap-2 shadow-lg"
      >
        <span>↺</span>
        Reset System
      </button>

      {/* Header Bar - Orange */}
      <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-black tracking-wide">
            Challenge 02 - Encapsulation & Access Modifiers
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
          <Link to="/" className="text-black hover:underline tracking-wider">
            Home
          </Link>
          <Link to="/crane" className="text-black hover:underline tracking-wider">
            Crane
          </Link>
          <Link to="/conveyor" className="text-black hover:underline tracking-wider">
            Conveyor
          </Link>
          <Link to="/challenge-01" className="text-black hover:underline tracking-wider">
            Challenge 01
          </Link>
          <Link
            to="/crane-factory"
            className="text-black hover:underline tracking-wider"
          >
            Claw Factory
          </Link>
          <span className="font-bold text-black tracking-wider">Challenge 02</span>
          <Link to="/assembly-line" className="text-black hover:underline tracking-wider">
            Assembly Line
          </Link>
          <Link to="/machine-hierarchy" className="text-black hover:underline tracking-wider">
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
            <div className="relative">
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
                biosPassword={biosPassword}
                isBroken={isDestroyed}
              />
              
              {/* Private Overlay - Shows when sensitive data is protected */}
              {!isDestroyed && (
                <PrivateOverlay 
                  isBiosPasswordPrivate={isBiosPasswordPrivate}
                  isSystemMaintenancePrivate={isSystemMaintenancePrivate}
                  hasFullProtection={hasFullProtection}
                />
              )}
              
              {/* Explosion Effect */}
              <ExplosionEffect isPlaying={showExplosion} />
            </div>

            {/* Controls */}
            <div className="mt-4 space-y-4">
              {/* Status Card - All fields revealed */}
              <div className={`border-2 border-black p-6 ${isDestroyed ? 'bg-red-900/20' : 'bg-[#E0E0E0]'}`}>
                <div className="flex items-center justify-around flex-wrap gap-4">
                  {/* Power Status */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-900 uppercase tracking-wider">Power</div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full transition-all duration-300 ${
                          isDestroyed
                            ? "bg-red-600 shadow-none"
                            : craneState !== "power-off"
                            ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                            : "bg-gray-500 shadow-none"
                        }`}
                      />
                      <span className={`text-lg font-bold ${
                        isDestroyed ? "text-red-600" : craneState !== "power-off" ? "text-green-600" : "text-gray-500"
                      }`}>
                        {isDestroyed ? "ERR" : craneState !== "power-off" ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-12 w-px bg-black" />
                  
                  {/* Claw Position */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-900 uppercase tracking-wider">Position</div>
                    <div className={`text-2xl font-mono font-bold ${isDestroyed ? 'text-red-600' : 'text-[#D06000]'}`}>
                      {getPositionLabel(cranePosition)}
                    </div>
                  </div>
                  
                  <div className="h-12 w-px bg-black" />
                  
                  {/* Holding Item */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-900 uppercase tracking-wider">Holding</div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full transition-all duration-300 ${
                          isDestroyed
                            ? "bg-red-600"
                            : isHoldingItem
                            ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]"
                            : "bg-gray-500"
                        }`}
                      />
                      <span className={`text-lg font-bold ${isDestroyed ? "text-red-600" : isHoldingItem ? "text-blue-700" : "text-gray-500"}`}>
                        {isHoldingItem ? "YES" : "NO"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-12 w-px bg-black" />
                  
                  {/* BIOS Password */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-xs uppercase tracking-wider font-bold ${isBiosPasswordPrivate ? 'text-green-700' : 'text-red-700'}`}>
                      {isBiosPasswordPrivate ? '🔒 SECURED' : 'BIOS Password'}
                    </div>
                    <div className={`text-2xl font-mono font-bold ${isBiosPasswordPrivate ? 'text-green-600' : 'text-red-600'}`}>
                      {isBiosPasswordPrivate ? (
                        <span className="flex items-center gap-1">
                          <span>••••</span>
                        </span>
                      ) : (
                        biosPassword
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* State Buttons Grid */}
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
                        px-4 py-3 font-medium transition-all text-left border-2
                        ${isDestroyed
                          ? "bg-red-900/30 border-red-800 text-red-800 cursor-not-allowed"
                          : isActive
                          ? "bg-[#F7931E] text-black border-black"
                          : "bg-[#E8E8E8] text-black border-black hover:bg-[#D8D8D8]"
                        }
                        ${isDisabled && !isDestroyed ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                      title={stateDef.description}
                    >
                      <div className="flex items-center gap-2">
                        {stateDef.id === "power-off" && (
                          <div className={`w-3 h-3 rounded-full ${isActive ? "bg-red-500" : isDestroyed ? "bg-red-800" : "bg-red-600"}`} />
                        )}
                        {stateDef.id === "power-on" && (
                          <div className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : isDestroyed ? "bg-red-800" : "bg-green-600"}`} />
                        )}
                        <span>{stateDef.label}</span>
                      </div>
                      <div className="text-xs opacity-70 mt-1">{stateDef.description}</div>
                    </button>
                  );
                })}
              </div>

              {/* System Maintenance Button - Styled to look like a regular control */}
              <motion.button
                onClick={handleSystemMaintenanceClick}
                disabled={isDestroyed || isSystemMaintenancePrivate}
                whileHover={!isDestroyed && !isSystemMaintenancePrivate ? { scale: 1.02 } : {}}
                whileTap={!isDestroyed && !isSystemMaintenancePrivate ? { scale: 0.98 } : {}}
                className={`
                  w-full py-4 font-medium text-lg border-2 transition-all
                  ${isDestroyed
                    ? "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed"
                    : isSystemMaintenancePrivate
                    ? "bg-green-100 border-green-600 text-green-700 cursor-not-allowed"
                    : "bg-[#E8E8E8] border-black text-black hover:bg-[#D8D8D8]"
                  }
                `}
              >
                {isDestroyed 
                  ? "☠️ SYSTEM DESTROYED ☠️" 
                  : isSystemMaintenancePrivate 
                  ? "🔒 System Maintenance (Protected)"
                  : "System Maintenance"
                }
              </motion.button>
              
              {isDestroyed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-red-600 font-bold text-lg"
                >
                  ⚠️ CRITICAL FAILURE - USE RESET BUTTON TO RESTART ⚠️
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column - Encapsulation Challenge */}
          <div className="self-start">
            {/* Progress indicator */}
            <div className="bg-[#F0F0F0] border-2 border-black p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-black">Progress</span>
                <span className="text-[#F7931E] font-bold">{correctCount} / {totalFields} Correct</span>
              </div>
              <div className="h-4 bg-gray-300 border border-black">
                <motion.div
                  className="h-full bg-[#F7931E]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(correctCount / totalFields) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Encapsulation Section */}
            <div className="bg-[#FAFAFA] border-2 border-black">
              <button
                onClick={() => setShowEncapsulation(!showEncapsulation)}
                className="w-full px-6 py-4 flex items-center justify-between bg-[#F0F0F0] hover:bg-[#E0E0E0] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-black">ENCAPSULATION</h2>
                  <span className="text-sm text-gray-600">- Set Access Modifiers</span>
                </div>
                <span className={`text-2xl transition-transform duration-300 ${showEncapsulation ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              
              <AnimatePresence initial={false}>
                {showEncapsulation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-4">
                      <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded mb-6">
                        <h3 className="font-bold text-blue-800 mb-2">📚 What is Encapsulation?</h3>
                        <p className="text-blue-700 text-sm mb-2">
                          <strong>Encapsulation</strong> is one of the four pillars of OOP. It means:
                        </p>
                        <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
                          <li>Wrapping data (properties) and code (methods) together</li>
                          <li>Controlling access using <strong>access modifiers</strong></li>
                          <li>Protecting sensitive data from unauthorized access</li>
                        </ul>
                        <div className="mt-3 flex gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono">public</span>
                            <span>Accessible from anywhere</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono">private</span>
                            <span>Accessible only inside the class</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-900 mb-4 font-medium">
                        For each field below, select the appropriate access modifier:
                      </p>

                      {/* Fields grouped by type */}
                      <div className="space-y-6">
                        {/* Properties */}
                        <div>
                          <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-3 border-b border-blue-200 pb-1">
                            Properties
                          </h3>
                          <div className="space-y-3">
                            {ENCAPSULATION_FIELDS.filter(f => f.type === "property").map(field => (
                              <EncapsulationQuestion
                                key={field.id}
                                field={field}
                                selectedAccess={accessModifiers[field.id]}
                                onAccessChange={(access) => handleAccessChange(field.id, access)}
                                isCorrect={correctAnswers[field.id]}
                                onCheck={() => checkAnswer(field.id)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Methods */}
                        <div>
                          <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-3 border-b border-purple-200 pb-1">
                            Methods
                          </h3>
                          <div className="space-y-3">
                            {ENCAPSULATION_FIELDS.filter(f => f.type === "method").map(field => (
                              <EncapsulationQuestion
                                key={field.id}
                                field={field}
                                selectedAccess={accessModifiers[field.id]}
                                onAccessChange={(access) => handleAccessChange(field.id, access)}
                                isCorrect={correctAnswers[field.id]}
                                onCheck={() => checkAnswer(field.id)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Success Message */}
                      <AnimatePresence>
                        {allCorrect && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 bg-green-100 border-2 border-green-500 p-4 rounded"
                          >
                            <h3 className="font-bold text-green-800 mb-2">🎉 Excellent Work!</h3>
                            <p className="text-green-700 text-sm">
                              You've mastered <strong>encapsulation</strong>! You correctly identified that:
                            </p>
                            <ul className="text-green-700 text-sm mt-2 list-disc list-inside">
                              <li><strong>biosPassword</strong> should be private (sensitive data)</li>
                              <li><strong>SystemMaintenance()</strong> should be private (internal operation)</li>
                              <li>All other fields can be public for normal operation</li>
                            </ul>
                            <p className="text-green-700 text-sm mt-3 font-medium border-t border-green-300 pt-3">
                              🔒 Now the machine is secure! With <code>BiosPassword</code> and <code>SystemMaintenance()</code> 
                              set to private, attackers can no longer easily access the password or trigger destruction.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Educational Note */}
                      <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 p-4 rounded">
                        <h3 className="font-bold text-yellow-800 mb-2">💡 Why Encapsulation Matters</h3>
                        <p className="text-yellow-700 text-sm mb-3">
                          Imagine if anyone could call <code>SystemMaintenance()</code> or read the system code! 
                          Encapsulation helps us protect internal operations and sensitive data.
                        </p>
                        <p className="text-yellow-700 text-sm font-medium border-l-4 border-yellow-500 pl-3">
                          🎯 <strong>Try this:</strong> Click the "System Maintenance" button and see how easily 
                          the access code (visible in the state card) can be used. This demonstrates 
                          exactly why sensitive data should be <code>private</code> - to prevent unauthorized access!
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
                onClick={() => allCorrect && setShowBlueprint(true)}
                disabled={!allCorrect}
                className={`w-full px-6 py-4 border-2 border-black font-bold text-lg transition-colors flex items-center justify-center gap-3 ${
                  allCorrect
                    ? "bg-[#F7931E] text-black hover:bg-[#E08000] cursor-pointer"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                }`}
              >
                <span>🖨️</span>
                Print Blueprint
                {!allCorrect && (
                  <span className="text-sm font-normal ml-2">🔒 Answer all correctly</span>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Password Protection Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        password={passwordInput}
        onPasswordChange={setPasswordInput}
        onSubmit={handlePasswordSubmit}
        onKeyDown={handlePasswordKeyDown}
        error={passwordError}
        showSecurityWarning={showSecurityWarning}
        actualPassword={biosPassword}
      />

      {/* Blueprint Dialog */}
      <BlueprintDialog 
        isOpen={showBlueprint} 
        onClose={() => setShowBlueprint(false)} 
        accessModifiers={accessModifiers}
      />

      {/* Footer Bar */}
      <footer className="bg-[#E8E8E8] border-t-2 border-black px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-black text-sm">Challenge 02 - Limbus Tech Emulator</span>
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

// C# Code for the CraneRobot class with encapsulation
function getCsharpCode(accessModifiers: Record<string, AccessModifier>) {
  const getAccess = (id: string) => accessModifiers[id] || "public";
  
  return `public class ClawRobot
{
    // Properties
    ${getAccess("power")} bool Power;
    ${getAccess("position")} string Position;
    ${getAccess("isHolding")} bool IsHolding;
    ${getAccess("serialNumber")} string SerialNumber;
    ${getAccess("biosPassword")} string BiosPassword;  // 4-digit security code

    // Constructor
    public CraneRobot()
    {
        Power = false;
        Position = "Center";
        IsHolding = false;
        SerialNumber = "CR-2024-" + new Random().Next(1000, 9999);
        BiosPassword = new Random().Next(1000, 9999).ToString();
    }

    // Methods
    ${getAccess("powerOn")} void PowerOn()
    {
        Power = true;
        Console.WriteLine("Claw powered on");
    }

    ${getAccess("powerOff")} void PowerOff()
    {
        Power = false;
        Console.WriteLine("Claw powered off");
    }

    ${getAccess("moveLeft")} void MoveLeft()
    {
        if (Power)
        {
            Position = "Left";
            Console.WriteLine("Moving left to item zone");
        }
    }

    ${getAccess("moveRight")} void MoveRight()
    {
        if (Power)
        {
            Position = "Right";
            Console.WriteLine("Moving right to drop zone");
        }
    }

    ${getAccess("grabItem")} void GrabItem()
    {
        if (Power && Position == "Left")
        {
            IsHolding = true;
            Console.WriteLine("Item grabbed");
        }
    }

    ${getAccess("dropItem")} void DropItem()
    {
        if (Power && IsHolding)
        {
            IsHolding = false;
            Console.WriteLine("Item dropped");
        }
    }

    ${getAccess("systemMaintenance")} void SystemMaintenance()
    {
        // Internal system diagnostics
        Console.WriteLine("Running system maintenance...");
        // ... maintenance code ...
    }
}`;
}

// Password Modal Component
interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  error: string | null;
  showSecurityWarning: boolean;
  actualPassword: string;
}

function PasswordModal({
  isOpen,
  onClose,
  password,
  onPasswordChange,
  onSubmit,
  onKeyDown,
  error,
  showSecurityWarning,
  actualPassword
}: PasswordModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Dialog - Styled like the rest of the app */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white border-2 border-black w-full max-w-md overflow-hidden shadow-xl"
      >
        {/* Header - Orange like app header */}
        <div className="bg-[#F7931E] border-b-2 border-black px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">
              System Maintenance
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-[#E0E0E0] border-2 border-black flex items-center justify-center hover:bg-[#D0D0D0] text-black"
            >
              <span className="text-lg">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Message */}
          <div className="bg-[#F0F0F0] border-2 border-black p-4">
            <p className="text-black text-sm text-center">
              Enter the maintenance code to run system diagnostics.
            </p>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-black text-sm font-bold">
              Access Code
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                // Only allow 4 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                onPasswordChange(value);
              }}
              onKeyDown={onKeyDown}
              placeholder="0000"
              maxLength={4}
              className="w-full px-4 py-3 bg-white border-2 border-black text-black text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-[#F7931E] placeholder-gray-400"
              autoFocus
            />
            <p className="text-gray-500 text-xs">
              4-digit code shown in system status panel
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#F0F0F0] border-2 border-black p-3"
              >
                <p className="text-black text-sm text-center">
                  Invalid code. Please try again.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint - Shows after failed attempt */}
          <AnimatePresence>
            {showSecurityWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#F0F0F0] border-2 border-black p-4"
              >
                <p className="text-black text-sm font-medium mb-2">
                  💡 Tip: The access code is displayed in the system status panel above.
                </p>
                <p className="text-gray-700 text-xs leading-relaxed">
                  Current code: <strong className="text-black font-mono text-lg">{actualPassword}</strong>
                </p>
                <p className="text-gray-600 text-xs mt-2 leading-relaxed">
                  Notice how easily accessible this code is? This is why sensitive data should be properly encapsulated with private access!
                </p>
                <p className="text-[#F7931E] text-xs mt-2 font-medium">
                  Try setting <code className="bg-gray-200 px-1">BiosPassword</code> to private in the challenge.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#E0E0E0] border-2 border-black text-black font-bold hover:bg-[#D0D0D0] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={password.length !== 4}
              className="flex-1 px-4 py-3 bg-[#F7931E] border-2 border-black text-black font-bold hover:bg-[#E08000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Footer bar */}
        <div className="h-2 bg-[#E8E8E8] border-t-2 border-black" />
      </motion.div>
    </div>
  );
}

// Blueprint Dialog Component
interface BlueprintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accessModifiers: Record<string, AccessModifier>;
}

function BlueprintDialog({ isOpen, onClose, accessModifiers }: BlueprintDialogProps) {
  if (!isOpen) return null;

  const csharpCode = getCsharpCode(accessModifiers);

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
          <h2 className="text-xl font-bold text-black">📋 Claw Machine Blueprint - Encapsulation</h2>
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
                    <span className="text-[#fabd2f] font-bold text-lg">CraneRobot</span>
                  </div>
                  
                  {/* Properties Section */}
                  <div className="border-b-2 border-white/30 p-3">
                    <div className="text-[#b8bb26] mb-2 text-xs uppercase tracking-wider">Properties</div>
                    <div className="text-[#ebdbb2] space-y-1">
                      <div>{accessModifiers.power === "public" ? "+" : "-"} Power: bool</div>
                      <div>{accessModifiers.position === "public" ? "+" : "-"} Position: string</div>
                      <div>{accessModifiers.isHolding === "public" ? "+" : "-"} IsHolding: bool</div>
                      <div>{accessModifiers.serialNumber === "public" ? "+" : "-"} SerialNumber: string</div>
                      <div className={accessModifiers.biosPassword === "private" ? "text-red-400" : ""}>
                        {accessModifiers.biosPassword === "public" ? "+" : "-"} BiosPassword: string
                        {accessModifiers.biosPassword === "private" && " ✓"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Methods Section */}
                  <div className="p-3">
                    <div className="text-[#b8bb26] mb-2 text-xs uppercase tracking-wider">Methods</div>
                    <div className="text-[#83a598] space-y-1">
                      <div>{accessModifiers.powerOn === "public" ? "+" : "-"} PowerOn()</div>
                      <div>{accessModifiers.powerOff === "public" ? "+" : "-"} PowerOff()</div>
                      <div>{accessModifiers.moveLeft === "public" ? "+" : "-"} MoveLeft()</div>
                      <div>{accessModifiers.moveRight === "public" ? "+" : "-"} MoveRight()</div>
                      <div>{accessModifiers.grabItem === "public" ? "+" : "-"} GrabItem()</div>
                      <div>{accessModifiers.dropItem === "public" ? "+" : "-"} DropItem()</div>
                      <div className={accessModifiers.systemMaintenance === "private" ? "text-red-400" : ""}>
                        {accessModifiers.systemMaintenance === "public" ? "+" : "-"} SystemMaintenance()
                        {accessModifiers.systemMaintenance === "private" && " ✓ (Protected)"}
                      </div>
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
                <h4 className="text-[#fabd2f] font-bold mb-2">OOP Concepts Used</h4>
                <ul className="text-[#ebdbb2] text-sm space-y-1">
                  <li>• <strong className="text-[#b8bb26]">Class:</strong> Blueprint for the machine</li>
                  <li>• <strong className="text-[#b8bb26]">Properties:</strong> Object's state/data</li>
                  <li>• <strong className="text-[#b8bb26]">Methods:</strong> Object's behavior</li>
                  <li>• <strong className="text-[#b8bb26]">Encapsulation:</strong> Controlled access</li>
                  <li>• <strong className="text-[#b8bb26]">Access Modifiers:</strong> public / private</li>
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
                    padding: '1rem',
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                    backgroundColor: '#1d2021',
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
