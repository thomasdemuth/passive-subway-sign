import { cn } from "@/lib/utils";

interface RouteIconProps {
  routeId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ROUTE_COLORS: Record<string, string> = {
  "1": "#EE352E",
  "2": "#EE352E",
  "3": "#EE352E",
  "4": "#00933C",
  "5": "#00933C",
  "6": "#00933C",
  "7": "#B933AD",
  "A": "#0039A6",
  "C": "#0039A6",
  "E": "#0039A6",
  "B": "#FF6319",
  "D": "#FF6319",
  "F": "#FF6319",
  "M": "#FF6319",
  "G": "#6CBE45",
  "J": "#996633",
  "Z": "#996633",
  "L": "#A7A9AC",
  "N": "#FCCC0A",
  "Q": "#FCCC0A",
  "R": "#FCCC0A",
  "W": "#FCCC0A",
  "S": "#808183",
  "FS": "#808183",
  "H": "#808183",
  "SI": "#006BB6",
  "SIR": "#006BB6",
};

export function RouteIcon({ routeId, className, size = "md" }: RouteIconProps) {
  let normalizedRoute = routeId.toUpperCase();
  // Normalize MTA internal route IDs to display names
  if (normalizedRoute === "GS") normalizedRoute = "S"; // 42nd St Shuttle
  if (normalizedRoute === "SI") normalizedRoute = "SIR"; // Staten Island Railway
  const isExpress = normalizedRoute.endsWith("X");
  const baseRoute = isExpress ? normalizedRoute.slice(0, -1) : normalizedRoute;
  
  // Use red for express Staten Island Railway trains
  const isSIExpress = isExpress && (baseRoute === "SI" || baseRoute === "SIR");
  const bg = isSIExpress ? "#EE352E" : (ROUTE_COLORS[baseRoute] || ROUTE_COLORS[normalizedRoute] || "#808183");
  const isYellow = ["N", "Q", "R", "W"].includes(baseRoute);
  
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-lg",
    lg: "w-16 h-16 text-2xl",
  };

  if (isExpress) {
    return (
      <div
        className={cn(
          "flex items-center justify-center font-bold shadow-sm",
          sizeClasses[size],
          className
        )}
        style={{
          color: isYellow ? "#000000" : "#FFFFFF",
        }}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            backgroundColor: bg,
            transform: "rotate(45deg)",
            borderRadius: "3px",
          }}
        >
          <span style={{ transform: "rotate(-45deg)" }}>
            {baseRoute}
          </span>
        </div>
      </div>
    );
  }

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
      {baseRoute.slice(0, 2)}
    </div>
  );
}
