import tonCoinImage from "@/assets/ton-coin.png";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TonCoinImageProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-10 h-10",
  xl: "w-14 h-14",
};

export function TonCoinImage({ size = "md", className = "", animate = false }: TonCoinImageProps) {
  const sizeClass = sizeMap[size];
  
  const CoinContent = (
    <div className={cn(sizeClass, className, "relative rounded-full overflow-hidden")}>
      <img 
        src={tonCoinImage} 
        alt="TON" 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-full" />
    </div>
  );

  if (animate) {
    return (
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
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
