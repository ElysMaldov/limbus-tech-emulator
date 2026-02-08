import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Animation timing constants
const TIMING = {
  moveToItem: 2,
  openClaws: 0.5,
  lowerCrane: 1,
  closeClaws: 0.5,
  liftCrane: 1,
  moveToDrop: 2,
  openClawsDrop: 0.5,
  reset: 1,
};

// Crane SVG Component - Matches the reference design
function CraneClaw({ clawAngle }: { clawAngle: number }) {
  return (
    <svg 
      width="200" 
      height="280" 
      viewBox="0 0 100 140" 
      className="overflow-visible"
    >
      {/* Mounting Bracket at top */}
      <rect x="30" y="0" width="40" height="16" rx="2" fill="#64748b" />
      <circle cx="40" cy="8" r="3" fill="#94a3b8" />
      <circle cx="60" cy="8" r="3" fill="#94a3b8" />
      
      {/* Vertical Rod */}
      <rect x="48" y="16" width="4" height="24" fill="#64748b" />
      
      {/* Central Hub - Outer Ring */}
      <circle cx="50" cy="54" r="18" fill="#64748b" />
      
      {/* Central Hub - Inner Ring */}
      <circle cx="50" cy="54" r="12" fill="#475569" />
      
      {/* Central Hub - Center */}
      <circle cx="50" cy="54" r="6" fill="#94a3b8" />
      <circle cx="50" cy="54" r="3" fill="#475569" />
      
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
        <circle cx="32" cy="78" r="4" fill="#64748b" />
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
        <circle cx="68" cy="78" r="4" fill="#64748b" />
        {/* Lower claw - curved inward */}
        <path 
          d="M68,78 Q78,95 80,115 Q81,128 72,135 Q65,128 68,115 Q70,100 65,82" 
          fill="#64748b"
        />
      </g>
    </svg>
  );
}

export default function CraneDemo() {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isHoldingItem, setIsHoldingItem] = useState(false);

  useEffect(() => {
    const runAnimation = async () => {
      await delay(500);
      setAnimationPhase(1);
      await delay(TIMING.moveToItem * 1000);
      
      setAnimationPhase(2);
      await delay(TIMING.openClaws * 1000 + 300);
      
      setAnimationPhase(3);
      await delay(TIMING.lowerCrane * 1000);
      
      setAnimationPhase(4);
      setIsHoldingItem(true);
      await delay(TIMING.closeClaws * 1000 + 300);
      
      setAnimationPhase(5);
      await delay(TIMING.liftCrane * 1000);
      
      setAnimationPhase(6);
      await delay(TIMING.moveToDrop * 1000);
      
      setAnimationPhase(7);
      setIsHoldingItem(false);
      await delay(TIMING.openClawsDrop * 1000 + 500);
      
      setAnimationPhase(8);
      await delay(TIMING.reset * 1000);
      
      setAnimationPhase(0);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 10000);
    return () => clearInterval(interval);
  }, []);

  const getCraneX = () => {
    if (animationPhase === 0) return 0;
    if (animationPhase === 1) return -200;
    if (animationPhase >= 2 && animationPhase <= 5) return -200;
    if (animationPhase === 6) return 200;
    if (animationPhase >= 7) return 200;
    return 0;
  };

  const getCraneY = () => {
    if (animationPhase === 3) return 120;
    if (animationPhase === 4 || animationPhase === 5) return 120;
    return 0;
  };

  const getClawAngle = () => {
    if (animationPhase === 2 || animationPhase === 7) return 45;
    return 1;
  };

  const getItemX = () => {
    if (isHoldingItem) {
      if (animationPhase === 6) return 200;
      if (animationPhase >= 7) return 200;
      return -200;
    }
    if (animationPhase >= 7) return 200;
    return -200;
  };

  const getItemY = () => {
    if (isHoldingItem) {
      return getCraneY() + 230;
    }
    if (animationPhase >= 7) return 320;
    return 320;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      <h1 className="text-3xl font-bold text-white mb-8">Crane Robot Demo</h1>
      
      <div className="relative w-[800px] h-[500px] bg-slate-800 rounded-xl border-4 border-slate-700 overflow-hidden">
        
        {/* Track/Rail */}
        <div className="absolute top-16 left-0 right-0 h-4 bg-slate-600" />
        
        {/* Drop Zone Marker */}
        <div className="absolute bottom-0 right-[180px] w-24 h-4 bg-green-500/50 rounded-t-lg" />
        <div className="absolute bottom-6 right-[195px] text-green-400 text-sm font-semibold">DROP ZONE</div>
        
        {/* Item */}
        <motion.div
          className="absolute w-16 h-16 bg-amber-500 rounded-lg shadow-lg"
          animate={{
            x: getItemX() + 400 - 32,
            y: getItemY(),
          }}
          transition={{
            x: { duration: isHoldingItem && animationPhase === 6 ? TIMING.moveToDrop : 0.3, ease: "easeInOut" },
            y: { duration: 0.3, ease: "easeInOut" },
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
            x: getCraneX() + 400 - 100,
          }}
          transition={{
            duration: animationPhase === 1 ? TIMING.moveToItem : animationPhase === 6 ? TIMING.moveToDrop : 0.3,
            ease: "easeInOut",
          }}
          style={{ top: 20, left: 0 }}
        >
          {/* Extend rod based on phase */}
          <motion.div
            animate={{ y: getCraneY() }}
            transition={{
              duration: animationPhase === 3 ? TIMING.lowerCrane : animationPhase === 5 ? TIMING.liftCrane : 0.3,
              ease: "easeInOut",
            }}
          >
            {/* Extended rod section */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-1 bg-slate-500 origin-top"
              animate={{ height: getCraneY() }}
              transition={{
                duration: animationPhase === 3 ? TIMING.lowerCrane : animationPhase === 5 ? TIMING.liftCrane : 0.3,
                ease: "easeInOut",
              }}
              style={{ top: 40, left: 100 }}
            />
            
            {/* The Crane SVG */}
            <motion.div
              animate={{ y: getCraneY() }}
              transition={{
                duration: animationPhase === 3 ? TIMING.lowerCrane : animationPhase === 5 ? TIMING.liftCrane : 0.3,
                ease: "easeInOut",
              }}
            >
              <CraneClaw clawAngle={getClawAngle()} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-700" />
        
        {/* Status Indicator */}
        <div className="absolute top-4 left-4 bg-slate-900/80 px-4 py-2 rounded-lg">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Phase</div>
          <div className="text-sm font-mono text-cyan-400">
            {animationPhase === 0 && "Ready"}
            {animationPhase === 1 && "Moving to Item"}
            {animationPhase === 2 && "Opening Claws"}
            {animationPhase === 3 && "Lowering"}
            {animationPhase === 4 && "Grabbing"}
            {animationPhase === 5 && "Lifting"}
            {animationPhase === 6 && "Moving to Drop"}
            {animationPhase === 7 && "Dropping"}
            {animationPhase === 8 && "Resetting"}
          </div>
        </div>

        {/* Legend */}
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
      </div>

      <div className="mt-6 text-slate-400 text-sm text-center max-w-md">
        The crane robot automatically cycles through: Move → Open → Lower → Grab → Lift → Move → Drop → Repeat
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
