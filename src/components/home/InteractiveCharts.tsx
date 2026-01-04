"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface ScoreDistributionProps {
  scores: number[];
}

export function ScoreDistribution({ scores }: ScoreDistributionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  // Calculate distribution
  const ranges = [
    { label: "90-100", min: 90, max: 100, color: "bg-green-500" },
    { label: "80-89", min: 80, max: 89, color: "bg-blue-500" },
    { label: "70-79", min: 70, max: 79, color: "bg-yellow-500" },
    { label: "60-69", min: 60, max: 69, color: "bg-orange-500" },
    { label: "0-59", min: 0, max: 59, color: "bg-red-500" },
  ];

  const distribution = ranges.map((range) => ({
    ...range,
    count: scores.filter((s) => s >= range.min && s <= range.max).length,
  }));

  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <Card ref={ref} className="border-2 hover:border-primary/30 transition-all duration-500">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold">Score-Verteilung</h3>
        </div>

        <div className="space-y-4">
          {distribution.map((item, index) => {
            const percentage = (item.count / scores.length) * 100;
            const width = isVisible ? (item.count / maxCount) * 100 : 0;

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {item.count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-1000 ease-out rounded-full`}
                    style={{
                      width: `${width}%`,
                      transitionDelay: `${index * 0.1}s`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface PieChartProps {
  data: ChartData[];
}

export function CategoryPieChart({ data }: PieChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // Start at top

  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      angle,
      startAngle,
    };
  });

  return (
    <Card ref={ref} className="border-2 hover:border-primary/30 transition-all duration-500">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <PieChart className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold">Kategorie-Verteilung</h3>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* SVG Pie Chart */}
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {segments.map((segment, index) => {
                const largeArc = segment.angle > 180 ? 1 : 0;
                const x1 = 100 + 100 * Math.cos((segment.startAngle * Math.PI) / 180);
                const y1 = 100 + 100 * Math.sin((segment.startAngle * Math.PI) / 180);
                const x2 =
                  100 +
                  100 * Math.cos(((segment.startAngle + segment.angle) * Math.PI) / 180);
                const y2 =
                  100 +
                  100 * Math.sin(((segment.startAngle + segment.angle) * Math.PI) / 180);

                return (
                  <path
                    key={index}
                    d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={segment.color}
                    className="transition-opacity duration-1000"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transitionDelay: `${index * 0.1}s`,
                    }}
                  />
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-3 flex-1">
            {segments.map((segment, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{segment.label}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {segment.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TrendLineProps {
  data: { month: string; value: number }[];
}

export function TrendLine({ data }: TrendLineProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return { x, y, value: item.value, month: item.month };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <Card ref={ref} className="border-2 hover:border-primary/30 transition-all duration-500">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold">Trend-Entwicklung</h3>
        </div>

        <div className="relative h-64">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted opacity-20"
              />
            ))}

            {/* Trend Line */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
              style={{
                strokeDasharray: isVisible ? "none" : "1000",
                strokeDashoffset: isVisible ? 0 : 1000,
                transition: "stroke-dashoffset 2s ease-out",
              }}
            />

            {/* Area Fill */}
            <path
              d={`${pathData} L 100 100 L 0 100 Z`}
              fill="currentColor"
              className="text-primary opacity-10"
              style={{
                opacity: isVisible ? 0.1 : 0,
                transition: "opacity 1s ease-out",
              }}
            />

            {/* Data Points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="2"
                  fill="currentColor"
                  className="text-primary"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transition: `opacity 0.3s ease-out ${index * 0.1}s`,
                  }}
                />
                <text
                  x={point.x}
                  y={point.y - 5}
                  textAnchor="middle"
                  fontSize="3"
                  className="text-foreground fill-current"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transition: `opacity 0.3s ease-out ${index * 0.1}s`,
                  }}
                >
                  {point.value}
                </text>
              </g>
            ))}
          </svg>

          {/* X-Axis Labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
            {data.map((item, index) => (
              <span key={index}>{item.month}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
