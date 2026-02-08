import { motion } from "framer-motion";

interface TonCoinProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export function TonCoin({ size = "md", className = "", animate = false }: TonCoinProps) {
  const sizeClass = sizeMap[size];
  
  const CoinContent = (
    <div className={`${sizeClass} ${className} relative`}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="tonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0098EA" />
            <stop offset="50%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#00B4D8" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#tonGradient)" filter="url(#glow)" />
        <circle cx="24" cy="24" r="19" fill="url(#tonGradient)" opacity="0.9" />
        <path
          d="M24 8L12 20H18V32H30V20H36L24 8Z"
          fill="white"
          opacity="0.95"
        />
        <circle cx="24" cy="36" r="3" fill="white" opacity="0.9" />
      </svg>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
    </div>
  );

  if (animate) {
    return (
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {CoinContent}
      </motion.div>
    );
  }

  return CoinContent;
}

export function FallingTonCoin({ delay = 0, left = "50%" }: { delay?: number; left?: string }) {
  return (
    <motion.div
      className="absolute z-50 pointer-events-none"
      style={{ left }}
      initial={{ y: -50, opacity: 1, rotate: 0 }}
      animate={{ 
        y: "100vh",
        opacity: 0,
        rotate: 720,
      }}
      transition={{
        duration: 2,
        delay,
        ease: "easeIn",
      }}
    >
      <TonCoin size="lg" />
    </motion.div>
  );
}
