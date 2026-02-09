import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { LoopingCrane } from "~/components/LoopingCrane";
import { LoopingConveyor } from "~/components/LoopingConveyor";

// ============================================
// TYPES AND INTERFACES
// ============================================

type MachineType = "base" | "crane" | "conveyor";

interface MachineProperty {
  name: string;
  type: string;
  description: string;
  inherited?: boolean;
}

interface MachineMethod {
  name: string;
  returnType: string;
  description: string;
  inherited?: boolean;
  implemented?: boolean;
}

interface MachineClass {
  name: string;
  extends?: string;
  properties: MachineProperty[];
  methods: MachineMethod[];
  color: string;
  description: string;
}

// ============================================
// MACHINE CLASS DEFINITIONS
// ============================================

const MACHINE_CLASSES: Record<MachineType, MachineClass> = {
  base: {
    name: "Machine",
    properties: [
      { name: "IsPowered", type: "bool", description: "Whether the machine is turned on" },
      { name: "SerialNumber", type: "string", description: "Unique identifier for the machine" },
      { name: "State", type: "string", description: "Current operational state" },
    ],
    methods: [
      { name: "TogglePower", returnType: "void", description: "Turn machine on/off" },
      { name: "RunJob", returnType: "void", description: "Execute the machine's primary task (virtual)" },
    ],
    color: "#F7931E",
    description: "Base class for all machines",
  },
  crane: {
    name: "Crane",
    extends: "Machine",
    properties: [
      { name: "IsPowered", type: "bool", description: "Whether the machine is turned on", inherited: true },
      { name: "SerialNumber", type: "string", description: "Unique identifier for the machine", inherited: true },
      { name: "State", type: "string", description: "Current operational state", inherited: true },
      { name: "ClawPosition", type: "string", description: "Position of the claw (Left/Center/Right)" },
      { name: "IsHoldingItem", type: "bool", description: "Whether the claw is holding an item" },
      { name: "CableExtension", type: "int", description: "How far the cable is extended" },
    ],
    methods: [
      { name: "TogglePower", returnType: "void", description: "Turn machine on/off", inherited: true },
      { name: "RunJob", returnType: "void", description: "Grab item from left, drop on right", implemented: true },
      { name: "MoveLeft", returnType: "void", description: "Move claw to item zone" },
      { name: "MoveRight", returnType: "void", description: "Move claw to drop zone" },
      { name: "GrabItem", returnType: "void", description: "Close claws to grab item" },
      { name: "DropItem", returnType: "void", description: "Open claws to drop item" },
    ],
    color: "#3B82F6",
    description: "A claw machine for picking and moving items",
  },
  conveyor: {
    name: "Conveyor",
    extends: "Machine",
    properties: [
      { name: "IsPowered", type: "bool", description: "Whether the machine is turned on", inherited: true },
      { name: "SerialNumber", type: "string", description: "Unique identifier for the machine", inherited: true },
      { name: "State", type: "string", description: "Current operational state", inherited: true },
      { name: "ItemPosition", type: "int", description: "Current position of item on belt" },
      { name: "BeltDirection", type: "string", description: "Direction of belt movement" },
      { name: "Speed", type: "float", description: "Speed of the conveyor belt" },
    ],
    methods: [
      { name: "TogglePower", returnType: "void", description: "Turn machine on/off", inherited: true },
      { name: "RunJob", returnType: "void", description: "Move items across the belt", implemented: true },
      { name: "MoveLeft", returnType: "void", description: "Move belt to the left" },
      { name: "MoveRight", returnType: "void", description: "Move belt to the right" },
    ],
    color: "#22C55E",
    description: "A conveyor belt for transporting items",
  },
};

// ============================================
// CLASS DIAGRAM COMPONENT
// ============================================

function ClassBox({
  machineType,
  isSelected,
  onClick,
  visibleProperties,
  visibleMethods,
  allVisibleProperties,
  allVisibleMethods,
  isPowered,
}: {
  machineType: MachineType;
  isSelected: boolean;
  onClick: () => void;
  visibleProperties: Set<string>;
  visibleMethods: Set<string>;
  allVisibleProperties: Record<MachineType, Set<string>>;
  allVisibleMethods: Record<MachineType, Set<string>>;
  isPowered: boolean;
}) {
  const machine = MACHINE_CLASSES[machineType];
  const isBase = machineType === "base";

  // Check if a property should be shown (for inherited props, check base class visibility)
  const isPropertyVisible = (prop: MachineProperty) => {
    if (!visibleProperties.has(prop.name)) return false;
    if (prop.inherited && !allVisibleProperties.base.has(prop.name)) return false;
    return true;
  };

  // Check if a method should be shown (for inherited methods, check base class visibility)
  const isMethodVisible = (method: MachineMethod) => {
    if (!visibleMethods.has(method.name)) return false;
    if (method.inherited && !allVisibleMethods.base.has(method.name)) return false;
    return true;
  };

  return (
    <motion.div
      onClick={onClick}
      className={`cursor-pointer border-2 ${isSelected ? "border-black ring-2 ring-offset-2 ring-[#F7931E]" : "border-black"} bg-white overflow-hidden`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Header */}
      <div
        className="px-4 py-2 border-b-2 border-black"
        style={{ backgroundColor: machine.color }}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-black text-lg">{machine.name}</span>
          {machine.extends && (
            <span className="text-xs text-black/70">extends {machine.extends}</span>
          )}
        </div>
        <div className="text-xs text-black/60 mt-1">{machine.description}</div>
      </div>

      {/* Properties Section */}
      <div className="border-b border-gray-300">
        <div className="bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 uppercase tracking-wider">
          Properties
        </div>
        <div className="p-2 space-y-1 min-h-[60px]">
          {machine.properties
            .filter(isPropertyVisible)
            .map((prop) => (
              <motion.div
                key={prop.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`flex items-center gap-2 text-sm ${prop.inherited ? "text-gray-600" : "text-black"}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    prop.inherited ? "bg-gray-400" : "bg-[#F7931E]"
                  }`}
                />
                <span className="font-mono text-xs text-blue-600">{prop.type}</span>
                <span className="font-medium">{prop.name}</span>
              </motion.div>
            ))}
          {machine.properties.filter(isPropertyVisible).length === 0 && (
            <div className="text-xs text-gray-400 italic">No visible properties</div>
          )}
        </div>
      </div>

      {/* Methods Section */}
      <div>
        <div className="bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 uppercase tracking-wider">
          Methods
        </div>
        <div className="p-2 space-y-1 min-h-[60px]">
          {machine.methods
            .filter(isMethodVisible)
            .map((method) => (
              <motion.div
                key={method.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`flex items-center gap-2 text-sm ${method.inherited ? "text-gray-600" : "text-black"}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    method.inherited ? "bg-gray-400" : method.implemented ? "bg-green-500" : "bg-purple-500"
                  }`}
                />
                <span className="font-mono text-xs text-purple-600">{method.returnType}</span>
                <span className="font-medium">{method.name}()</span>
                {method.implemented && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">override</span>
                )}
              </motion.div>
            ))}
          {machine.methods.filter(isMethodVisible).length === 0 && (
            <div className="text-xs text-gray-400 italic">No visible methods</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// INHERITANCE LINES COMPONENT
// ============================================

function InheritanceLines() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <svg className="w-full h-full" viewBox="0 0 800 800" preserveAspectRatio="xMidYMin meet">
        {/* Line from Machine to Crane */}
        <motion.path
          d="M 400 120 L 200 250"
          stroke="#3B82F6"
          strokeWidth="3"
          fill="none"
          strokeDasharray="8,4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.polygon
          points="190,260 210,260 200,275"
          fill="#3B82F6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.3 }}
        />

        {/* Line from Machine to Conveyor */}
        <motion.path
          d="M 400 120 L 600 250"
          stroke="#22C55E"
          strokeWidth="3"
          fill="none"
          strokeDasharray="8,4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.polygon
          points="590,260 610,260 600,275"
          fill="#22C55E"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.3 }}
        />

        {/* Labels */}
        <motion.text
          x="270"
          y="180"
          className="text-xs fill-blue-600 font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          inherits
        </motion.text>
        <motion.text
          x="470"
          y="180"
          className="text-xs fill-green-600 font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          inherits
        </motion.text>
      </svg>
    </div>
  );
}

// ============================================
// STATE CARD COMPONENT
// ============================================

function StateCard({
  machineType,
  visibleProperties,
  visibleMethods,
  allVisibleProperties,
  allVisibleMethods,
  isPowered,
  onTogglePower,
  onRunJob,
  isRunning,
}: {
  machineType: MachineType;
  visibleProperties: Set<string>;
  visibleMethods: Set<string>;
  allVisibleProperties: Record<MachineType, Set<string>>;
  allVisibleMethods: Record<MachineType, Set<string>>;
  isPowered: boolean;
  onTogglePower: () => void;
  onRunJob: () => void;
  isRunning: boolean;
}) {
  const machine = MACHINE_CLASSES[machineType];
  const [serialNumber] = useState(
    machineType === "crane"
      ? `CR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      : `CV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Check if a property should be shown (for inherited props, check base class visibility)
  const isPropertyVisible = (propName: string, isInherited: boolean) => {
    if (!visibleProperties.has(propName)) return false;
    if (isInherited && !allVisibleProperties.base.has(propName)) return false;
    return true;
  };

  // Check if a method should be shown (for inherited methods, check base class visibility)
  const isMethodVisible = (methodName: string, isInherited: boolean) => {
    if (!visibleMethods.has(methodName)) return false;
    if (isInherited && !allVisibleMethods.base.has(methodName)) return false;
    return true;
  };

  // Get the method definition from the machine class
  const getMethodDef = (methodName: string) => {
    return machine.methods.find(m => m.name === methodName);
  };

  return (
    <motion.div
      className="bg-[#E0E0E0] border-2 border-black p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      key={machineType}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-black text-lg">{machine.name} State</h3>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: machine.color }}
        />
      </div>

      {/* Properties Display */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {isPropertyVisible("IsPowered", true) && (
          <div className="bg-white border-2 border-black p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">IsPowered</div>
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full ${
                  isPowered
                    ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                    : "bg-gray-500"
                }`}
              />
              <span className={`font-bold ${isPowered ? "text-green-600" : "text-gray-500"}`}>
                {isPowered ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        )}

        {isPropertyVisible("SerialNumber", true) && (
          <div className="bg-white border-2 border-black p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">SerialNumber</div>
            <div className="font-mono text-sm text-[#D06000]">{serialNumber}</div>
          </div>
        )}

        {isPropertyVisible("State", true) && (
          <div className="bg-white border-2 border-black p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">State</div>
            <div className="font-mono text-sm text-[#D06000]">
              {isRunning ? "RUNNING" : isPowered ? "IDLE" : "OFF"}
            </div>
          </div>
        )}

        {machineType === "crane" && isPropertyVisible("ClawPosition", false) && (
          <div className="bg-white border-2 border-black p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">ClawPosition</div>
            <div className="font-mono text-sm text-blue-600">Center</div>
          </div>
        )}

        {machineType === "crane" && isPropertyVisible("IsHoldingItem", false) && (
          <div className="bg-white border-2 border-black p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">IsHoldingItem</div>
            <div className="font-mono text-sm text-blue-600">false</div>
          </div>
        )}

        {machineType === "conveyor" && isPropertyVisible("BeltDirection", false) && (
          <div className="bg-white border-2 border-black p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">BeltDirection</div>
            <div className="font-mono text-sm text-green-600">Stopped</div>
          </div>
        )}

        {machineType === "conveyor" && isPropertyVisible("ItemPosition", false) && (
          <div className="bg-white border-2 border-black p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">ItemPosition</div>
            <div className="font-mono text-sm text-green-600">0</div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isMethodVisible("TogglePower", true) && (
          <button
            onClick={onTogglePower}
            className={`flex-1 px-4 py-3 border-2 border-black font-bold transition-colors ${
              isPowered
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {isPowered ? "Turn OFF" : "Turn ON"}
          </button>
        )}

        {isMethodVisible("RunJob", true) && (
          <button
            onClick={onRunJob}
            disabled={!isPowered || isRunning}
            className={`flex-1 px-4 py-3 border-2 border-black font-bold transition-colors ${
              isPowered && !isRunning
                ? "bg-[#F7931E] text-black hover:bg-[#E08000]"
                : "bg-gray-400 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isRunning ? "Running..." : "Run Job"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// TOGGLE ITEM COMPONENT
// ============================================

function ToggleItem({
  name,
  description,
  isVisible,
  onToggle,
  color,
  inherited,
  implemented,
}: {
  name: string;
  description: string;
  isVisible: boolean;
  onToggle: () => void;
  color: string;
  inherited?: boolean;
  implemented?: boolean;
}) {
  return (
    <motion.button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 p-2 border-2 text-left transition-all text-sm ${
        isVisible
          ? "border-black bg-white"
          : "border-gray-300 bg-gray-100 opacity-60"
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        className={`w-8 h-5 rounded-full border-2 flex items-center flex-shrink-0 transition-colors ${
          isVisible ? "border-black bg-green-500" : "border-gray-400 bg-gray-300"
        }`}
      >
        <motion.div
          className="w-3 h-3 rounded-full bg-white border border-black"
          animate={{ x: isVisible ? 14 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-black truncate">{name}</div>
        <div className="text-[10px] text-gray-500 truncate">{description}</div>
      </div>
      {inherited && (
        <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
          inherited
        </span>
      )}
      {implemented && (
        <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex-shrink-0">
          override
        </span>
      )}
    </motion.button>
  );
}

// ============================================
// BLUEPRINT DIALOG COMPONENT
// ============================================

function BlueprintDialog({
  isOpen,
  onClose,
  visibleProperties,
  visibleMethods,
}: {
  isOpen: boolean;
  onClose: () => void;
  visibleProperties: Record<MachineType, Set<string>>;
  visibleMethods: Record<MachineType, Set<string>>;
}) {
  if (!isOpen) return null;

  const generateCSharpCode = () => {
    const baseProps = MACHINE_CLASSES.base.properties
      .filter((p) => visibleProperties.base.has(p.name))
      .map((p) => `    public ${p.type} ${p.name} { get; set; }`)
      .join("\n");

    const baseMethods = MACHINE_CLASSES.base.methods
      .filter((m) => visibleMethods.base.has(m.name))
      .map((m) => {
        if (m.name === "RunJob") {
          return `    public virtual ${m.returnType} ${m.name}()
    {
        // Base implementation - override in derived classes
        Console.WriteLine("Running generic machine job...");
    }`;
        }
        return `    public ${m.returnType} ${m.name}()
    {
        IsPowered = !IsPowered;
        Console.WriteLine($"Power is now: {IsPowered}");
    }`;
      })
      .join("\n\n");

    const craneProps = MACHINE_CLASSES.crane.properties
      .filter((p) => visibleProperties.crane.has(p.name) && !p.inherited)
      .map((p) => `    public ${p.type} ${p.name} { get; set; }`)
      .join("\n");

    const craneMethods = MACHINE_CLASSES.crane.methods
      .filter((m) => visibleMethods.crane.has(m.name) && !m.inherited)
      .map((m) => {
        if (m.name === "RunJob") {
          return `    public override void ${m.name}()
    {
        // Crane-specific implementation
        MoveLeft();
        GrabItem();
        MoveRight();
        DropItem();
    }`;
        }
        return `    public void ${m.name}()
    {
        // ${m.description}
        Console.WriteLine("${m.name} executed");
    }`;
      })
      .join("\n\n");

    const conveyorProps = MACHINE_CLASSES.conveyor.properties
      .filter((p) => visibleProperties.conveyor.has(p.name) && !p.inherited)
      .map((p) => `    public ${p.type} ${p.name} { get; set; }`)
      .join("\n");

    const conveyorMethods = MACHINE_CLASSES.conveyor.methods
      .filter((m) => visibleMethods.conveyor.has(m.name) && !m.inherited)
      .map((m) => {
        if (m.name === "RunJob") {
          return `    public override void ${m.name}()
    {
        // Conveyor-specific implementation
        MoveLeft();
        MoveRight();
    }`;
        }
        return `    public void ${m.name}()
    {
        // ${m.description}
        Console.WriteLine("${m.name} executed");
    }`;
      })
      .join("\n\n");

    return `// ============================================
// MACHINE CLASS HIERARCHY
// ============================================

// Base Machine Class
public class Machine
{
${baseProps}

${baseMethods}
}

// ============================================

// Crane Class - inherits from Machine
public class Crane : Machine
{
${craneProps}

${craneMethods}
}

// ============================================

// Conveyor Class - inherits from Machine
public class Conveyor : Machine
{
${conveyorProps}

${conveyorMethods}
}

// ============================================
// USAGE EXAMPLE
// ============================================

public class Program
{
    public static void Main()
    {
        // Create machine instances
        Crane crane = new Crane();
        Conveyor conveyor = new Conveyor();
        
        // Polymorphism in action!
        Machine[] machines = { crane, conveyor };
        
        foreach (var machine in machines)
        {
            machine.TogglePower();  // Inherited method
            machine.RunJob();       // Polymorphic method call
            // Each machine runs its own version of RunJob()
        }
    }
}`;
  };

  const generateUMLDiagram = () => {
    const baseProps = MACHINE_CLASSES.base.properties
      .filter((p) => visibleProperties.base.has(p.name))
      .map((p) => `+${p.name}: ${p.type}`)
      .join("\n  ");

    const baseMethods = MACHINE_CLASSES.base.methods
      .filter((m) => visibleMethods.base.has(m.name))
      .map((m) => `+${m.name}(): ${m.returnType}`)
      .join("\n  ");

    const craneProps = MACHINE_CLASSES.crane.properties
      .filter((p) => visibleProperties.crane.has(p.name) && !p.inherited)
      .map((p) => `+${p.name}: ${p.type}`)
      .join("\n  ");

    const craneMethods = MACHINE_CLASSES.crane.methods
      .filter((m) => visibleMethods.crane.has(m.name) && !m.inherited)
      .map((m) => `+${m.name}(): ${m.returnType}`)
      .join("\n  ");

    const conveyorProps = MACHINE_CLASSES.conveyor.properties
      .filter((p) => visibleProperties.conveyor.has(p.name) && !p.inherited)
      .map((p) => `+${p.name}: ${p.type}`)
      .join("\n  ");

    const conveyorMethods = MACHINE_CLASSES.conveyor.methods
      .filter((m) => visibleMethods.conveyor.has(m.name) && !m.inherited)
      .map((m) => `+${m.name}(): ${m.returnType}`)
      .join("\n  ");

    return `┌─────────────────────────────────────────────────────────────────┐
│                     UML CLASS DIAGRAM                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│    Machine       │
├──────────────────┤
${baseProps ? "  " + baseProps + "\n" : ""}├──────────────────┤
${baseMethods ? "  " + baseMethods + "\n" : ""}└──────────────────┘
         △
         │ inherits
         │
    ┌────┴────┐
    │         │
┌───┴───┐ ┌───┴────┐
│ Crane │ │Conveyor│
├───────┤ ├────────┤
${craneProps ? "  " + craneProps + "\n" : ""}├───────┤ ├────────┤
${craneMethods ? "  " + craneMethods + "\n" : ""}└───────┘ ${conveyorProps ? "  " + conveyorProps + "\n" : conveyorMethods ? "" : "         "}├────────┤
          ${conveyorMethods ? "  " + conveyorMethods + "\n" : ""}          └────────┘

Legend:
───────  Class boundary
├──────  Separator (properties | methods)
  △      Inheritance arrow (points to base class)
  +      Public visibility`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white border-2 border-black max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F7931E] border-b-2 border-black px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">📋 Machine Blueprint</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#E0E0E0] border-2 border-black flex items-center justify-center hover:bg-[#D0D0D0]"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* UML Diagram */}
          <div>
            <h3 className="font-bold text-black mb-3 text-lg">UML Class Diagram</h3>
            <div className="bg-gray-900 border-2 border-black p-4 overflow-x-auto">
              <pre className="text-green-400 font-mono text-sm whitespace-pre">
                {generateUMLDiagram()}
              </pre>
            </div>
          </div>

          {/* C# Code */}
          <div>
            <h3 className="font-bold text-black mb-3 text-lg">C# Implementation</h3>
            <SyntaxHighlighter
              language="csharp"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                border: "2px solid black",
                fontSize: "14px",
              }}
            >
              {generateCSharpCode()}
            </SyntaxHighlighter>
          </div>

          {/* Educational Note */}
          <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded">
            <h4 className="font-bold text-blue-800 mb-2">💡 Key Concepts Demonstrated</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Inheritance:</strong> Crane and Conveyor inherit common properties and methods from Machine</li>
              <li>• <strong>Polymorphism:</strong> The RunJob() method behaves differently based on the actual object type</li>
              <li>• <strong>Method Overriding:</strong> Derived classes provide their own implementation of RunJob()</li>
              <li>• <strong>Code Reuse:</strong> TogglePower() is written once in the base class and inherited by all machines</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F0F0F0] border-t-2 border-black px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#E0E0E0] border-2 border-black font-bold hover:bg-[#D0D0D0] transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function MachineHierarchy() {
  const [selectedMachine, setSelectedMachine] = useState<MachineType>("base");
  const [isClient, setIsClient] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(false);

  // Power state for each machine
  const [powerStates, setPowerStates] = useState({
    base: false,
    crane: false,
    conveyor: false,
  });

  // Demo power state for both machines
  const [demoPowered, setDemoPowered] = useState(false);

  // Running state for animations
  const [isRunning, setIsRunning] = useState(false);

  // Visible properties for each machine
  const [visibleProperties, setVisibleProperties] = useState<Record<MachineType, Set<string>>>({
    base: new Set(["IsPowered", "SerialNumber", "State"]),
    crane: new Set(["IsPowered", "SerialNumber", "State", "ClawPosition", "IsHoldingItem", "CableExtension"]),
    conveyor: new Set(["IsPowered", "SerialNumber", "State", "ItemPosition", "BeltDirection", "Speed"]),
  });

  // Visible methods for each machine
  const [visibleMethods, setVisibleMethods] = useState<Record<MachineType, Set<string>>>({
    base: new Set(["TogglePower", "RunJob"]),
    crane: new Set(["TogglePower", "RunJob", "MoveLeft", "MoveRight", "GrabItem", "DropItem"]),
    conveyor: new Set(["TogglePower", "RunJob", "MoveLeft", "MoveRight"]),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleProperty = (machineType: MachineType, propertyName: string) => {
    setVisibleProperties((prev) => {
      const newSet = new Set(prev[machineType]);
      if (newSet.has(propertyName)) {
        newSet.delete(propertyName);
      } else {
        newSet.add(propertyName);
      }
      return { ...prev, [machineType]: newSet };
    });
  };

  const toggleMethod = (machineType: MachineType, methodName: string) => {
    setVisibleMethods((prev) => {
      const newSet = new Set(prev[machineType]);
      if (newSet.has(methodName)) {
        newSet.delete(methodName);
      } else {
        newSet.add(methodName);
      }
      return { ...prev, [machineType]: newSet };
    });
  };

  const handleTogglePower = () => {
    setPowerStates((prev) => ({
      ...prev,
      [selectedMachine]: !prev[selectedMachine],
    }));
  };

  const handleRunJob = () => {
    if (!powerStates[selectedMachine]) return;
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex flex-col">
        <header className="bg-[#F7931E] border-b-2 border-black px-4 py-3">
          <h1 className="text-xl font-bold text-black">Machine Hierarchy - Inheritance & Polymorphism</h1>
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
          <h1 className="text-lg md:text-xl font-bold text-black tracking-wide">
            Machine Hierarchy - Inheritance & Polymorphism
          </h1>
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

      {/* Navigation */}
      <nav className="bg-[#E8E8E8] border-b-2 border-black px-4 py-2">
        <div className="flex items-center gap-4 sm:gap-8 flex-wrap">
          <Link to="/" className="text-black hover:underline tracking-wider text-sm">
            Home
          </Link>
          <Link to="/crane" className="text-black hover:underline tracking-wider text-sm">
            Crane
          </Link>
          <Link to="/conveyor" className="text-black hover:underline tracking-wider text-sm">
            Conveyor
          </Link>
          <Link to="/challenge-01" className="text-black hover:underline tracking-wider text-sm">
            Challenge 01
          </Link>
          <Link to="/crane-factory" className="text-black hover:underline tracking-wider text-sm">
            Claw Factory
          </Link>
          <Link to="/challenge-02" className="text-black hover:underline tracking-wider text-sm">
            Challenge 02
          </Link>
          <Link to="/assembly-line" className="text-black hover:underline tracking-wider text-sm">
            Assembly Line
          </Link>
          <span className="font-bold text-black tracking-wider text-sm">Machine Hierarchy</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {/* Educational Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white border-2 border-black p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-black mb-3">
              🧬 Inheritance & Polymorphism
            </h2>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <p className="text-gray-700 mb-3 text-sm md:text-base">
                  <strong>Inheritance</strong> allows a class to inherit properties and methods from another class. 
                  The <strong>Machine</strong> class is the base (parent) class, while <strong>Crane</strong> and{" "}
                  <strong>Conveyor</strong> are derived (child) classes that inherit from it.
                </p>
                <p className="text-gray-700 text-sm md:text-base">
                  <strong>Polymorphism</strong> means "many forms." Both Crane and Conveyor have their own 
                  implementation of the <code>RunJob()</code> method, but they can be treated as generic Machines.
                </p>
              </div>
              <div className="bg-[#F8F8F8] border-2 border-black p-4">
                <h3 className="font-bold text-[#F7931E] mb-2">💡 Key Concepts</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Base Class:</strong> Defines common behavior (Machine)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Derived Classes:</strong> Extend base with specific features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Inheritance:</strong> Reuse code from parent class</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Polymorphism:</strong> Same method, different behavior</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Left Column - Class Diagram */}
          <div className="lg:col-span-2 space-y-4">
            {/* Class Diagram */}
            <div className="bg-white border-2 border-black p-4 md:p-6">
              <h3 className="font-bold text-black mb-4 text-lg">Class Hierarchy Diagram</h3>
              <div className="relative" style={{ height: "800px" }}>
                <InheritanceLines />

                {/* Machine Base Class - Top */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-64 z-10">
                  <ClassBox
                    machineType="base"
                    isSelected={selectedMachine === "base"}
                    onClick={() => setSelectedMachine("base")}
                    visibleProperties={visibleProperties.base}
                    visibleMethods={visibleMethods.base}
                    allVisibleProperties={visibleProperties}
                    allVisibleMethods={visibleMethods}
                    isPowered={powerStates.base}
                  />
                </div>

                {/* Crane Class - Bottom Left */}
                <div className="absolute left-[8%] md:left-[15%] top-[280px] w-56 md:w-64 z-10">
                  <ClassBox
                    machineType="crane"
                    isSelected={selectedMachine === "crane"}
                    onClick={() => setSelectedMachine("crane")}
                    visibleProperties={visibleProperties.crane}
                    visibleMethods={visibleMethods.crane}
                    allVisibleProperties={visibleProperties}
                    allVisibleMethods={visibleMethods}
                    isPowered={powerStates.crane}
                  />
                </div>

                {/* Conveyor Class - Bottom Right */}
                <div className="absolute right-[8%] md:right-[15%] top-[280px] w-56 md:w-64 z-10">
                  <ClassBox
                    machineType="conveyor"
                    isSelected={selectedMachine === "conveyor"}
                    onClick={() => setSelectedMachine("conveyor")}
                    visibleProperties={visibleProperties.conveyor}
                    visibleMethods={visibleMethods.conveyor}
                    allVisibleProperties={visibleProperties}
                    allVisibleMethods={visibleMethods}
                    isPowered={powerStates.conveyor}
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#F7931E]" />
                  <span>Base Class Property</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span>Inherited Property</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Overridden Method</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Unique Method</span>
                </div>
              </div>
            </div>

            {/* Machine Demo Section */}
            <div className="bg-[#E8E8E8] border-2 border-black p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-black">🔄 Encapsulation Demo</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newPower = !demoPowered;
                      setDemoPowered(newPower);
                      setPowerStates(prev => ({
                        ...prev,
                        crane: newPower,
                        conveyor: newPower
                      }));
                    }}
                    className={`px-4 py-2 text-sm font-bold border-2 border-black transition-colors ${
                      demoPowered
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {demoPowered ? "Turn OFF" : "Turn ON"}
                  </button>
                  <button
                    onClick={() => {
                      if (!demoPowered) return;
                      setIsRunning(true);
                      setTimeout(() => setIsRunning(false), 2000);
                    }}
                    disabled={!demoPowered}
                    className={`px-4 py-2 text-sm font-bold border-2 border-black transition-colors ${
                      demoPowered
                        ? "bg-[#F7931E] text-black hover:bg-[#E08000]"
                        : "bg-gray-400 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Run Job
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Crane Demo */}
                <div className="bg-white border-2 border-black p-3">
                  <div className="text-xs font-bold text-gray-600 mb-2 uppercase">Crane Instance</div>
                  <LoopingCrane 
                    isPowered={demoPowered} 
                    serialNumber="CR-2026-0001"
                    className="h-48"
                  />
                </div>

                {/* Conveyor Demo */}
                <div className="bg-white border-2 border-black p-3">
                  <div className="text-xs font-bold text-gray-600 mb-2 uppercase">Conveyor Instance</div>
                  <LoopingConveyor
                    isPowered={demoPowered}
                    serialNumber="CV-2026-0001"
                    itemCount={3}
                    className="h-48"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mt-3">
                Both machines are independent instances with their own internal state (encapsulation). 
                Toggle power and Run Job to control both simultaneously through their public interfaces.
              </p>
            </div>
          </div>

          {/* Right Column - Toggle Panel */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-black p-4">
              <h3 className="font-bold text-black mb-2">Class Designer</h3>
              <p className="text-sm text-gray-600 mb-4">
                Toggle properties and methods independently for each class. Hiding in base Machine hides everywhere, but each derived class can override visibility independently.
              </p>

              {/* Machine Class Toggle Section */}
              <div className="border-2 border-black overflow-hidden mb-3">
                <div 
                  className="px-3 py-2 flex items-center gap-2"
                  style={{ backgroundColor: MACHINE_CLASSES.base.color }}
                >
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <span className="font-bold text-black">Machine (Base)</span>
                </div>
                <div className="p-2 bg-gray-50">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Properties</div>
                  <div className="space-y-1 mb-2">
                    {MACHINE_CLASSES.base.properties.map((prop) => (
                      <ToggleItem
                        key={prop.name}
                        name={prop.name}
                        description={prop.description}
                        isVisible={visibleProperties.base.has(prop.name)}
                        onToggle={() => toggleProperty("base", prop.name)}
                        color={MACHINE_CLASSES.base.color}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Methods</div>
                  <div className="space-y-1">
                    {MACHINE_CLASSES.base.methods.map((method) => (
                      <ToggleItem
                        key={method.name}
                        name={method.name}
                        description={method.description}
                        isVisible={visibleMethods.base.has(method.name)}
                        onToggle={() => toggleMethod("base", method.name)}
                        color={MACHINE_CLASSES.base.color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Crane Class Toggle Section */}
              <div className="border-2 border-[#3B82F6] overflow-hidden mb-3">
                <div className="px-3 py-2 flex items-center gap-2 bg-[#3B82F6]">
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <span className="font-bold text-white">Crane (extends Machine)</span>
                </div>
                <div className="p-2 bg-blue-50">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Properties</div>
                  <div className="space-y-1 mb-2">
                    {MACHINE_CLASSES.crane.properties.map((prop) => (
                      <ToggleItem
                        key={prop.name}
                        name={prop.name}
                        description={prop.description}
                        isVisible={visibleProperties.crane.has(prop.name)}
                        onToggle={() => toggleProperty("crane", prop.name)}
                        color="#3B82F6"
                        inherited={prop.inherited}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Methods</div>
                  <div className="space-y-1">
                    {MACHINE_CLASSES.crane.methods.map((method) => (
                      <ToggleItem
                        key={method.name}
                        name={method.name}
                        description={method.description}
                        isVisible={visibleMethods.crane.has(method.name)}
                        onToggle={() => toggleMethod("crane", method.name)}
                        color="#3B82F6"
                        inherited={method.inherited}
                        implemented={method.implemented}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Conveyor Class Toggle Section */}
              <div className="border-2 border-[#22C55E] overflow-hidden mb-3">
                <div className="px-3 py-2 flex items-center gap-2 bg-[#22C55E]">
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <span className="font-bold text-white">Conveyor (extends Machine)</span>
                </div>
                <div className="p-2 bg-green-50">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Properties</div>
                  <div className="space-y-1 mb-2">
                    {MACHINE_CLASSES.conveyor.properties.map((prop) => (
                      <ToggleItem
                        key={prop.name}
                        name={prop.name}
                        description={prop.description}
                        isVisible={visibleProperties.conveyor.has(prop.name)}
                        onToggle={() => toggleProperty("conveyor", prop.name)}
                        color="#22C55E"
                        inherited={prop.inherited}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Methods</div>
                  <div className="space-y-1">
                    {MACHINE_CLASSES.conveyor.methods.map((method) => (
                      <ToggleItem
                        key={method.name}
                        name={method.name}
                        description={method.description}
                        isVisible={visibleMethods.conveyor.has(method.name)}
                        onToggle={() => toggleMethod("conveyor", method.name)}
                        color="#22C55E"
                        inherited={method.inherited}
                        implemented={method.implemented}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Print Blueprint Button */}
              <motion.button
                onClick={() => setShowBlueprint(true)}
                className="w-full mt-4 px-6 py-4 border-2 border-black font-bold text-lg bg-[#F7931E] text-black hover:bg-[#E08000] transition-colors flex items-center justify-center gap-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>🖨️</span>
                Print Blueprint
              </motion.button>
            </div>

            {/* Legend */}
            <div className="bg-[#F8F8F8] border-2 border-black p-4">
              <h4 className="font-bold text-black mb-3">How It Works</h4>
              <ul className="text-sm space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#F7931E] font-bold">●</span>
                  <span><strong>Base Class:</strong> Toggling here affects all classes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">●</span>
                  <span><strong>Derived Classes:</strong> Toggle independently to show overriding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-200 text-[10px] px-1 rounded">inherited</span>
                  <span>Property/method from base class</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-100 text-green-700 text-[10px] px-1 rounded">override</span>
                  <span>Custom implementation in derived class</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Blueprint Dialog */}
      <AnimatePresence>
        {showBlueprint && (
          <BlueprintDialog
            isOpen={showBlueprint}
            onClose={() => setShowBlueprint(false)}
            visibleProperties={visibleProperties}
            visibleMethods={visibleMethods}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] border-t-2 border-black px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-black text-sm">Machine Hierarchy - Limbus Tech Emulator</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-5 bg-[#E0E0E0] border-2 border-black flex items-center justify-center">
              <span className="text-black text-xs">◀</span>
            </div>
            <div className="w-24 md:w-32 h-5 bg-[#C0C0C0] border-2 border-black"></div>
            <div className="w-6 h-5 bg-[#E0E0E0] border-2 border-black flex items-center justify-center">
              <span className="text-black text-xs">▶</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
