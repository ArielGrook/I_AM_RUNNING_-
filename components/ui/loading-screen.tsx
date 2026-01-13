'use client';

import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#262626]"
    >
      <div className="text-center">
        {/* Logo/Brand */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="text-6xl font-black text-[#F97316] mb-4">
            I AM RUNNING
          </div>
          <div className="text-lg text-[#F97316] font-medium">
            AI Website Builder
          </div>
        </motion.div>

        {/* Loading Spinner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin mx-auto mb-6"></div>

          {/* Animated dots */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-[#F97316] rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 text-gray-600 dark:text-gray-400 text-sm font-medium"
        >
          Preparing your experience...
        </motion.p>
      </div>
    </motion.div>
  );
}
