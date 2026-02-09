import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

// Animation timing constants
const TIMING = {
  move: 0.8,
  openClaws: 0.3,
  lowerCrane: 0.4,
  closeClaws: 0.3,
  liftCrane: 0.4,
  openClawsDrop: 0.3
};

type LoopState = "idle" | "moving-to-grab" | "grabbing" | "moving-to-drop" | "dropping";

// Main Looping Claw Component
interface LoopingCraneProps {
  isPowered: boolean;
  showStatus?: boolean;
  className?: string;
  serialNumber?: string;
  hideStatusOverlay?: boolean;
  isBroken?: boolean;
}

function LoopingCraneInner({
  isPowered,
  showStatus = true,
  className = "",
  serialNumber = "???",
  hideStatusOverlay = false,
  isBroken = false
}: LoopingCraneProps) {
  const [craneX, setCraneX] = useState(0);
  const [cableExtension, setCableExtension] = useState(0);
  const [clawAngle, setClawAngle] = useState(1);
  const [isHoldingItem, setIsHoldingItem] = useState(false);
  const [itemX, setItemX] = useState(-150);
  const [loopState, setLoopState] = useState<LoopState>("idle");

  // Execute one complete grab-drop cycle
  const executeCycle = useCallback(async () => {
    if (!isPowered) return;

    // Step 1: Move to grab position (left)
    setLoopState("moving-to-grab");
    setCraneX(-150);
    setItemX(-150);
    setIsHoldingItem(false);
    await delay(TIMING.move * 1000);

    // Step 2: Open claws
    setClawAngle(45);
    await delay(TIMING.openClaws * 1000 + 100);

    // Step 3: Lower crane
    setCableExtension(40);
    await delay(TIMING.lowerCrane * 1000);

    // Step 4: Close claws (grab)
    setLoopState("grabbing");
    setClawAngle(1);
    await delay(TIMING.closeClaws * 1000 + 100);
    setIsHoldingItem(true);

    // Step 5: Lift crane
    setCableExtension(0);
    await delay(TIMING.liftCrane * 1000);

    if (!isPowered) return;

    // Step 6: Move to drop position (right)
    setLoopState("moving-to-drop");
    setCraneX(150);
    await delay(TIMING.move * 1000);

    // Step 7: Open claws (drop)
    setLoopState("dropping");
    setClawAngle(45);
    setIsHoldingItem(false);
    setItemX(150);
    await delay(TIMING.openClawsDrop * 1000 + 100);

    // Step 8: Close claws
    setClawAngle(1);
    await delay(TIMING.closeClaws * 1000);

    setLoopState("idle");
  }, [isPowered]);

  // Start the loop when powered
  useEffect(() => {
    if (!isPowered) {
      setLoopState("idle");
      setCraneX(0);
      setCableExtension(0);
      setClawAngle(1);
      setIsHoldingItem(false);
      setItemX(-150);
      return;
    }

    let isCancelled = false;

    const loop = async () => {
      while (!isCancelled && isPowered) {
        await executeCycle();
        // Small pause between cycles
        if (!isCancelled && isPowered) {
          await delay(500);
        }
      }
    };

    loop();

    return () => {
      isCancelled = true;
    };
  }, [isPowered, executeCycle]);

  const getItemX = () => {
    if (isHoldingItem) return craneX;
    return itemX;
  };

  const getItemY = () => {
    const groundY = 210;
    const craneAttachedY = 110 + cableExtension;
    if (isHoldingItem) {
      if (cableExtension >= 35) return groundY;
      return craneAttachedY;
    }
    return groundY;
  };

  const getStatusText = () => {
    if (isBroken) return "DESTROYED";
    if (!isPowered) return "OFF";
    if (loopState === "idle") return "READY";
    return loopState.replace(/-/g, " ").toUpperCase();
  };

  return (
    <div className={`relative bg-[#E0E0E0] border-2 border-black overflow-hidden ${className}`}>
      {/* Track/Rail */}
      <div className={`absolute top-4 left-0 right-0 h-3 border-b border-black ${isBroken ? 'bg-red-900/50' : 'bg-[#C0C0C0]'}`} />

      {/* Grab Zone Marker */}
      <div className={`absolute bottom-0 left-[15%] sm:left-[20%] w-16 sm:w-20 md:w-24 h-3 sm:h-4 rounded-t-lg border-t border-x border-black ${isBroken ? 'bg-red-900/30' : 'bg-[#22c55e]/50'}`} />
      <div className={`absolute bottom-[12%] sm:bottom-10 left-[12%] sm:left-[18%] text-[10px] sm:text-xs font-semibold ${isBroken ? 'text-red-800' : 'text-[#15803d]'}`}>
        GRAB
      </div>

      {/* Drop Zone Marker */}
      <div className={`absolute bottom-0 right-[15%] sm:right-[20%] w-16 sm:w-20 md:w-24 h-3 sm:h-4 rounded-t-lg border-t border-x border-black ${isBroken ? 'bg-red-900/30' : 'bg-[#ef4444]/50'}`} />
      <div className={`absolute bottom-[12%] sm:bottom-10 right-[12%] sm:right-[18%] text-[10px] sm:text-xs font-semibold ${isBroken ? 'text-red-800' : 'text-[#dc2626]'}`}>
        DROP
      </div>

      {/* Item */}
      <motion.div
        className={`absolute w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg shadow-lg border-2 border-black ${isBroken ? 'bg-red-800 rotate-45' : 'bg-[#F7931E]'}`}
        animate={{
          x: getItemX(),
          y: getItemY()
        }}
        transition={{
          x: { duration: isHoldingItem ? TIMING.move : 0.2, ease: "easeInOut" },
          y: { duration: isHoldingItem ? TIMING.liftCrane : 0.2, ease: "easeInOut" }
        }}
        style={{ 
          left: "50%", 
          marginLeft: "-24px",
          marginTop: "-24px"
        }}
      >
        {!isBroken && (
          <>
            <div className="absolute inset-1 sm:inset-2 border border-[#D06000] rounded" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D06000]" />
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#D06000]" />
          </>
        )}
      </motion.div>

      {/* Crane Assembly */}
      <motion.div
        className={`absolute top-5 ${isBroken ? 'opacity-40' : ''}`}
        animate={isBroken ? {} : { x: craneX }}
        transition={{ duration: TIMING.move, ease: "easeInOut" }}
        style={{ left: "50%", marginLeft: "-50px" }}
      >
        <svg
          width="100"
          height="180"
          viewBox="0 0 100 180"
          className="overflow-visible"
        >
          {/* Mounting Bracket */}
          <rect x="30" y="0" width="40" height="12" rx="2" fill="#64748b" />
          <circle cx="40" cy="6" r="2" fill="#94a3b8" />
          <circle cx="60" cy="6" r="2" fill="#94a3b8" />

          {/* Fixed rod stub */}
          <rect x="48" y="12" width="4" height="6" fill="#64748b" />

          {/* Cable */}
          <motion.rect
            x="49"
            y="18"
            width="2"
            fill="#64748b"
            animate={{ height: 15 + cableExtension }}
            transition={{ duration: TIMING.lowerCrane, ease: "easeInOut" }}
          />

          {/* Hub and Claws */}
          <motion.g
            animate={{ y: cableExtension }}
            transition={{ duration: TIMING.lowerCrane, ease: "easeInOut" }}
          >
            {/* Central Hub */}
            <circle cx="50" cy="40" r="14" fill="#64748b" />
            <circle cx="50" cy="40" r="9" fill="#475569" />
            <circle cx="50" cy="40" r="4" fill="#94a3b8" />

            {/* Left Arm */}
            <g transform={`rotate(${clawAngle}, 50, 40)`}>
              <path d="M50,40 L38,58" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
              <circle cx="36" cy="61" r="3" fill="#64748b" />
              <path d="M36,61 Q28,78 26,95 Q24,108 32,115 Q40,108 36,95 Q34,82 40,68" fill="#64748b" />
            </g>

            {/* Right Arm */}
            <g transform={`rotate(${-clawAngle}, 50, 40)`}>
              <path d="M50,40 L62,58" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
              <circle cx="64" cy="61" r="3" fill="#64748b" />
              <path d="M64,61 Q72,78 74,95 Q76,108 68,115 Q60,108 64,95 Q66,82 60,68" fill="#64748b" />
            </g>
          </motion.g>
        </svg>
      </motion.div>

      {/* Ground */}
      <div className={`absolute bottom-0 left-0 right-0 h-6 sm:h-8 border-t border-black flex items-center justify-center ${isBroken ? 'bg-red-900/50' : 'bg-[#C0C0C0]'}`}>
        <span className={`text-[10px] sm:text-xs font-bold ${isBroken ? 'text-red-800 line-through' : 'text-[#D06000]'}`}>
          Looping Claw #{serialNumber}
        </span>
      </div>

      {/* Status Indicator */}
      {showStatus && !hideStatusOverlay && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-[#E0E0E0] px-2 sm:px-3 py-1 border-2 border-black">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isPowered
                  ? "bg-[#F7931E] shadow-[0_0_8px_rgba(247,147,30,0.8)]"
                  : "bg-gray-500"
              }`}
            />
            <div>
              <div className="text-[8px] sm:text-[10px] text-gray-600 uppercase">Status</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-[#D06000]">
                {getStatusText()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loop indicator */}
      {isPowered && !hideStatusOverlay && (
        <motion.div
          className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-green-500 px-2 py-1 border-2 border-black"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="text-xs font-bold text-white">LOOP</span>
        </motion.div>
      )}
    </div>
  );
}

// Wrapper to ensure client-only rendering
export function LoopingCrane(props: LoopingCraneProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        className={`relative bg-[#F5F5F5] border-2 border-black overflow-hidden flex items-center justify-center ${props.className || ""}`}
        style={{ minHeight: "200px" }}
      >
        <div className="text-black/50">Loading...</div>
      </div>
    );
  }

  return <LoopingCraneInner {...props} />;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
