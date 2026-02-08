import { motion, AnimatePresence } from "framer-motion";
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

export default function CraneDemo() {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isHoldingItem, setIsHoldingItem] = useState(false);

  useEffect(() => {
    const runAnimation = async () => {
      // Phase 0: Initial state
      await delay(500);
      
      // Phase 1: Move to left (above item)
      setAnimationPhase(1);
      await delay(TIMING.moveToItem * 1000);
      
      // Phase 2: Open claws
      setAnimationPhase(2);
      await delay(TIMING.openClaws * 1000 + 300);
      
      // Phase 3: Lower crane
      setAnimationPhase(3);
      await delay(TIMING.lowerCrane * 1000);
      
      // Phase 4: Close claws (pick item)
      setAnimationPhase(4);
      setIsHoldingItem(true);
      await delay(TIMING.closeClaws * 1000 + 300);
      
      // Phase 5: Lift crane
      setAnimationPhase(5);
      await delay(TIMING.liftCrane * 1000);
      
      // Phase 6: Move to right (drop zone)
      setAnimationPhase(6);
      await delay(TIMING.moveToDrop * 1000);
      
      // Phase 7: Open claws (drop item)
      setAnimationPhase(7);
      setIsHoldingItem(false);
      await delay(TIMING.openClawsDrop * 1000 + 500);
      
      // Phase 8: Close claws and reset
      setAnimationPhase(8);
      await delay(TIMING.reset * 1000);
      
      // Reset to start
      setAnimationPhase(0);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate crane horizontal position based on phase
  const getCraneX = () => {
    if (animationPhase === 0) return 0;
    if (animationPhase === 1) return -200; // Move to left (item)
    if (animationPhase >= 2 && animationPhase <= 5) return -200; // Stay at item
    if (animationPhase === 6) return 200; // Move to right (drop zone)
    if (animationPhase >= 7) return 200; // Stay at drop zone
    return 0;
  };

  // Calculate crane vertical position based on phase
  const getCraneY = () => {
    if (animationPhase === 3) return 120; // Lower to pick
    if (animationPhase === 4 || animationPhase === 5) return 120; // Keep low while holding
    return 0; // Default height
  };

  // Calculate claw open state
  const getClawAngle = () => {
    if (animationPhase === 2 || animationPhase === 7) return 35; // Open
    return 15; // Closed
  };

  // Calculate item position
  const getItemX = () => {
    if (isHoldingItem) {
      // Item moves with crane
      if (animationPhase === 6) return 200;
      if (animationPhase >= 7) return 200;
      return -200;
    }
    // Item stays on ground or falls at drop zone
    if (animationPhase >= 7) return 200;
    return -200; // Original position
  };

  const getItemY = () => {
    if (isHoldingItem) {
      // Item is attached to crane
      return getCraneY() + 180;
    }
    if (animationPhase >= 7) {
      // Item on ground at drop zone
      return 320;
    }
    // Item on ground at original position
    return 320;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      <h1 className="text-3xl font-bold text-white mb-8">Crane Robot Demo</h1>
      
      {/* Animation Stage */}
      <div className="relative w-[800px] h-[500px] bg-slate-800 rounded-xl border-4 border-slate-700 overflow-hidden">
        
        {/* Track/Rail */}
        <div className="absolute top-16 left-0 right-0 h-4 bg-slate-600" />
        
        {/* Drop Zone Marker */}
        <div className="absolute bottom-0 right-[180px] w-24 h-4 bg-green-500/50 rounded-t-lg" />
        <div className="absolute bottom-6 right-[195px] text-green-400 text-sm font-semibold">DROP ZONE</div>
        
        {/* Item to Pick (when on ground) */}
        <motion.div
          className="absolute w-12 h-12 bg-amber-500 rounded-lg shadow-lg"
          animate={{
            x: getItemX() + 400 - 24,
            y: getItemY(),
            rotate: isHoldingItem ? 0 : 0,
          }}
          transition={{
            x: { duration: isHoldingItem && animationPhase === 6 ? TIMING.moveToDrop : 0.3, ease: "easeInOut" },
            y: { duration: 0.3, ease: "easeInOut" },
          }}
          style={{ left: 0, top: 0 }}
        >
          {/* Box details */}
          <div className="absolute inset-2 border-2 border-amber-600 rounded" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-600" />
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-600" />
        </motion.div>

        {/* Crane Assembly */}
        <motion.div
          className="absolute"
          animate={{
            x: getCraneX() + 400 - 40,
          }}
          transition={{
            duration: animationPhase === 1 ? TIMING.moveToItem : animationPhase === 6 ? TIMING.moveToDrop : 0.3,
            ease: "easeInOut",
          }}
          style={{ top: 20, left: 0 }}
        >
          {/* Trolley (the part that moves on rail) */}
          <div className="w-20 h-8 bg-slate-500 rounded-t-lg relative">
            <div className="absolute top-2 left-2 w-4 h-4 bg-slate-400 rounded-full" />
            <div className="absolute top-2 right-2 w-4 h-4 bg-slate-400 rounded-full" />
          </div>

          {/* Vertical Cable/Rod */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-2 bg-slate-400 origin-top"
            animate={{
              height: 80 + getCraneY(),
            }}
            transition={{
              duration: animationPhase === 3 ? TIMING.lowerCrane : animationPhase === 5 ? TIMING.liftCrane : 0.3,
              ease: "easeInOut",
            }}
            style={{ top: 32 }}
          />

          {/* Crane Hub and Claws */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            animate={{
              y: 80 + getCraneY(),
            }}
            transition={{
              duration: animationPhase === 3 ? TIMING.lowerCrane : animationPhase === 5 ? TIMING.liftCrane : 0.3,
              ease: "easeInOut",
            }}
            style={{ top: 32 }}
          >
            {/* Central Hub */}
            <div className="relative">
              <div className="w-16 h-16 bg-slate-400 rounded-full border-4 border-slate-500 relative z-10">
                <div className="absolute inset-3 bg-slate-300 rounded-full" />
                <div className="absolute inset-5 bg-slate-500 rounded-full" />
              </div>

              {/* Claw Left Arm */}
              <motion.div
                className="absolute top-1/2 left-1/2 origin-top-right"
                animate={{
                  rotate: -getClawAngle(),
                }}
                transition={{
                  duration: TIMING.openClaws,
                  ease: "easeInOut",
                }}
                style={{ marginTop: 8 }}
              >
                <div className="w-4 h-4 bg-slate-400 rounded-full absolute -top-2 -left-2 z-20" />
                <div className="w-6 h-32 bg-slate-500 rounded-full origin-top -rotate-[20deg] relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-16 bg-slate-500 rounded-full origin-top rotate-[20deg]" style={{ transform: 'translateX(-50%) rotate(20deg)' }} />
                </div>
              </motion.div>

              {/* Claw Right Arm */}
              <motion.div
                className="absolute top-1/2 left-1/2 origin-top-left"
                animate={{
                  rotate: getClawAngle(),
                }}
                transition={{
                  duration: TIMING.openClaws,
                  ease: "easeInOut",
                }}
                style={{ marginTop: 8 }}
              >
                <div className="w-4 h-4 bg-slate-400 rounded-full absolute -top-2 -right-2 z-20" />
                <div className="w-6 h-32 bg-slate-500 rounded-full origin-top rotate-[20deg] relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-16 bg-slate-500 rounded-full origin-top -rotate-[20deg]" style={{ transform: 'translateX(-50%) rotate(-20deg)' }} />
                </div>
              </motion.div>
            </div>
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
