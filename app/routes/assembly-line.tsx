import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router";
import { LoopingCrane } from "~/components/LoopingCrane";
import { LoopingConveyor } from "~/components/LoopingConveyor";

// ============================================
// TYPES AND ENUMS
// ============================================

type RobotType = "crane" | "conveyor";
type RobotState = "idle" | "working" | "error" | "destroyed";

interface Robot {
  id: string;
  type: RobotType;
  serialNumber: string;
  state: RobotState;
  isDestroyed?: boolean;
}

interface AssemblyLine {
  id: string;
  name: string;
  robots: Robot[];
  isRunning: boolean;
  isDestroyed?: boolean;
  showExplosion?: boolean;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateSerial(type: RobotType): string {
  const prefix = type === "crane" ? "CR" : "CV";
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// EXPLOSION EFFECT COMPONENT
// ============================================

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

// ============================================
// ASSEMBLY LINE CARD COMPONENT
// ============================================

function AssemblyLineCard({
  line,
  onAddRobot,
  onDestroy,
  onToggleRun,
  onSelfDestruct,
}: {
  line: AssemblyLine;
  onAddRobot: (lineId: string, type: RobotType) => void;
  onDestroy: (lineId: string) => void;
  onToggleRun: (lineId: string) => void;
  onSelfDestruct: (lineId: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className={`bg-white border-2 border-black overflow-hidden relative ${line.isDestroyed ? 'opacity-75' : ''}`}
    >
      {/* Explosion Effect */}
      <ExplosionEffect isPlaying={!!line.showExplosion} />
      
      {/* Header */}
      <div className={`border-b-2 border-black px-4 py-2 flex items-center justify-between ${line.isDestroyed ? 'bg-red-900' : 'bg-[#F7931E]'}`}>
        <div className="flex items-center gap-3">
          <span className={`font-bold ${line.isDestroyed ? 'text-white line-through' : 'text-black'}`}>{line.name}</span>
          <span className={`text-xs ${line.isDestroyed ? 'text-white/70' : 'text-black/70'}`}>({line.robots.length} machines)</span>
          {line.isDestroyed && (
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold animate-pulse">
              DESTROYED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Self Destruct button - only show if not destroyed */}
          {!line.isDestroyed && (
            <button
              onClick={() => onSelfDestruct(line.id)}
              className="px-3 py-1 text-xs font-bold border-2 border-black bg-orange-600 text-white hover:bg-orange-700 transition-colors"
              title="Self destruct - breaks all machines in this line"
            >
              💥 SELF DESTRUCT
            </button>
          )}
          
          {/* Run/Stop button - only show if not destroyed */}
          {!line.isDestroyed && (
            <button
              onClick={() => onToggleRun(line.id)}
              className={`px-3 py-1 text-xs font-bold border-2 border-black transition-colors ${
                line.isRunning
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {line.isRunning ? "STOP" : "RUN"}
            </button>
          )}
          
          {/* Destroy button */}
          <button
            onClick={() => onDestroy(line.id)}
            className="w-6 h-6 bg-red-600 border border-black text-white text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center"
            title="Remove assembly line"
          >
            ×
          </button>
        </div>
      </div>

      {/* Machine Chain */}
      <div className="p-4">
        {line.robots.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300">
            <p className="text-sm">No machines yet. Add one to start!</p>
          </div>
        ) : (
          <div className="flex gap-3 justify-start overflow-x-auto pb-2 px-2">
            {line.robots.map((machine, index) => (
              <div key={machine.id} className="flex items-center gap-2">
                <div className={`flex-shrink-0 ${machine.type === "crane" ? "w-64 sm:w-80 md:w-96" : "w-48 sm:w-56 md:w-64"}`}>
                  {/* Machine Header */}
                  <div className={`border-x-2 border-t-2 border-black px-3 py-1.5 ${machine.isDestroyed ? 'bg-red-900' : 'bg-[#E0E0E0]'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono truncate ${machine.isDestroyed ? 'text-white line-through' : ''}`}>{machine.serialNumber}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${machine.isDestroyed ? 'bg-red-600' : machine.state === "working" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    </div>
                  </div>
                  
                  {/* Machine Visual - Using actual components */}
                  <div className="border-2 border-black">
                    {machine.type === "crane" ? (
                      <LoopingCrane
                        isPowered={line.isRunning && !line.isDestroyed}
                        serialNumber={machine.serialNumber}
                        hideStatusOverlay={true}
                        showStatus={false}
                        isBroken={machine.isDestroyed}
                        className="h-52"
                      />
                    ) : (
                      <LoopingConveyor
                        isPowered={line.isRunning && !line.isDestroyed}
                        serialNumber={machine.serialNumber}
                        hideStatusOverlay={true}
                        showStatus={false}
                        itemCount={3}
                        isBroken={machine.isDestroyed}
                        className="h-40"
                      />
                    )}
                  </div>
                  
                  {/* Status badge */}
                  <div className={`border-x-2 border-b-2 border-black px-3 py-1.5 ${machine.isDestroyed ? 'bg-red-900' : 'bg-[#F0F0F0]'}`}>
                    <div className={`text-[10px] text-center uppercase font-bold ${machine.isDestroyed ? 'text-red-400' : machine.state === "working" ? "text-green-600" : "text-gray-500"}`}>
                      {machine.isDestroyed ? "DESTROYED" : machine.state}
                    </div>
                  </div>
                </div>
                
                {/* Connection arrow (except for last) */}
                {index < line.robots.length - 1 && (
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-[#F7931E] text-xl"
                    >
                      →
                    </motion.div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {line.robots.length > 0 && (
        <div className="bg-[#E8E8E8] border-t-2 border-black px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span>
                <span className="text-gray-600">Conveyors:</span>{" "}
                <span className="font-bold">{line.robots.filter(r => r.type === "conveyor").length}</span>
              </span>
              <span>
                <span className="text-gray-600">Cranes:</span>{" "}
                <span className="font-bold">{line.robots.filter(r => r.type === "crane").length}</span>
              </span>
            </div>
            <span className={`font-bold ${line.isDestroyed ? 'text-red-600' : 'text-[#F7931E]'}`}>
              {line.isDestroyed ? "💥 DESTROYED" : line.isRunning ? "● RUNNING" : "○ STOPPED"}
            </span>
          </div>
        </div>
      )}

      {/* Add Machine Buttons */}
      <div className={`border-t-2 border-black px-4 py-3 ${line.isDestroyed ? 'bg-red-900/20' : 'bg-[#F5F5F5]'}`}>
        <div className={`text-xs mb-2 uppercase tracking-wider font-bold ${line.isDestroyed ? 'text-red-800' : 'text-gray-600'}`}>
          {line.isDestroyed ? '🔧 Repairs needed - Remove line to rebuild' : 'Add Machine:'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAddRobot(line.id, "conveyor")}
            disabled={line.robots.length >= 6 || line.isDestroyed}
            className="flex-1 px-3 py-2 bg-[#E0E0E0] border-2 border-black text-xs font-medium hover:bg-[#D0D0D0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div className="flex items-center justify-center gap-1">
              <span>📦</span>
              <span>Conveyor</span>
            </div>
          </button>
          <button
            onClick={() => onAddRobot(line.id, "crane")}
            disabled={line.robots.length >= 6 || line.isDestroyed}
            className="flex-1 px-3 py-2 bg-[#E0E0E0] border-2 border-black text-xs font-medium hover:bg-[#D0D0D0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div className="flex items-center justify-center gap-1">
              <span>🦾</span>
              <span>Claw</span>
            </div>
          </button>
        </div>
        {line.robots.length >= 6 && (
          <p className="text-[10px] text-red-500 mt-1 text-center">Maximum 6 machines per line</p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function AssemblyLine() {
  const [assemblyLines, setAssemblyLines] = useState<AssemblyLine[]>([]);
  const [nextLineId, setNextLineId] = useState(1);
  const [demoPowered, setDemoPowered] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create a new assembly line
  const createAssemblyLine = () => {
    const newLine: AssemblyLine = {
      id: `line-${nextLineId}`,
      name: `Assembly Line #${nextLineId}`,
      robots: [],
      isRunning: false
    };
    setAssemblyLines(prev => [...prev, newLine]);
    setNextLineId(prev => prev + 1);
  };

  // Destroy an assembly line
  const destroyAssemblyLine = (lineId: string) => {
    setAssemblyLines(prev => prev.filter(line => line.id !== lineId));
  };

  // Add a robot to an assembly line
  const addRobot = (lineId: string, type: RobotType) => {
    setAssemblyLines(prev => prev.map(line => {
      if (line.id !== lineId) return line;
      if (line.robots.length >= 6) return line;

      const newRobot: Robot = {
        id: `${line.id}-robot-${line.robots.length}`,
        type,
        serialNumber: generateSerial(type),
        state: "idle"
      };

      return {
        ...line,
        robots: [...line.robots, newRobot]
      };
    }));
  };

  // Toggle run/stop for an assembly line
  const toggleRun = (lineId: string) => {
    setAssemblyLines(prev => prev.map(line => {
      if (line.id !== lineId) return line;
      if (line.isDestroyed) return line; // Can't run if destroyed
      
      const newIsRunning = !line.isRunning;
      
      return {
        ...line,
        isRunning: newIsRunning,
        robots: line.robots.map(robot => ({
          ...robot,
          state: newIsRunning ? "working" : "idle"
        }))
      };
    }));
  };

  // Self destruct an assembly line - shows boom effect and breaks all robots
  const selfDestruct = (lineId: string) => {
    setAssemblyLines(prev => prev.map(line => {
      if (line.id !== lineId) return line;
      
      // Show explosion
      return {
        ...line,
        showExplosion: true,
        isRunning: false
      };
    }));
    
    // After explosion animation, mark as destroyed
    setTimeout(() => {
      setAssemblyLines(prev => prev.map(line => {
        if (line.id !== lineId) return line;
        
        return {
          ...line,
          isDestroyed: true,
          showExplosion: false,
          isRunning: false,
          robots: line.robots.map(robot => ({
            ...robot,
            state: "destroyed",
            isDestroyed: true
          }))
        };
      }));
    }, 500);
  };

  // Client-side only rendering for animations
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
        <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
          <h1 className="text-xl font-bold text-black">Assembly Line - Object Interaction Demo</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-black">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
      {/* Header */}
      <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-black tracking-wide">
            Assembly Line - Object Interaction Demo
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

      {/* Navigation */}
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
          <span className="font-bold text-black tracking-wider">Assembly Line</span>
          <Link to="/crane-factory" className="text-black hover:underline tracking-wider">
            Factory
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Educational Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-2xl font-bold text-black mb-3">
              🤖 Object Interaction & Collaboration
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-4">
                  In Object-Oriented Programming, <strong>objects can interact with each other</strong> 
                  by sending messages and calling methods. Each object maintains its own 
                  <strong>internal state</strong> and communicates with other objects through well-defined interfaces.
                </p>
                <p className="text-gray-700">
                  Watch how the <strong>conveyor machines</strong> pass items between each other, 
                  and how <strong>claw machines</strong> can pick up items from adjacent conveyors. 
                  Each machine is an independent instance handling its own state!
                </p>
              </div>
              <div className="bg-[#F8F8F8] border-2 border-black p-4">
                <h3 className="font-bold text-[#F7931E] mb-2">💡 Key Concepts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Object Interaction:</strong> Objects communicate via methods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Encapsulation:</strong> Each object manages its own state</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Fault Isolation:</strong> One object's failure doesn't crash others</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Instance Isolation:</strong> Each assembly line is independent - destroying one doesn't affect others!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Section - Looping Machines */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-[#E8E8E8] border-2 border-black p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-black">🔄 Continuous Operation Demo</h3>
              <button
                onClick={() => setDemoPowered(!demoPowered)}
                className={`px-4 py-2 text-sm font-bold border-2 border-black transition-colors ${
                  demoPowered
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {demoPowered ? "STOP DEMOS" : "START DEMOS"}
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Looping Claw Demo */}
              <div>
                <div className="bg-white border-2 border-black p-3 mb-2">
                  <div className="text-xs font-bold text-gray-600 mb-2 uppercase">Looping Claw</div>
                  <LoopingCrane 
                    isPowered={demoPowered} 
                    serialNumber="LOOP-001"
                    className="h-48"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  The crane continuously grabs items from the left and drops them on the right.
                </p>
              </div>

              {/* Looping Conveyor Demo */}
              <div>
                <div className="bg-white border-2 border-black p-3 mb-2">
                  <div className="text-xs font-bold text-gray-600 mb-2 uppercase">Looping Conveyor</div>
                  <LoopingConveyor
                    isPowered={demoPowered}
                    serialNumber="LOOP-002"
                    itemCount={3}
                    className="h-48"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Multiple items move continuously in a loop, demonstrating state management per item.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Assembly Line Button */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <motion.button
              onClick={createAssemblyLine}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-[#F7931E] border-2 border-black font-bold text-lg hover:bg-[#E08000] transition-colors flex items-center gap-3"
            >
              <span>🏭</span>
              Create Assembly Line
            </motion.button>
            
            <div className="text-gray-600">
              <span className="font-bold text-[#F7931E]">{assemblyLines.length}</span> active lines
            </div>
          </div>
        </div>

        {/* Assembly Lines Grid */}
        <div className="max-w-6xl mx-auto">
          {assemblyLines.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border-2 border-dashed border-gray-400 p-16 text-center"
            >
              <div className="text-6xl mb-4">🏭</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Assembly Lines</h3>
              <p className="text-gray-500">
                Click "Create Assembly Line" to build your first automated production line!
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {assemblyLines.map((line) => (
                  <AssemblyLineCard
                    key={line.id}
                    line={line}
                    onAddRobot={addRobot}
                    onDestroy={destroyAssemblyLine}
                    onToggleRun={toggleRun}
                    onSelfDestruct={selfDestruct}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Code Preview */}
        {assemblyLines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto mt-8"
          >
            <div className="bg-[#1d2021] border-2 border-black p-6 rounded overflow-hidden">
              <h3 className="text-[#F7931E] font-bold mb-4">
                📋 Behind the Scenes: Object Interaction
              </h3>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{`// Each machine is an independent object with its own state
class Conveyor {
  id: string;
  itemPosition: number;
  
  moveItem() {
    // Handle its own movement logic
    this.itemPosition += speed;
  }
}

class Claw {
  id: string;
  isHoldingItem: boolean;
  
  pickUp(item: Item) {
    // Can interact with items from adjacent conveyors
    if (!this.isHoldingItem) {
      this.isHoldingItem = true;
      item.heldBy = this.id;
    }
  }
}

// Objects interact through well-defined interfaces
const conveyor1 = new Conveyor("CV-001");
const crane1 = new Crane("CR-001");

// The crane can pick up from the conveyor
if (conveyor1.hasItem() && !crane1.isHoldingItem) {
  crane1.pickUp(conveyor1.getItem());
}

// Each object handles its own state - fault isolation!
// If crane1 fails, conveyor1 continues operating normally.`}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] border-t-2 border-black px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-black text-sm">
            Assembly Line Demo - Limbus Tech Emulator
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
