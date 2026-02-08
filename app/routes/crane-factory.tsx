import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
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

// Crane Class - Demonstrates OOP principles
class Crane {
  id: string;
  serialNumber: string;
  state: CraneState = "power-off";
  position: number = 0; // -200 = left, 0 = center, 200 = right
  isHoldingItem: boolean = false;
  clawAngle: number = 1; // 1 = closed, 45 = open
  cableExtension: number = 0; // 0 = up, 50 = down
  itemX: number = -200;
  subState: string | null = null;
  
  // Callbacks for React state updates
  private onStateChange?: () => void;

  constructor(id: string, onStateChange?: () => void) {
    this.id = id;
    this.serialNumber = `CR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.onStateChange = onStateChange;
  }

  private notifyChange() {
    this.onStateChange?.();
  }

  setState(newState: CraneState) {
    if (this.subState !== null) return; // Block during sequences
    
    switch (newState) {
      case "power-off":
        this.state = "power-off";
        this.position = 0;
        this.cableExtension = 0;
        this.clawAngle = 1;
        this.isHoldingItem = false;
        this.itemX = -200;
        break;

      case "power-on":
        if (this.state === "power-off") {
          this.state = "power-on";
          this.position = 0;
          this.cableExtension = 0;
          this.clawAngle = 1;
        }
        break;

      case "move-left":
        if (this.state !== "power-off") {
          this.state = "move-left";
          this.position = -200;
        }
        break;

      case "move-right":
        if (this.state !== "power-off") {
          this.state = "move-right";
          this.position = 200;
        }
        break;

      case "grab-item":
        if (this.state !== "power-off") {
          this.executeGrabSequence();
        }
        break;

      case "drop-item":
        if (this.state !== "power-off" && this.isHoldingItem) {
          this.executeDropSequence();
        }
        break;
    }
    this.notifyChange();
  }

  private async executeGrabSequence() {
    this.state = "grab-item";
    
    // Step 1: Move to item zone
    this.subState = "moving";
    this.notifyChange();
    this.position = -200;
    this.itemX = -200;
    this.isHoldingItem = false;
    await delay(TIMING.move * 1000);

    // Step 2: Open claws
    this.subState = "opening";
    this.notifyChange();
    this.clawAngle = 45;
    await delay(TIMING.openClaws * 1000 + 200);

    // Step 3: Lower crane
    this.subState = "lowering";
    this.notifyChange();
    this.cableExtension = 50;
    await delay(TIMING.lowerCrane * 1000);

    // Step 4: Close claws (grab)
    this.subState = "grabbing";
    this.notifyChange();
    this.clawAngle = 1;
    await delay(TIMING.closeClaws * 1000 + 200);

    // Attach the item
    this.isHoldingItem = true;

    // Step 5: Lift crane
    this.subState = "lifting";
    this.notifyChange();
    this.cableExtension = 0;
    await delay(TIMING.liftCrane * 1000);

    this.subState = null;
    this.notifyChange();
  }

  private async executeDropSequence() {
    this.state = "drop-item";
    
    // Step 1: Move to drop zone
    this.subState = "moving";
    this.notifyChange();
    this.position = 200;
    await delay(TIMING.move * 1000);

    // Step 2: Open claws (drop)
    this.subState = "dropping";
    this.notifyChange();
    this.clawAngle = 45;
    this.isHoldingItem = false;
    this.itemX = 200;
    await delay(TIMING.openClawsDrop * 1000 + 200);

    // Close claws after drop
    this.clawAngle = 1;
    await delay(TIMING.closeClaws * 1000);

    this.subState = null;
    this.notifyChange();
  }

  getPositionLabel(): string {
    if (this.position <= -150) return "Left";
    if (this.position >= 150) return "Right";
    return "Center";
  }

  isPowered(): boolean {
    return this.state !== "power-off";
  }

  canExecuteState(stateId: CraneState): boolean {
    if (stateId === "power-off") return true;
    if (this.state === "power-off" && stateId !== "power-on") return false;
    if (this.subState !== null) return false;
    return true;
  }
}

// Hook to force re-render when crane state changes
function useCrane(initialCrane?: Crane) {
  const [, setTick] = useState(0);
  
  const [crane] = useState(() => {
    if (initialCrane) return initialCrane;
    return new Crane("", () => setTick(t => t + 1));
  });

  // Set up the callback after creation if needed
  if (!crane.onStateChange) {
    crane.onStateChange = () => setTick(t => t + 1);
  }

  const setState = useCallback((state: CraneState) => {
    crane.setState(state);
  }, [crane]);

  return { crane, setState };
}

// Mini Crane Visual Component
function MiniCraneVisual({ crane }: { crane: Crane }) {
  const isPowered = crane.isPowered();
  
  // Calculate item position
  const getItemX = () => {
    if (crane.isHoldingItem) {
      return crane.position;
    }
    return crane.itemX;
  };

  const getItemY = () => {
    const groundY = 215;
    const craneAttachedY = 115 + crane.cableExtension;
    
    if (crane.isHoldingItem) {
      if (crane.cableExtension >= 45) return groundY;
      return craneAttachedY;
    }
    return groundY;
  };

  const itemX = getItemX();
  const itemY = getItemY();

  return (
    <svg
      viewBox="-250 0 500 240"
      className="w-full"
      style={{ minHeight: "240px", height: "240px" }}
    >
      {/* Track/Rail */}
      <rect x="-250" y="20" width="500" height="8" fill="#C0C0C0" stroke="black" strokeWidth="1" />
      
      {/* Drop Zone Marker */}
      <rect x="120" y="225" width="80" height="8" fill="#F7931E" opacity="0.5" rx="4" />
      <text x="160" y="215" textAnchor="middle" fill="#D06000" fontSize="10" fontWeight="bold">DROP</text>
      
      {/* Item Zone Marker */}
      <rect x="-200" y="225" width="80" height="8" fill="#F7931E" opacity="0.5" rx="4" />
      <text x="-160" y="215" textAnchor="middle" fill="#D06000" fontSize="10" fontWeight="bold">ITEM</text>
      
      {/* Ground */}
      <rect x="-250" y="225" width="500" height="15" fill="#C0C0C0" stroke="black" strokeWidth="1" />
      
      {/* Item - Main Box */}
      <motion.g
        animate={{
          x: itemX,
          y: itemY
        }}
        transition={{
          x: { duration: crane.isHoldingItem ? TIMING.move : 0.2 },
          y: { duration: crane.isHoldingItem ? TIMING.liftCrane : 0.2 }
        }}
      >
        {/* Main orange box with black border */}
        <rect
          x="-25"
          y="-25"
          width="50"
          height="50"
          rx="6"
          fill="#F7931E"
          stroke="black"
          strokeWidth="2"
        />
        {/* Inner border */}
        <rect
          x="-18"
          y="-18"
          width="36"
          height="36"
          rx="4"
          fill="none"
          stroke="#D06000"
          strokeWidth="2"
        />
        {/* Horizontal cross line */}
        <line
          x1="-25"
          y1="0"
          x2="25"
          y2="0"
          stroke="#D06000"
          strokeWidth="2"
        />
        {/* Vertical cross line */}
        <line
          x1="0"
          y1="-25"
          x2="0"
          y2="25"
          stroke="#D06000"
          strokeWidth="2"
        />
      </motion.g>
      
      {/* Crane Assembly */}
      <motion.g
        animate={{ x: crane.position }}
        transition={{ duration: TIMING.move, ease: "easeInOut" }}
      >
        {/* Mounting Bracket */}
        <rect x="-30" y="12" width="60" height="16" rx="2" fill="#64748b" />
        <circle cx="-15" cy="20" r="3" fill="#94a3b8" />
        <circle cx="15" cy="20" r="3" fill="#94a3b8" />
        
        {/* Fixed rod stub */}
        <rect x="-4" y="28" width="8" height="8" fill="#64748b" />
        
        {/* Cable */}
        <motion.rect
          x="-2"
          y="36"
          width="4"
          fill="#64748b"
          animate={{ height: 18 + crane.cableExtension }}
          transition={{ duration: TIMING.lowerCrane, ease: "easeInOut" }}
        />
        
        {/* Hub and Claws */}
        <motion.g
          animate={{ y: crane.cableExtension }}
          transition={{ duration: TIMING.lowerCrane, ease: "easeInOut" }}
        >
          {/* Central Hub - Outer Ring */}
          <circle cx="0" cy="63" r="18" fill="#64748b" />
          {/* Central Hub - Inner Ring */}
          <circle cx="0" cy="63" r="12" fill="#475569" />
          {/* Central Hub - Center */}
          <circle cx="0" cy="63" r="6" fill="#94a3b8" />
          <circle cx="0" cy="63" r="3" fill="#475569" />
          
          {/* Left Arm */}
          <g transform={`rotate(${crane.clawAngle}, 0, 63)`}>
            <path d="M0,63 L-20,90" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <circle cx="-23" cy="93" r="4" fill="#64748b" />
            <path d="M-23,93 Q-35,115 -38,140 Q-40,155 -30,165 Q-20,155 -23,140 Q-25,120 -18,100" fill="#64748b" />
          </g>
          
          {/* Right Arm */}
          <g transform={`rotate(${-crane.clawAngle}, 0, 63)`}>
            <path d="M0,63 L20,90" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <circle cx="23" cy="93" r="4" fill="#64748b" />
            <path d="M23,93 Q35,115 38,140 Q40,155 30,165 Q20,155 23,140 Q25,120 18,100" fill="#64748b" />
          </g>
        </motion.g>
      </motion.g>

      {/* Power indicator on the rail */}
      <circle
        cx="-220"
        cy="24"
        r="6"
        fill={isPowered ? "#22C55E" : "#6B7280"}
        className={isPowered ? "animate-pulse" : ""}
      />
    </svg>
  );
}

// Individual Crane Card Component
function CraneCard({ crane, index }: { crane: Crane; index: number }) {
  const { setState } = useCrane(crane);
  
  const isStateDisabled = (stateId: CraneState) => {
    return !crane.canExecuteState(stateId);
  };

  const getStatusText = () => {
    let text = STATE_DEFINITIONS.find(s => s.id === crane.state)?.label ?? "Unknown";
    if (crane.subState) {
      text += ` (${crane.subState})`;
    }
    return text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-[#F5F5F5] border-2 border-black overflow-hidden"
    >
      {/* Header */}
      <div className="bg-[#E0E0E0] border-b-2 border-black px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#F7931E]">#{index + 1}</span>
          <span className="text-sm font-mono text-gray-700">{crane.serialNumber}</span>
        </div>
        <div className={`w-3 h-3 rounded-full ${crane.isPowered() ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-gray-500"}`} />
      </div>

      {/* Visual */}
      <div className="bg-[#F5F5F5] p-2">
        <MiniCraneVisual crane={crane} />
      </div>

      {/* Status Card */}
      <div className="bg-[#E0E0E0] border-y-2 border-black p-4">
        <div className="flex items-center justify-around">
          {/* Power Status */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-900 uppercase tracking-wider">Power</span>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${crane.isPowered() ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-gray-500"}`} />
              <span className={`text-sm font-bold ${crane.isPowered() ? "text-green-600" : "text-gray-500"}`}>
                {crane.isPowered() ? "ON" : "OFF"}
              </span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-black" />
          
          {/* Position */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-900 uppercase tracking-wider">Position</span>
            <span className="text-lg font-mono font-bold text-[#D06000]">
              {crane.getPositionLabel()}
            </span>
          </div>
          
          <div className="h-10 w-px bg-black" />
          
          {/* Holding */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-900 uppercase tracking-wider">Holding</span>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${crane.isHoldingItem ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]" : "bg-gray-500"}`} />
              <span className={`text-sm font-bold ${crane.isHoldingItem ? "text-blue-700" : "text-gray-500"}`}>
                {crane.isHoldingItem ? "YES" : "NO"}
              </span>
            </div>
          </div>
        </div>
        
        {/* State Display */}
        <div className="mt-3 pt-3 border-t border-black/20 text-center">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Current State</span>
          <div className="text-sm font-mono text-[#D06000] font-bold">{getStatusText()}</div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-3 bg-[#FAFAFA]">
        <div className="grid grid-cols-3 gap-2">
          {STATE_DEFINITIONS.map((stateDef) => {
            const isActive = crane.state === stateDef.id;
            const isDisabled = isStateDisabled(stateDef.id);

            return (
              <motion.button
                key={stateDef.id}
                onClick={() => setState(stateDef.id)}
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.02 } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                className={`
                  px-2 py-2 text-xs font-medium transition-all border-2 text-center
                  ${isActive
                    ? "bg-[#F7931E] text-black border-black"
                    : "bg-[#E8E8E8] text-black border-black hover:bg-[#D8D8D8]"
                  }
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                title={stateDef.description}
              >
                <div className="flex items-center justify-center gap-1">
                  {stateDef.id === "power-off" && (
                    <div className={`w-2 h-2 rounded-full ${isActive ? "bg-red-500" : "bg-red-600"}`} />
                  )}
                  {stateDef.id === "power-on" && (
                    <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-green-600"}`} />
                  )}
                  <span>{stateDef.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Main Factory Page
export default function CraneFactory() {
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [nextId, setNextId] = useState(1);

  const createCrane = () => {
    if (cranes.length >= 4) return; // Max 4 cranes (2x2 grid)
    
    const newCrane = new Crane(nextId.toString());
    // Set up a callback that triggers a re-render for this specific crane
    newCrane.onStateChange = () => {
      setCranes(prev => [...prev]); // Force re-render
    };
    
    setCranes(prev => [...prev, newCrane]);
    setNextId(prev => prev + 1);
  };

  const removeCrane = (id: string) => {
    setCranes(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
      {/* Header Bar */}
      <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-black tracking-wide">
            Crane Factory - Class Blueprint Demo
          </h1>
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
          <Link to="/challenge-01" className="text-black hover:underline tracking-wider">
            Challenge 01
          </Link>
          <Link to="/challenge-02" className="text-black hover:underline tracking-wider">
            Challenge 02
          </Link>
          <span className="font-bold text-black tracking-wider">Crane Factory</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Educational Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-2xl font-bold text-black mb-3">
              🏭 Object Factory: Classes as Blueprints
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-4">
                  In Object-Oriented Programming, a <strong>class</strong> is like a blueprint 
                  or template for creating objects. Just like how one architectural blueprint 
                  can be used to build many identical houses, one class can create many 
                  independent object <strong>instances</strong>.
                </p>
                <p className="text-gray-700">
                  Each crane robot below is created from the same <code className="bg-gray-100 px-1 py-0.5 rounded">Crane</code> class, 
                  but each instance manages its <strong>own data independently</strong>. 
                  Operating one crane does not affect the others!
                </p>
              </div>
              <div className="bg-[#F8F8F8] border-2 border-black p-4">
                <h3 className="font-bold text-[#F7931E] mb-2">💡 Key Concepts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Class:</strong> The blueprint/template (defines properties & methods)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Instance:</strong> An individual object created from the class</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Independent State:</strong> Each instance has its own data</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="max-w-6xl mx-auto mb-6 flex items-center gap-4">
          <motion.button
            onClick={createCrane}
            disabled={cranes.length >= 4}
            whileHover={cranes.length < 4 ? { scale: 1.02 } : {}}
            whileTap={cranes.length < 4 ? { scale: 0.98 } : {}}
            className={`
              px-8 py-4 border-2 border-black font-bold text-lg transition-colors flex items-center gap-3
              ${cranes.length < 4
                ? "bg-[#F7931E] text-black hover:bg-[#E08000]"
                : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }
            `}
          >
            <span>🏗️</span>
            Manufacture New Crane
          </motion.button>
          
          <div className="text-gray-600">
            <span className="font-bold text-[#F7931E]">{cranes.length}</span> / 4 cranes created
          </div>
        </div>

        {/* Cranes Grid - 2 Columns */}
        <div className="max-w-6xl mx-auto">
          {cranes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border-2 border-dashed border-gray-400 p-16 text-center"
            >
              <div className="text-6xl mb-4">🏭</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Factory is Empty</h3>
              <p className="text-gray-500">
                Click "Manufacture New Crane" to create your first crane instance!
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {cranes.map((crane, index) => (
                  <motion.div
                    key={crane.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="relative">
                      <CraneCard crane={crane} index={index} />
                      <button
                        onClick={() => removeCrane(crane.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 border border-black text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center"
                        title="Remove crane"
                      >
                        ×
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Code Preview */}
        {cranes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto mt-8"
          >
            <div className="bg-[#1d2021] border-2 border-black p-6 rounded overflow-hidden">
              <h3 className="text-[#F7931E] font-bold mb-4">📋 Behind the Scenes: The Crane Class</h3>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{`class Crane {
  // Each instance has its own properties
  id: string;                    // Unique identifier
  serialNumber: string;          // Auto-generated serial
  state: CraneState;             // Current state (power-off, power-on, etc.)
  position: number;              // Claw position (-200=left, 0=center, 200=right)
  isHoldingItem: boolean;        // Whether holding an item
  clawAngle: number;             // Claw open/closed angle
  cableExtension: number;        // Cable up/down position
  
  // Methods that operate on this instance's data
  setState(newState: CraneState) { ... }
  executeGrabSequence() { ... }
  executeDropSequence() { ... }
}

// Creating independent instances from the same class:
const crane1 = new Crane("1");  // Instance #1 with its own data
const crane2 = new Crane("2");  // Instance #2 with its own data
// crane1.state and crane2.state are completely independent!`}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] border-t-2 border-black px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-black text-sm">
            Crane Factory - Limbus Tech Emulator
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
