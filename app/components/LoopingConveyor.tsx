import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

// Animation timing constants
const TIMING = {
  move: 2 // Slower for continuous loop
};

// Item type for the conveyor
interface ConveyorItem {
  id: number;
  position: number; // -150 = left entry, 150 = right exit
  color: string;
}

// Power Indicator Component
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

// Conveyor Belt SVG Component
function ConveyorBelt({
  isPowered
}: {
  isPowered: boolean;
}) {
  return (
    <svg
      viewBox="0 0 400 120"
      className="w-full h-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Conveyor frame - left roller housing */}
      <rect x="10" y="20" width="30" height="80" rx="4" fill="#475569" />
      
      {/* Conveyor frame - right roller housing */}
      <rect x="360" y="20" width="30" height="80" rx="4" fill="#475569" />
      
      {/* Conveyor frame - top support beam */}
      <rect x="30" y="10" width="340" height="20" rx="2" fill="#64748b" />
      
      {/* Conveyor frame - bottom support beam */}
      <rect x="30" y="90" width="340" height="20" rx="2" fill="#64748b" />

      {/* Left roller */}
      <circle
        cx="35"
        cy="60"
        r="25"
        fill="#334155"
        stroke="#1e293b"
        strokeWidth="2"
      />
      <circle cx="35" cy="60" r="12" fill="#64748b" />
      <circle cx="35" cy="60" r="6" fill="#94a3b8" />

      {/* Right roller */}
      <circle
        cx="365"
        cy="60"
        r="25"
        fill="#334155"
        stroke="#1e293b"
        strokeWidth="2"
      />
      <circle cx="365" cy="60" r="12" fill="#64748b" />
      <circle cx="365" cy="60" r="6" fill="#94a3b8" />

      {/* Belt - top section with animated arrows */}
      <rect
        x="35"
        y="28"
        width="330"
        height="24"
        fill={isPowered ? "#1e293b" : "#334155"}
        opacity={isPowered ? 1 : 0.7}
      />
      
      {/* Continuous animated belt texture - arrows moving right */}
      {isPowered && (
        <motion.g
          animate={{
            x: [0, 40]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360].map((offset) => (
            <g key={offset} transform={`translate(${35 + offset}, 40)`}>
              <path
                d="M-8,-6 L8,0 L-8,6"
                fill="none"
                stroke="#F7931E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </motion.g>
      )}

      {/* Belt - bottom section */}
      <rect
        x="35"
        y="68"
        width="330"
        height="24"
        fill="#334155"
        opacity={0.7}
      />

      {/* Support legs */}
      <rect x="50" y="110" width="12" height="20" fill="#475569" />
      <rect x="338" y="110" width="12" height="20" fill="#475569" />
      
      {/* Power indicator on frame */}
      <circle
        cx="200"
        cy="15"
        r="5"
        fill={isPowered ? "#22c55e" : "#ef4444"}
        className={isPowered ? "animate-pulse" : ""}
      />
    </svg>
  );
}

// Main Looping Conveyor Component
interface LoopingConveyorProps {
  isPowered: boolean;
  showStatus?: boolean;
  className?: string;
  serialNumber?: string;
  itemCount?: number;
  autoRun?: boolean;
}

function LoopingConveyorInner({
  isPowered,
  showStatus = true,
  className = "",
  serialNumber = "???",
  itemCount = 3,
  hideStatusOverlay = false,
  isBroken = false,
  autoRun = true
}: LoopingConveyorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [items, setItems] = useState<ConveyorItem[]>([]);

  // Initialize items
  useEffect(() => {
    const initialItems: ConveyorItem[] = [];
    const colors = ["#F7931E", "#3B82F6", "#22C55E"];
    const spacing = 300 / (itemCount - 1);
    
    for (let i = 0; i < itemCount; i++) {
      initialItems.push({
        id: i,
        position: -150 + i * spacing,
        color: colors[i % colors.length]
      });
    }
    setItems(initialItems);
  }, [itemCount]);

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

  // Animation loop - move items continuously when powered and autoRun is true
  useEffect(() => {
    if (!isPowered || isBroken || !autoRun) return;

    let animationId: number;
    let lastTime = performance.now();
    const speed = 80; // pixels per second

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setItems(prevItems => 
        prevItems.map(item => {
          let newPosition = item.position + speed * deltaTime;
          // Loop back to start when item exits right
          if (newPosition > 200) {
            newPosition = -200;
          }
          return { ...item, position: newPosition };
        })
      );

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPowered, autoRun]);

  // Responsive values based on container width
  const baseWidth = 800;
  const scale = containerWidth / baseWidth;
  const itemSize = 50 * scale;
  const conveyorHeight = 120 * scale;

  return (
    <div
      ref={containerRef}
      className={`relative bg-[#E0E0E0] border-2 border-black overflow-hidden ${className}`}
      style={{ width: "100%", height: "auto", minHeight: "180px" }}
    >
      {/* Entry/Exit markers */}
      <div className={`absolute bottom-0 left-[10%] sm:left-[15%] w-12 sm:w-16 md:w-20 h-3 sm:h-4 rounded-t-lg border-t border-x border-black ${isBroken ? 'bg-red-900/30' : 'bg-[#22c55e]/30'}`} />
      <div className={`absolute bottom-[12%] sm:bottom-14 left-[8%] sm:left-[12%] text-[8px] sm:text-xs font-semibold ${isBroken ? 'text-red-800' : 'text-[#15803d]'}`}>
        ENTRY
      </div>

      <div className={`absolute bottom-0 right-[10%] sm:right-[15%] w-12 sm:w-16 md:w-20 h-3 sm:h-4 rounded-t-lg border-t border-x border-black ${isBroken ? 'bg-red-900/30' : 'bg-[#ef4444]/30'}`} />
      <div className={`absolute bottom-[12%] sm:bottom-14 right-[8%] sm:right-[12%] text-[8px] sm:text-xs font-semibold ${isBroken ? 'text-red-800' : 'text-[#dc2626]'}`}>
        EXIT
      </div>

      {/* Conveyor Belt Assembly - fills container */}
      <div
        className="absolute inset-x-4 top-1/2 -translate-y-1/2"
        style={{
          height: conveyorHeight
        }}
      >
        <ConveyorBelt isPowered={isPowered} />
      </div>

      {/* Items on conveyor */}
      {!isBroken && items.map((item) => (
        <motion.div
          key={item.id}
          className="absolute rounded-lg shadow-lg border-2 border-black"
          style={{
            width: itemSize,
            height: itemSize,
            backgroundColor: item.color,
            top: `calc(50% - ${conveyorHeight / 2 + itemSize / 2 - 15 * scale}px)`,
            left: 0,
            x: item.position * scale + containerWidth / 2 - itemSize / 2,
            maxWidth: "calc(100% - 16px)"
          }}
        >
          {/* Box details */}
          <div className="absolute inset-1 border border-black/30 rounded" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black/30" />
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black/30" />
        </motion.div>
      ))}

      {/* Ground/Support surface */}
      <div className={`absolute bottom-0 left-0 right-0 h-4 sm:h-6 md:h-8 border-t border-black flex items-center justify-center ${isBroken ? 'bg-red-900/50' : 'bg-[#C0C0C0]'}`}>
        <span className={`text-[10px] sm:text-xs md:text-sm font-bold ${isBroken ? 'text-red-800 line-through' : 'text-[#D06000]'}`}>
          Looping Conveyor #{serialNumber}
        </span>
      </div>

      {/* Status Indicator */}
      {showStatus && !hideStatusOverlay && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-[#E0E0E0] px-2 sm:px-4 py-1 sm:py-2 border-2 border-black">
          <div className="flex items-center gap-2 sm:gap-3">
            <PowerIndicator isOn={isPowered} />
            <div className="h-3 sm:h-4 w-px bg-black" />
            <div>
              <div className="text-[10px] sm:text-xs text-gray-900 uppercase tracking-wider">
                Mode
              </div>
              <div className="text-xs sm:text-sm font-mono text-[#D06000]">
                {isPowered ? (autoRun ? "LOOPING" : "IDLE") : "STOPPED"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item count indicator */}
      {!hideStatusOverlay && (
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-[#E0E0E0] px-2 sm:px-3 py-1 border-2 border-black">
          <div className="text-[10px] sm:text-xs text-gray-600 uppercase">Items</div>
          <div className="text-sm sm:text-base font-bold text-[#F7931E]">{itemCount}</div>
        </div>
      )}
    </div>
  );
}

// Wrapper to ensure client-only rendering for framer-motion
export function LoopingConveyor(props: LoopingConveyorProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        className={`relative bg-[#F5F5F5] border-2 border-black overflow-hidden flex items-center justify-center ${props.className || ""}`}
        style={{ width: "100%", height: "auto", minHeight: "180px" }}
      >
        <div className="text-black/50">Loading...</div>
      </div>
    );
  }

  return <LoopingConveyorInner {...props} />;
}
