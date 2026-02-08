import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TonCoin3DProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
  glow?: boolean;
}

const sizeMap = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-10 h-10",
  xl: "w-14 h-14",
};

export function TonCoin3D({ size = "md", className = "", animate = false, glow = true }: TonCoin3DProps) {
  const sizeClass = sizeMap[size];
  
  const CoinContent = (
    <div className={cn(sizeClass, className, "relative")}>
      {glow && (
        <div className="absolute inset-0 bg-cyan-400/40 rounded-full blur-md animate-pulse" />
      )}
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10 drop-shadow-lg">
        <defs>
          <linearGradient id="ton3dGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="30%" stopColor="#0098EA" />
            <stop offset="70%" stopColor="#0077B6" />
            <stop offset="100%" stopColor="#005A8D" />
          </linearGradient>
          <linearGradient id="ton3dShine" x1="0%" y1="0%" x2="50%" y2="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="50%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ton3dEdge" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#0098EA" />
            <stop offset="100%" stopColor="#004D73" />
          </linearGradient>
          <filter id="ton3dShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#0098EA" floodOpacity="0.5"/>
          </filter>
          <filter id="ton3dGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <ellipse cx="50" cy="90" rx="30" ry="6" fill="rgba(0,152,234,0.2)" />
        
        <circle cx="50" cy="50" r="45" fill="url(#ton3dGradient)" filter="url(#ton3dShadow)" />
        
        <circle cx="50" cy="50" r="40" fill="url(#ton3dGradient)" stroke="url(#ton3dEdge)" strokeWidth="2" />
        
        <ellipse cx="35" cy="35" rx="25" ry="20" fill="url(#ton3dShine)" />
        
        <g transform="translate(50, 50) scale(0.7) translate(-50, -50)">
          <polygon 
            points="50,15 25,50 40,50 40,85 60,85 60,50 75,50" 
            fill="white" 
            opacity="0.95"
          />
        </g>
        
        <circle cx="30" cy="30" r="4" fill="white" opacity="0.6" />
        <circle cx="38" cy="25" r="2" fill="white" opacity="0.4" />
      </svg>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        animate={{ 
          scale: [1, 1.08, 1],
          rotateY: [0, 15, -15, 0],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ perspective: "100px" }}
      >
        {CoinContent}
      </motion.div>
    );
  }

  return CoinContent;
}
