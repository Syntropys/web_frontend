import { memo } from "react";
import { motion } from "framer-motion";
import { Reveal } from "@/app/components/reveal";

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-12">
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8C6E26] dark:text-[#C9A24B]">
        {index}
      </span>
      <span className="h-px w-10 bg-[#C9A24B]/40" />
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
        {label}
      </span>
    </div>
  );
}

const points = [38, 42, 41, 47, 52, 49, 58, 64, 71];

const PredictiveChart = memo(function PredictiveChart() {
  const max = 80;
  const w = 260;
  const h = 120;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className="absolute inset-0 flex flex-col justify-center p-3">
      <svg
        viewBox={`0 0 ${w} ${h + 10}`}
        className="w-full h-auto text-[#2A3530] dark:text-[#E8E6DF]"
      >
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A24B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C9A24B" stopOpacity="0" />
          </linearGradient>
          <clipPath id="chart-clip">
            <motion.rect
              x="0"
              y="0"
              width={w}
              height={h + 20}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
              style={{ originX: 0 }}
            />
          </clipPath>
        </defs>
        {[0.25, 0.5, 0.75].map((y) => (
          <line
            key={y}
            x1="0"
            x2={w}
            y1={h * y}
            y2={h * y}
            stroke="currentColor"
            strokeOpacity="0.12"
          />
        ))}

        {/* Animated clipping group for line and area */}
        <g clipPath="url(#chart-clip)">
          <path d={area} fill="url(#grad1)" />
          <path d={path} stroke="#C9A24B" strokeWidth="1.5" fill="none" />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={i * step}
              cy={h - (p / max) * h}
              r={i === points.length - 1 ? 3.5 : 1.5}
              fill="#C9A24B"
            />
          ))}
          <line
            x1={(points.length - 2) * step}
            x2={w}
            y1={h - (points[points.length - 2] / max) * h}
            y2={h - (points[points.length - 1] / max) * h}
            stroke="#C9A24B"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        </g>

        {/* Final Target Glowing Dot (always visible and pulsing) */}
        <motion.circle
          cx={w}
          cy={h - (points[points.length - 1] / max) * h}
          r="6"
          fill="#C9A24B"
          initial={{ opacity: 0.2, scale: 0.8 }}
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.4, 0.8] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ transformOrigin: `${w}px ${h - (points[points.length - 1] / max) * h}px` }}
        />
        <circle
          cx={w}
          cy={h - (points[points.length - 1] / max) * h}
          r="3.5"
          fill="#C9A24B"
        />
      </svg>
    </div>
  );
});

const dots = [
  { x: 30, y: 40, p: "high" },
  { x: 60, y: 30, p: "high" },
  { x: 90, y: 55, p: "med" },
  { x: 130, y: 35, p: "low" },
  { x: 160, y: 70, p: "med" },
  { x: 200, y: 50, p: "high" },
  { x: 230, y: 80, p: "low" },
  { x: 75, y: 80, p: "med" },
  { x: 180, y: 95, p: "high" },
  { x: 120, y: 90, p: "low" },
  { x: 50, y: 105, p: "med" },
];

const MapSnippet = memo(function MapSnippet() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Legend Overlay */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 text-[8px] font-mono text-right pointer-events-none z-10 select-none">
        <div className="flex items-center gap-1.5 justify-end">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24B] animate-pulse" />
          <span className="text-[#8C6E26] dark:text-[#C9A24B] font-semibold">Live Monitor</span>
        </div>
        <div className="text-[#5F6A64] dark:text-[#A8AFA9]">5 Wilayah Analisis</div>
      </div>

      <svg
        viewBox="0 0 260 180"
        className="h-full w-auto mx-auto text-[#2A3530] dark:text-[#E8E6DF]"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeOpacity="0.3"
      >
        {/* KALIMANTAN BARAT — only the large mainland polygon */}
        <motion.path
          d="M 136.9 60.8 L 135.7 59.7 L 132.6 60.0 L 129.6 61.6 L 129.9 62.2 L 129.4 62.8 L 126.2 64.3 L 126.0 63.7 L 124.4 62.4 L 122.3 63.1 L 120.4 61.4 L 118.8 61.1 L 117.7 61.4 L 116.1 60.1 L 114.6 60.9 L 113.9 60.8 L 114.0 60.0 L 115.1 59.5 L 114.9 59.2 L 115.6 58.3 L 114.9 57.8 L 114.1 57.6 L 114.0 57.9 L 113.0 57.8 L 112.1 57.4 L 111.3 58.4 L 110.1 57.9 L 108.2 58.0 L 107.9 57.7 L 104.9 57.5 L 103.7 58.6 L 101.7 58.9 L 100.9 59.6 L 99.5 60.0 L 99.5 60.8 L 99.9 61.3 L 98.7 63.2 L 98.6 64.5 L 98.1 65.1 L 98.2 65.9 L 95.5 65.8 L 94.3 66.2 L 94.1 66.7 L 93.4 67.0 L 93.1 68.2 L 92.1 68.7 L 91.1 68.1 L 90.2 68.3 L 89.3 67.6 L 87.9 68.3 L 87.7 68.8 L 87.1 68.7 L 87.1 69.3 L 86.7 69.3 L 85.9 67.8 L 84.5 68.3 L 81.5 67.3 L 81.1 66.8 L 79.4 67.5 L 75.0 67.9 L 74.6 68.9 L 73.1 69.6 L 73.2 70.3 L 72.5 69.7 L 72.2 70.3 L 71.4 70.2 L 70.9 71.0 L 70.0 70.5 L 69.6 71.0 L 68.4 71.1 L 66.3 70.2 L 66.3 69.6 L 65.6 69.3 L 65.4 68.5 L 64.8 68.7 L 65.4 68.5 L 64.8 68.7 L 64.4 68.3 L 63.2 68.5 L 63.4 67.7 L 62.9 67.4 L 62.6 66.4 L 61.9 66.2 L 61.6 65.0 L 59.8 64.7 L 59.6 64.4 L 59.2 64.5 L 59.2 63.5 L 57.6 62.8 L 57.3 60.9 L 56.7 60.5 L 54.9 60.5 L 55.0 59.5 L 54.3 59.6 L 54.2 59.0 L 51.7 56.9 L 52.1 53.8 L 50.9 53.4 L 50.2 53.6 L 49.3 51.3 L 49.9 50.7 L 49.7 50.2 L 50.9 50.0 L 51.2 49.2 L 51.0 48.5 L 50.4 49.8 L 45.6 50.8 L 45.3 51.2 L 45.7 52.1 L 45.5 52.9 L 44.7 53.8 L 44.9 54.0 L 44.0 56.1 L 40.4 58.6 L 39.9 59.9 L 39.9 62.3 L 38.6 64.4 L 38.7 65.1 L 37.4 65.4 L 38.6 67.6 L 38.8 68.8 L 38.3 70.3 L 36.2 71.9 L 36.9 72.7 L 36.9 73.9 L 37.9 75.5 L 37.5 77.7 L 38.2 79.3 L 38.2 80.0 L 37.6 80.8 L 40.9 82.5 L 41.4 83.2 L 41.9 85.0 L 43.9 86.7 L 42.4 86.6 L 42.2 88.1 L 42.8 88.9 L 42.6 90.9 L 43.0 91.4 L 41.8 91.7 L 40.9 92.4 L 41.4 93.7 L 42.0 93.9 L 41.1 93.8 L 41.1 94.0 L 41.7 97.5 L 42.0 97.9 L 43.0 97.6 L 44.0 98.6 L 46.2 98.2 L 47.1 99.1 L 48.1 98.8 L 50.2 99.5 L 50.4 100.2 L 51.6 99.8 L 52.3 100.7 L 51.8 101.2 L 51.1 101.3 L 51.2 102.1 L 52.0 102.8 L 52.6 102.8 L 52.7 103.4 L 53.3 103.6 L 53.1 103.8 L 53.5 104.2 L 52.9 104.5 L 53.0 105.8 L 53.6 106.0 L 53.6 106.6 L 54.2 106.9 L 54.6 107.6 L 56.9 108.3 L 56.2 109.8 L 57.3 111.2 L 58.3 111.4 L 59.2 112.6 L 59.4 113.6 L 58.7 115.8 L 58.6 118.4 L 57.7 119.9 L 56.4 120.5 L 56.3 121.1 L 56.6 121.4 L 56.2 121.6 L 59.4 123.6 L 60.2 125.4 L 60.2 127.1 L 59.7 128.1 L 59.6 129.3 L 60.5 130.3 L 60.8 132.8 L 61.4 133.3 L 61.7 134.6 L 61.0 136.6 L 62.1 137.0 L 62.4 137.8 L 62.2 138.6 L 62.9 139.4 L 62.7 140.8 L 62.2 141.4 L 62.9 142.8 L 63.7 143.4 L 66.0 141.5 L 68.6 140.5 L 69.7 141.4 L 69.9 143.4 L 69.5 143.3 L 70.2 144.3 L 71.6 143.5 L 72.2 142.4 L 73.0 141.8 L 76.1 140.8 L 76.9 139.8 L 79.5 138.7 L 80.0 137.6 L 79.0 137.0 L 79.3 136.2 L 78.7 132.9 L 78.1 130.4 L 77.4 129.3 L 78.2 127.8 L 77.8 126.1 L 78.4 125.1 L 77.9 125.0 L 77.1 123.9 L 76.4 123.7 L 76.7 123.0 L 76.3 121.8 L 77.0 120.6 L 76.8 119.1 L 76.3 118.5 L 75.7 119.3 L 74.9 119.4 L 74.6 118.7 L 74.0 118.6 L 74.1 117.8 L 74.9 117.1 L 75.9 116.9 L 76.4 116.1 L 77.1 116.5 L 77.9 116.0 L 78.2 116.5 L 79.0 116.4 L 79.2 114.9 L 79.7 114.1 L 81.6 113.8 L 82.9 112.8 L 83.0 112.3 L 84.1 112.1 L 84.1 111.1 L 85.1 110.2 L 87.1 109.9 L 87.4 109.4 L 87.4 108.0 L 88.4 107.3 L 88.4 106.0 L 88.8 105.4 L 89.9 105.1 L 90.8 104.3 L 92.2 104.3 L 93.4 103.0 L 93.9 103.0 L 94.1 102.1 L 95.8 102.1 L 97.1 100.4 L 98.8 100.8 L 98.9 99.3 L 99.5 98.8 L 100.7 99.4 L 101.3 100.7 L 102.8 100.6 L 103.6 99.8 L 104.9 100.3 L 106.2 100.3 L 107.5 99.9 L 107.7 99.6 L 108.4 99.6 L 108.9 99.0 L 109.3 99.1 L 109.5 98.0 L 111.2 98.0 L 112.8 97.0 L 114.6 96.5 L 114.8 96.1 L 115.5 96.8 L 116.4 96.5 L 116.4 96.1 L 117.1 95.6 L 118.2 96.7 L 118.5 96.6 L 119.2 95.5 L 119.2 94.6 L 118.2 93.7 L 119.8 91.8 L 120.9 91.4 L 122.1 90.2 L 122.2 89.9 L 121.8 89.6 L 122.2 89.4 L 122.5 88.6 L 122.2 88.2 L 122.5 87.0 L 122.0 86.4 L 122.1 84.8 L 120.4 83.8 L 119.4 82.7 L 120.4 82.1 L 122.5 82.2 L 122.9 82.0 L 125.3 79.6 L 126.6 79.0 L 127.3 77.5 L 128.8 76.6 L 130.1 74.7 L 130.1 74.0 L 131.1 73.4 L 130.7 72.6 L 131.7 71.5 L 130.6 70.5 L 131.4 69.1 L 131.5 68.4 L 131.0 67.6 L 132.1 67.3 L 132.4 66.4 L 132.8 66.1 L 133.7 66.4 L 134.1 66.1 L 134.8 66.5 L 137.2 65.4 L 136.6 63.4 L 137.0 62.2 L 136.2 61.3 L 136.9 60.8 Z"
          fill="#7E8E78"
          fillOpacity="0.45"
          fillRule="nonzero"
          animate={{
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
            delay: 0
          }}
          whileHover={{
            scale: 1.04,
            fill: "#C9A24B",
            fillOpacity: 0.9,
            stroke: "#C9A24B",
            strokeOpacity: 0.8
          }}
          style={{ transformOrigin: "center", cursor: "pointer" }}
        />
        {/* KALIMANTAN TENGAH — only the large mainland polygon */}
        <motion.path
          d="M 166.0 111.9 L 166.3 110.3 L 167.7 108.9 L 166.7 108.2 L 166.1 108.5 L 165.7 107.7 L 164.8 107.0 L 164.6 107.2 L 164.1 107.0 L 164.0 105.8 L 162.7 105.0 L 161.2 103.2 L 159.2 102.7 L 158.7 101.3 L 158.4 98.1 L 156.6 95.7 L 156.0 93.0 L 156.6 92.9 L 156.3 91.6 L 156.9 90.8 L 156.7 90.2 L 157.6 89.4 L 157.6 88.3 L 156.7 88.1 L 155.2 88.8 L 154.6 89.8 L 153.3 90.1 L 152.7 90.8 L 150.5 90.8 L 149.8 86.5 L 148.0 85.6 L 148.1 84.0 L 148.7 83.0 L 149.3 82.8 L 149.9 81.4 L 150.6 81.0 L 151.0 81.2 L 152.3 81.0 L 152.7 81.6 L 154.2 80.2 L 154.3 79.1 L 152.0 75.8 L 151.6 73.8 L 151.0 72.9 L 150.3 72.6 L 149.2 73.4 L 148.7 73.1 L 146.5 74.1 L 145.6 74.0 L 144.7 75.2 L 143.3 75.4 L 142.9 76.7 L 141.7 76.7 L 140.7 77.9 L 139.1 77.1 L 137.7 77.4 L 136.9 77.1 L 136.7 76.2 L 136.0 76.0 L 136.4 75.7 L 136.4 75.2 L 135.4 74.2 L 134.8 74.1 L 133.3 75.0 L 132.6 74.7 L 131.0 75.2 L 130.8 74.8 L 130.1 74.7 L 128.8 76.6 L 126.8 78.0 L 126.6 79.0 L 125.3 79.6 L 122.9 82.0 L 122.5 82.2 L 120.4 82.1 L 119.4 82.7 L 120.4 83.8 L 122.1 84.8 L 122.0 86.4 L 122.5 87.0 L 122.2 88.2 L 122.5 88.6 L 122.2 89.4 L 121.8 89.6 L 122.2 89.9 L 122.1 90.2 L 120.9 91.4 L 119.8 91.8 L 118.2 93.7 L 119.2 94.6 L 119.2 95.5 L 118.5 96.6 L 118.2 96.7 L 117.1 95.6 L 116.4 96.1 L 116.4 96.5 L 115.5 96.8 L 114.8 96.1 L 114.6 96.5 L 112.8 97.0 L 111.2 98.0 L 109.5 98.0 L 109.3 99.1 L 108.9 99.0 L 108.4 99.6 L 107.7 99.6 L 107.5 99.9 L 106.2 100.3 L 104.9 100.3 L 103.6 99.8 L 102.8 100.6 L 101.3 100.7 L 100.7 99.4 L 99.5 98.8 L 98.9 99.3 L 98.8 100.8 L 97.1 100.4 L 95.8 102.1 L 94.1 102.1 L 93.9 103.0 L 93.4 103.0 L 92.2 104.3 L 90.8 104.3 L 89.9 105.1 L 88.8 105.4 L 88.4 106.0 L 88.4 107.3 L 87.4 108.0 L 87.4 109.4 L 87.1 109.9 L 85.1 110.2 L 84.1 111.1 L 84.1 112.1 L 83.0 112.3 L 82.9 112.8 L 81.6 113.8 L 79.7 114.1 L 79.2 114.9 L 79.0 116.4 L 78.2 116.5 L 77.9 116.0 L 77.1 116.5 L 76.4 116.1 L 75.9 116.9 L 74.9 117.1 L 74.1 117.8 L 74.0 118.6 L 74.6 118.7 L 74.9 119.4 L 75.7 119.3 L 76.3 118.5 L 76.8 119.1 L 77.0 120.6 L 76.3 121.8 L 76.7 123.0 L 76.4 123.7 L 77.1 123.9 L 77.9 125.0 L 78.4 125.1 L 77.8 126.1 L 78.2 127.8 L 77.4 129.3 L 78.1 130.4 L 78.7 132.9 L 79.3 136.2 L 79.0 137.0 L 80.0 137.6 L 79.5 138.7 L 76.9 139.8 L 76.1 140.8 L 73.0 141.8 L 72.2 142.4 L 71.8 143.3 L 73.0 143.1 L 76.4 144.7 L 78.8 144.1 L 83.0 141.9 L 84.1 142.0 L 84.5 141.7 L 86.0 142.5 L 87.2 143.7 L 89.7 142.4 L 89.9 142.1 L 89.3 141.5 L 90.2 140.6 L 92.0 143.5 L 92.2 144.5 L 91.7 147.3 L 92.1 151.1 L 91.2 153.1 L 92.5 153.6 L 94.1 153.4 L 97.1 151.1 L 100.3 149.4 L 101.8 149.4 L 103.1 150.0 L 103.9 150.8 L 106.1 151.9 L 112.6 148.1 L 114.5 146.5 L 113.2 145.7 L 114.5 144.1 L 114.9 143.1 L 116.1 144.3 L 117.4 144.8 L 120.6 148.7 L 120.4 147.5 L 120.5 148.1 L 121.1 148.6 L 122.3 148.0 L 122.7 147.1 L 124.4 146.6 L 125.5 146.6 L 126.2 149.1 L 125.2 151.9 L 126.1 152.2 L 129.3 152.1 L 132.3 150.4 L 133.9 150.0 L 134.0 149.3 L 135.6 150.7 L 136.5 150.9 L 137.8 150.4 L 137.8 151.1 L 139.6 152.2 L 139.8 149.6 L 141.5 147.5 L 141.0 146.9 L 143.3 144.8 L 142.6 143.5 L 143.3 142.6 L 143.2 142.1 L 143.7 141.0 L 144.3 141.5 L 144.6 141.3 L 144.3 140.1 L 145.6 139.7 L 145.8 138.6 L 147.4 138.3 L 147.8 137.6 L 148.1 135.7 L 150.2 133.4 L 156.5 129.3 L 156.4 128.8 L 157.3 129.0 L 158.0 127.8 L 157.5 127.3 L 157.9 126.1 L 158.3 126.3 L 159.5 125.8 L 159.4 124.6 L 159.9 123.4 L 158.5 121.9 L 159.3 119.9 L 159.0 119.5 L 160.3 116.5 L 161.6 114.1 L 162.7 113.1 L 166.0 111.9 Z"
          fill="#C9A24B"
          fillOpacity="0.5"
          fillRule="nonzero"
          animate={{
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
            delay: 0.5
          }}
          whileHover={{
            scale: 1.04,
            fill: "#C9A24B",
            fillOpacity: 0.9,
            stroke: "#C9A24B",
            strokeOpacity: 0.8
          }}
          style={{ transformOrigin: "center", cursor: "pointer" }}
        />
        {/* KALIMANTAN SELATAN — only the large mainland polygon */}
        <motion.path
          d="M 181.1 132.4 L 175.7 131.1 L 174.8 130.5 L 173.6 130.5 L 168.5 131.0 L 168.4 131.8 L 167.9 132.0 L 167.4 130.9 L 167.8 130.4 L 166.8 128.2 L 167.1 126.5 L 167.5 125.9 L 166.9 125.5 L 166.0 125.7 L 165.4 125.2 L 165.8 124.7 L 164.9 124.3 L 165.4 123.3 L 165.5 121.1 L 164.6 120.8 L 165.1 119.6 L 164.3 119.3 L 164.3 117.8 L 163.7 116.8 L 164.0 115.6 L 163.4 115.1 L 164.7 114.3 L 166.0 111.9 L 162.7 113.1 L 161.6 114.1 L 159.0 119.5 L 159.3 119.9 L 158.5 121.9 L 159.9 123.4 L 159.4 124.6 L 159.5 125.8 L 158.3 126.3 L 157.9 126.1 L 157.5 127.3 L 158.0 127.8 L 157.3 129.0 L 156.4 128.8 L 156.5 129.3 L 150.2 133.4 L 148.1 135.7 L 147.8 137.6 L 147.4 138.3 L 145.8 138.6 L 145.6 139.7 L 144.3 140.1 L 144.6 141.3 L 144.3 141.5 L 143.7 141.0 L 143.2 142.1 L 143.3 142.6 L 142.6 143.5 L 143.3 144.8 L 141.0 146.9 L 141.5 147.5 L 139.8 149.6 L 139.6 152.2 L 142.5 153.2 L 142.7 153.7 L 143.8 154.2 L 144.6 155.7 L 144.7 156.9 L 144.4 158.6 L 145.0 162.8 L 144.7 165.3 L 146.2 165.5 L 152.0 162.5 L 165.3 157.2 L 167.3 155.5 L 170.0 154.9 L 170.5 154.1 L 171.2 150.4 L 172.2 148.8 L 173.9 148.2 L 174.0 147.8 L 173.7 146.6 L 172.6 146.3 L 172.1 146.7 L 171.9 146.4 L 173.1 146.1 L 174.0 146.5 L 174.5 145.9 L 175.7 145.9 L 173.8 144.7 L 173.5 143.8 L 172.5 143.7 L 172.2 143.3 L 172.9 142.7 L 172.5 142.5 L 173.1 141.4 L 172.8 140.3 L 173.3 140.5 L 173.5 141.6 L 174.4 142.3 L 174.7 143.6 L 175.5 143.6 L 177.4 141.2 L 177.5 137.1 L 178.3 135.8 L 177.2 135.1 L 175.5 137.1 L 175.2 136.7 L 175.7 136.7 L 176.0 136.3 L 176.3 134.8 L 177.2 134.5 L 178.1 134.7 L 178.6 134.1 L 179.1 134.2 L 179.5 134.4 L 179.6 135.5 L 180.1 135.3 L 181.1 132.4 Z"
          className="fill-[#5A6A60] dark:fill-[#8FA095]"
          fillOpacity="0.45"
          fillRule="nonzero"
          animate={{
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
            delay: 1.0
          }}
          whileHover={{
            scale: 1.04,
            fill: "#C9A24B",
            fillOpacity: 0.9,
            stroke: "#C9A24B",
            strokeOpacity: 0.8
          }}
          style={{ transformOrigin: "center", cursor: "pointer" }}
        />
        {/* KALIMANTAN TIMUR — only the large mainland polygon */}
        <motion.path
          d="M 207.9 41.5 L 206.6 42.3 L 205.4 42.3 L 204.5 43.6 L 203.3 43.4 L 200.8 39.9 L 200.1 40.2 L 198.7 39.9 L 196.9 38.2 L 195.3 37.9 L 193.4 38.5 L 190.7 38.3 L 184.7 40.8 L 183.9 41.5 L 181.5 41.7 L 181.2 41.2 L 178.8 40.1 L 178.6 41.5 L 176.4 44.7 L 176.6 45.0 L 176.5 47.5 L 174.7 48.0 L 174.9 49.5 L 174.2 50.0 L 174.0 52.6 L 173.0 56.0 L 172.0 56.2 L 171.3 57.1 L 171.4 57.9 L 170.8 58.6 L 170.1 58.5 L 169.7 59.3 L 167.8 60.3 L 167.9 60.9 L 167.3 61.6 L 167.1 61.3 L 166.3 61.8 L 166.1 63.6 L 163.7 63.1 L 161.1 63.7 L 159.8 64.4 L 159.5 64.9 L 159.7 65.8 L 158.7 67.2 L 156.6 67.6 L 155.3 67.2 L 155.1 66.3 L 152.1 66.2 L 151.3 64.8 L 150.6 65.1 L 149.6 64.5 L 149.0 65.3 L 146.7 63.5 L 146.5 62.2 L 145.0 61.2 L 144.9 60.3 L 144.1 59.8 L 143.7 60.4 L 142.9 60.1 L 140.7 58.6 L 140.2 59.2 L 137.5 60.0 L 137.2 60.6 L 136.2 61.3 L 137.0 62.2 L 136.6 63.4 L 137.2 65.4 L 134.8 66.5 L 134.1 66.1 L 133.7 66.4 L 132.8 66.1 L 132.4 66.4 L 132.1 67.3 L 131.0 67.6 L 131.5 68.4 L 131.4 69.1 L 130.6 70.5 L 131.7 71.5 L 130.7 72.6 L 131.1 73.4 L 130.1 74.0 L 130.1 74.7 L 130.8 74.8 L 131.0 75.2 L 132.6 74.7 L 133.3 75.0 L 134.8 74.1 L 135.4 74.2 L 136.4 75.2 L 136.1 76.3 L 136.7 76.2 L 137.2 77.3 L 139.1 77.1 L 140.7 77.9 L 141.7 76.7 L 142.9 76.7 L 143.3 75.4 L 144.7 75.2 L 145.6 74.0 L 146.5 74.1 L 148.7 73.1 L 149.2 73.4 L 150.3 72.6 L 151.4 73.4 L 152.0 75.8 L 154.3 79.1 L 154.2 80.2 L 152.7 81.6 L 152.3 81.0 L 151.0 81.2 L 150.6 81.0 L 149.9 81.4 L 149.3 82.8 L 148.7 83.0 L 148.1 84.0 L 148.0 85.6 L 149.8 86.5 L 150.5 90.8 L 152.7 90.8 L 153.3 90.1 L 154.6 89.8 L 155.2 88.8 L 156.7 88.1 L 157.6 88.3 L 157.6 89.4 L 156.7 90.2 L 156.9 90.8 L 156.3 91.6 L 156.6 92.9 L 156.0 93.0 L 156.6 95.7 L 158.4 98.1 L 158.9 102.3 L 159.4 102.7 L 161.2 103.2 L 162.7 105.0 L 164.0 105.8 L 164.1 107.0 L 164.6 107.2 L 164.8 107.0 L 165.7 107.7 L 166.1 108.5 L 166.7 108.2 L 167.7 108.9 L 166.3 110.3 L 165.7 112.8 L 164.7 114.3 L 163.4 115.1 L 164.0 115.6 L 163.7 116.8 L 164.3 117.8 L 164.3 119.3 L 165.1 119.6 L 164.6 120.8 L 165.5 121.1 L 165.4 123.3 L 164.9 124.3 L 165.8 124.7 L 165.4 125.2 L 166.0 125.7 L 166.9 125.5 L 167.5 125.9 L 167.1 126.5 L 166.8 128.2 L 167.8 130.4 L 167.4 130.9 L 167.9 132.0 L 168.4 131.8 L 168.5 131.0 L 173.6 130.5 L 174.8 130.5 L 175.7 131.1 L 181.1 132.4 L 181.6 129.6 L 181.6 127.9 L 180.1 129.1 L 181.0 128.0 L 180.1 127.9 L 178.3 128.7 L 180.4 127.7 L 180.2 127.1 L 180.0 126.8 L 178.7 127.3 L 177.4 126.8 L 179.2 125.9 L 179.2 123.2 L 178.9 122.4 L 178.5 122.2 L 179.0 121.4 L 179.0 120.5 L 177.6 120.3 L 175.5 121.2 L 175.3 120.8 L 176.5 119.2 L 180.3 117.8 L 181.1 117.3 L 180.6 115.7 L 180.7 114.7 L 182.3 113.7 L 184.9 112.8 L 185.0 110.4 L 185.2 110.2 L 185.9 110.5 L 185.8 111.3 L 188.1 110.7 L 189.4 109.8 L 189.8 108.6 L 192.7 105.0 L 194.0 104.2 L 194.2 102.3 L 194.6 102.1 L 195.1 100.0 L 194.6 98.1 L 196.3 97.9 L 197.1 97.3 L 197.8 95.9 L 197.3 95.3 L 197.5 94.3 L 198.1 94.3 L 197.2 91.2 L 197.7 91.0 L 198.4 88.5 L 199.1 87.8 L 199.1 86.7 L 198.6 86.7 L 198.7 86.1 L 198.2 86.0 L 198.4 85.3 L 199.1 84.9 L 198.5 84.0 L 199.3 83.1 L 199.2 81.3 L 199.7 81.0 L 199.8 79.4 L 200.3 79.6 L 200.8 79.1 L 200.7 78.1 L 201.3 77.5 L 202.0 75.7 L 202.6 75.5 L 202.7 74.1 L 203.5 73.0 L 206.5 71.5 L 206.7 72.1 L 207.6 72.7 L 208.7 72.6 L 208.5 71.1 L 207.7 69.8 L 207.6 68.8 L 206.1 66.5 L 206.7 66.5 L 207.8 67.3 L 208.3 69.2 L 209.0 69.4 L 209.3 70.3 L 214.1 71.3 L 214.9 72.1 L 216.4 71.4 L 218.4 72.0 L 219.2 72.0 L 219.9 71.3 L 220.8 71.1 L 221.4 71.9 L 223.0 72.2 L 224.4 70.7 L 224.8 70.8 L 225.7 70.0 L 226.6 68.7 L 226.7 68.0 L 225.9 67.4 L 224.5 67.2 L 223.8 67.5 L 223.6 66.5 L 223.1 66.3 L 222.2 64.4 L 219.0 61.8 L 216.9 61.2 L 216.4 61.4 L 216.2 60.5 L 215.3 60.3 L 216.0 60.0 L 215.8 59.3 L 215.2 59.4 L 215.2 59.1 L 210.6 56.6 L 209.3 55.0 L 209.4 54.2 L 209.0 53.8 L 206.4 53.0 L 206.0 52.1 L 205.0 51.4 L 204.5 49.9 L 204.8 49.5 L 203.7 49.4 L 203.2 48.9 L 202.9 49.2 L 202.5 49.0 L 202.5 48.6 L 203.0 48.1 L 202.9 47.1 L 202.2 46.3 L 206.1 46.0 L 206.4 45.8 L 206.9 46.3 L 208.5 46.0 L 209.9 44.5 L 209.7 43.6 L 209.1 42.8 L 208.4 42.8 L 208.4 42.3 L 207.9 41.5 Z"
          fill="#C9A24B"
          fillOpacity="0.45"
          fillRule="nonzero"
          animate={{
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
            delay: 1.5
          }}
          whileHover={{
            scale: 1.04,
            fill: "#C9A24B",
            fillOpacity: 0.9,
            stroke: "#C9A24B",
            strokeOpacity: 0.8
          }}
          style={{ transformOrigin: "center", cursor: "pointer" }}
        />
        {/* KALIMANTAN UTARA — only the large mainland polygon */}
        <motion.path
          d="M 207.9 41.5 L 204.3 37.9 L 204.1 35.6 L 200.9 34.8 L 200.6 34.4 L 201.3 34.4 L 201.8 33.8 L 200.5 33.6 L 200.3 33.1 L 198.0 32.2 L 197.8 31.7 L 196.0 31.7 L 196.6 30.2 L 196.0 30.0 L 195.8 29.5 L 196.2 29.4 L 196.2 28.7 L 196.6 29.1 L 198.0 28.5 L 197.7 27.9 L 195.3 27.6 L 194.9 27.1 L 194.3 27.5 L 193.4 27.5 L 194.6 27.3 L 194.3 26.6 L 193.6 26.2 L 195.2 26.5 L 195.5 27.0 L 196.5 26.6 L 196.8 26.1 L 196.5 25.9 L 196.1 26.2 L 196.0 25.9 L 196.6 24.9 L 197.1 24.6 L 197.1 23.6 L 196.3 23.2 L 196.0 22.5 L 193.5 21.8 L 193.0 20.8 L 193.6 19.6 L 191.9 19.3 L 189.7 19.7 L 190.6 19.1 L 192.2 18.9 L 194.2 19.3 L 196.3 19.0 L 197.4 19.2 L 198.5 18.7 L 198.5 18.3 L 197.4 18.3 L 197.3 17.9 L 198.2 17.6 L 198.6 16.4 L 199.3 16.5 L 200.4 16.0 L 200.6 16.4 L 201.5 16.4 L 202.4 16.1 L 202.4 15.6 L 203.1 15.6 L 203.1 15.2 L 201.9 14.4 L 200.6 14.5 L 199.4 13.6 L 198.7 13.8 L 197.9 13.5 L 197.9 12.4 L 197.1 11.8 L 197.6 11.9 L 198.2 10.8 L 197.2 10.4 L 196.7 9.6 L 197.0 9.4 L 199.2 10.2 L 199.6 9.5 L 200.4 9.1 L 200.3 8.8 L 199.3 9.1 L 198.1 8.9 L 196.4 6.8 L 194.8 6.2 L 194.0 5.1 L 193.1 5.9 L 192.2 5.5 L 191.4 5.9 L 190.2 5.6 L 189.8 6.2 L 189.5 6.1 L 189.6 5.7 L 187.7 5.2 L 186.4 6.0 L 185.9 5.6 L 185.3 5.7 L 184.7 4.8 L 183.8 5.9 L 183.2 5.6 L 182.6 5.8 L 181.2 4.5 L 180.7 5.1 L 180.8 5.9 L 179.7 6.0 L 179.6 6.5 L 178.9 6.7 L 178.8 6.1 L 177.1 4.8 L 175.8 5.4 L 173.7 4.8 L 173.5 5.8 L 172.8 5.9 L 172.0 7.0 L 171.3 6.6 L 171.2 6.0 L 170.7 5.6 L 169.3 5.5 L 168.9 4.8 L 168.3 4.8 L 168.2 6.8 L 167.3 7.2 L 167.2 7.9 L 166.2 7.6 L 165.5 8.6 L 165.0 8.6 L 163.8 12.9 L 162.5 13.7 L 162.7 14.2 L 163.4 14.5 L 162.6 17.4 L 162.7 19.7 L 164.2 22.7 L 163.6 23.3 L 163.3 22.6 L 162.9 22.5 L 162.0 24.2 L 161.5 26.8 L 162.4 28.1 L 161.5 28.9 L 161.5 29.9 L 161.2 30.4 L 160.1 30.5 L 159.4 31.2 L 158.0 31.4 L 157.2 30.0 L 156.5 31.6 L 154.9 32.3 L 154.7 33.4 L 153.8 34.1 L 154.7 34.8 L 154.5 35.7 L 153.6 36.6 L 154.1 37.4 L 153.6 38.3 L 154.0 38.7 L 155.0 38.2 L 156.0 39.5 L 156.6 39.5 L 156.5 40.1 L 155.7 40.9 L 154.4 40.9 L 153.7 42.1 L 152.8 42.1 L 151.7 43.2 L 151.3 42.8 L 150.9 43.6 L 151.2 44.2 L 150.3 44.9 L 149.4 44.7 L 148.7 45.1 L 148.3 44.8 L 147.9 45.9 L 147.0 46.1 L 147.0 47.2 L 147.9 47.0 L 148.5 47.5 L 148.1 48.1 L 148.3 49.2 L 149.2 48.9 L 149.6 49.1 L 149.0 50.2 L 149.0 50.7 L 149.6 51.2 L 148.4 51.8 L 147.9 52.6 L 147.1 52.1 L 146.3 53.1 L 146.6 55.0 L 146.3 56.5 L 144.5 57.7 L 144.3 58.5 L 144.6 58.8 L 144.1 59.8 L 144.9 60.3 L 145.0 61.2 L 145.7 61.8 L 146.2 61.8 L 146.7 63.5 L 149.0 65.3 L 149.9 64.5 L 150.6 65.1 L 151.6 65.0 L 152.1 66.2 L 155.1 66.3 L 155.6 67.3 L 157.2 67.6 L 157.4 67.2 L 158.7 67.2 L 159.7 65.8 L 159.5 64.9 L 160.0 64.2 L 163.0 63.1 L 166.1 63.6 L 166.3 61.8 L 167.1 61.3 L 167.3 61.6 L 167.9 60.9 L 167.8 60.3 L 169.7 59.3 L 170.1 58.5 L 170.8 58.6 L 171.4 57.9 L 171.3 57.1 L 172.0 56.2 L 173.0 56.0 L 174.0 52.6 L 174.2 50.0 L 174.9 49.5 L 174.7 48.0 L 176.5 47.5 L 176.6 45.0 L 176.4 44.7 L 178.6 41.5 L 178.8 40.1 L 181.2 41.2 L 181.5 41.7 L 183.9 41.5 L 184.7 40.8 L 190.7 38.3 L 193.4 38.5 L 195.3 37.9 L 196.9 38.2 L 198.7 39.9 L 200.1 40.2 L 200.8 39.9 L 203.3 43.4 L 204.5 43.6 L 205.4 42.3 L 206.6 42.3 L 207.9 41.5 Z"
          fill="#7E8E78"
          fillOpacity="0.45"
          fillRule="nonzero"
          animate={{
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
            delay: 2.0
          }}
          whileHover={{
            scale: 1.04,
            fill: "#C9A24B",
            fillOpacity: 0.9,
            stroke: "#C9A24B",
            strokeOpacity: 0.8
          }}
          style={{ transformOrigin: "center", cursor: "pointer" }}
        />
      </svg>
    </div>
  );
});

const ScanSnippet = memo(function ScanSnippet() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Deteksi HTML Text Overlay */}
      <motion.div
        className="absolute left-1 sm:left-3 md:left-2 lg:left-4 top-[22%] text-left select-none pointer-events-none z-10"
        animate={{
          opacity: [0.15, 1, 0.15, 0.15, 0.15],
          x: [0, 4, 0, 0, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1]
        }}
      >
        <div className="font-mono text-[7px] tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] uppercase">DETEKSI</div>
        <div className="h-px w-8 bg-[#2A3530]/15 dark:bg-[#E8E6DF]/15 my-0.5" />
        <div className="font-serif text-[10px] sm:text-[12px] font-semibold text-[#8C6E26] dark:text-[#C9A24B] whitespace-nowrap">Blast (P. oryzae)</div>
        <div className="font-mono text-[7px] text-[#5F6A64] dark:text-[#A8AFA9] mt-0.5">CONF · 0.91</div>
      </motion.div>

      {/* Rekomendasi HTML Text Overlay */}
      <motion.div
        className="absolute right-1 sm:right-3 md:right-2 lg:right-4 top-[52%] text-left select-none pointer-events-none z-10"
        animate={{
          opacity: [0.15, 0.15, 1, 0.15, 0.15],
          x: [0, 0, -4, 0, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.45, 0.7, 0.9, 1]
        }}
      >
        <div className="font-mono text-[7px] tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] uppercase">REKOMENDASI</div>
        <div className="h-px w-8 bg-[#2A3530]/15 dark:bg-[#E8E6DF]/15 my-0.5" />
        <div className="font-serif text-[10px] sm:text-[11px] font-medium text-[#2A3530] dark:text-[#E8E6DF] whitespace-nowrap">Fungisida triazol</div>
      </motion.div>

      <svg
        viewBox="0 0 260 130"
        className="h-full w-auto mx-auto text-[#2A3530] dark:text-[#E8E6DF]"
      >
        <rect
          x="95"
          y="10"
          width="70"
          height="115"
          rx="9"
          stroke="currentColor"
          strokeOpacity="0.3"
          fill="currentColor"
          fillOpacity="0.06"
        />
        <rect
          x="100"
          y="18"
          width="60"
          height="92"
          rx="3"
          fill="currentColor"
          fillOpacity="0.08"
        />
        
        {/* Rice Stalk (Curved Golden Stem) */}
        <path
          d="M130 100 C130 75 134 50 144 32"
          stroke="#7E8E78"
          strokeWidth="1.2"
          fill="none"
        />
        {/* Rice Grains (Bulir Padi) in Gold */}
        <ellipse cx="144" cy="32" rx="1.8" ry="3" transform="rotate(25 144 32)" fill="#C9A24B" />
        <ellipse cx="142" cy="40" rx="1.8" ry="3" transform="rotate(15 142 40)" fill="#C9A24B" />
        <ellipse cx="139" cy="48" rx="1.8" ry="3" transform="rotate(5 139 48)" fill="#C9A24B" />
        <ellipse cx="136" cy="56" rx="1.8" ry="3" transform="rotate(-5 136 56)" fill="#C9A24B" />
        <ellipse cx="133" cy="64" rx="1.8" ry="3" transform="rotate(-15 133 64)" fill="#C9A24B" />
        <ellipse cx="131" cy="72" rx="1.8" ry="3" transform="rotate(-25 131 72)" fill="#C9A24B" />
        
        <ellipse cx="148" cy="38" rx="1.8" ry="3" transform="rotate(45 148 38)" fill="#C9A24B" />
        <ellipse cx="144" cy="46" rx="1.8" ry="3" transform="rotate(35 144 46)" fill="#C9A24B" />
        <ellipse cx="140" cy="54" rx="1.8" ry="3" transform="rotate(25 140 54)" fill="#C9A24B" />
        <ellipse cx="137" cy="62" rx="1.8" ry="3" transform="rotate(15 137 62)" fill="#C9A24B" />
        <ellipse cx="134" cy="70" rx="1.8" ry="3" transform="rotate(5 134 70)" fill="#C9A24B" />

        {/* Slender Rice Leaf */}
        <path
          d="M125 100 C118 70 120 45 128 35 C126 50 123 75 125 100 Z"
          fill="#7E8E78"
          fillOpacity="0.8"
        />

        {/* Disease Spots / Focus Points */}
        <circle cx="123" cy="65" r="2.5" fill="#C9A24B" />
        <circle cx="125" cy="78" r="1.8" fill="#C9A24B" />

        {/* Camera Scanning line */}
        <motion.rect
          x="100"
          width="60"
          height="1.5"
          fill="#C9A24B"
          initial={{ y: 18 }}
          animate={{ y: [18, 108, 18] }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
          }}
        />

        <rect x="100" y="18" width="60" height="2" fill="#C9A24B" opacity="0.7" />
        <text
          x="130"
          y="120"
          fontSize="5"
          fill="currentColor"
          fillOpacity="0.55"
          textAnchor="middle"
          fontFamily="monospace"
        >
          CNN · scanning…
        </text>
      </svg>
    </div>
  );
});

const cards = [
  {
    n: "i.",
    tag: "Forecasting",
    title: "Predictive Analytics",
    copy: "Tiga model prediksi (XGBoost, Random Forest, Linear Regression) memproyeksikan produktivitas panen 2026 hingga tingkat kabupaten.",
    visual: <PredictiveChart />,
    meta: "Proyeksi 2026 · ton/ha",
  },
  {
    n: "ii.",
    tag: "Spatial",
    title: "Geospatial Intelligence",
    copy: "Pemetaan klaster prioritas tinggi, sedang, dan rendah berbasis indeks vegetasi & data cuaca real-time.",
    visual: <MapSnippet />,
    meta: "Kalimantan · 56 titik aktif",
  },
  {
    n: "iii.",
    tag: "Vision",
    title: "Deteksi Penyakit Instan",
    copy: "Computer vision berbasis CNN mendiagnosis penyakit daun padi langsung dari kamera ponsel lapangan.",
    visual: <ScanSnippet />,
    meta: "On-device · MobileNetV2 / CNN",
  },
];

export function Pillars() {
  return (
    <section
      id="solusi"
      className="relative px-5 sm:px-8 lg:px-14 py-20 sm:py-28 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12"
    >
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 mb-12 sm:mb-16">
        <div className="lg:col-span-5">
          <SectionLabel index="04" label="Tiga Pilar" />
          <Reveal>
            <h2 className="font-serif text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.05] tracking-[-0.02em] text-[#2A3530] dark:text-[#E8E6DF]">
              Satu platform, tiga{" "}
              <em className="italic text-[#8C6E26] dark:text-[#C9A24B]">
                disiplin
              </em>{" "}
              kecerdasan.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:col-start-8 flex items-end">
          <p className="text-[14px] sm:text-[15px] leading-[1.7] text-[#4A5550] dark:text-[#B8BFB9]">
            Dirancang untuk pengambil keputusan yang membutuhkan keyakinan
            kuantitatif — bukan sekadar dashboard, melainkan instrumen presisi
            bagi dinas pertanian dan agribisnis modern.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12 rounded-2xl overflow-hidden">
        {cards.map((c, idx) => (
          <Reveal key={c.title} delay={idx * 120} className="h-full">
            <article className="group relative h-full bg-[#F7F3EA] dark:bg-[#0F181B] p-6 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8 transition-all hover:bg-[#FAF5E8] dark:hover:bg-[#152226] hover:shadow-lg hover:shadow-[#2A3530]/5 dark:hover:shadow-[#000000]/30 cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="font-serif italic text-[20px] text-[#8C6E26] dark:text-[#C9A24B]">
                  {c.n}
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
                  {c.tag}
                </span>
              </div>

              <div className="rounded-xl bg-[#EFEBE1]/70 dark:bg-[#0B1215]/60 border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 p-3 sm:p-4 backdrop-blur-sm">
                <div className="relative w-full h-40 overflow-hidden">
                  {c.visual}
                </div>
                <div className="mt-2 pt-2 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12 font-mono text-[10px] tracking-wider uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
                  {c.meta}
                </div>
              </div>

              <div className="mt-auto">
                <h3 className="mb-3 font-serif text-[22px] sm:text-[26px] leading-tight tracking-tight text-[#2A3530] dark:text-[#E8E6DF] transition-colors group-hover:text-[#8C6E26] dark:group-hover:text-[#C9A24B]">
                  {c.title}
                </h3>
                <p className="text-[13px] sm:text-[14px] leading-[1.7] text-[#4A5550] dark:text-[#B8BFB9]">
                  {c.copy}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
