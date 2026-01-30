import { cn } from "@/lib/utils";

interface RouteIconProps {
  routeId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Official MTA Colors
const ROUTE_COLORS: Record<string, string> = {
  // 1-2-3 (Red)
  "1": "#EE352E",
  "2": "#EE352E",
  "3": "#EE352E",
  // 4-5-6 (Green)
  "4": "#00933C",
  "5": "#00933C",
  "6": "#00933C",
  // 7 (Purple)
  "7": "#B933AD",
  "7X": "#B933AD",
  // A-C-E (Blue)
  "A": "#0039A6",
  "C": "#0039A6",
  "E": "#0039A6",
  // B-D-F-M (Orange)
  "B": "#FF6319",
  "D": "#FF6319",
  "F": "#FF6319",
  "M": "#FF6319",
  // G (Lime)
  "G": "#6CBE45",
  // J-Z (Brown)
  "J": "#996633",
  "Z": "#996633",
  // L (Grey)
  "L": "#A7A9AC",
  // N-Q-R-W (Yellow) - Note: text needs to be black
  "N": "#FCCC0A",
  "Q": "#FCCC0A",
  "R": "#FCCC0A",
  "W": "#FCCC0A",
  // S (Grey)
  "S": "#808183",
  "FS": "#808183", // Franklin
  "H": "#808183",  // Rockaway
  // SIR (Blue)
  "SI": "#0039A6",
};

export function RouteIcon({ routeId, className, size = "md" }: RouteIconProps) {
  const normalizedRoute = routeId.toUpperCase();
  const bg = ROUTE_COLORS[normalizedRoute] || "#808183";
  const isYellow = ["N", "Q", "R", "W"].includes(normalizedRoute);
  
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-lg",
    lg: "w-16 h-16 text-2xl",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: bg,
        color: isYellow ? "#000000" : "#FFFFFF",
      }}
    >
      {normalizedRoute.slice(0, 2)}
    </div>
  );
}
