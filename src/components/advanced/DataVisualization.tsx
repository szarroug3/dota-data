import React, { useMemo } from 'react';

// Types for chart data
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  data: ChartDataPoint[];
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface BarChartData {
  data: ChartDataPoint[];
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface PieChartData {
  data: ChartDataPoint[];
  title: string;
}

export interface DataVisualizationProps {
  type: 'line' | 'bar' | 'pie';
  data: LineChartData | BarChartData | PieChartData;
  height?: number;
  width?: number;
  className?: string;
}

// Simple SVG-based line chart
const LineChart: React.FC<{ data: LineChartData; height: number; width: number }> = ({ data, height, width }) => {
  const { points } = useMemo(() => {
    const values = data.data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    
    const points = data.data.map((point, index) => {
      const x = (index / (data.data.length - 1)) * (width - 40) + 20;
      const y = height - 40 - ((point.value - minValue) / range) * (height - 80);
      return { x, y, label: point.label, value: point.value };
    });
    
    return { points };
  }, [data, height, width]);

  return (
    <svg width={width} height={height} className="w-full h-full">
      <text x="10" y="20" className="text-sm font-medium fill-current">
        {data.title}
      </text>
      
      {/* Y-axis */}
      <line x1="20" y1="40" x2="20" y2={height - 20} stroke="currentColor" strokeWidth="1" />
      
      {/* X-axis */}
      <line x1="20" y1={height - 20} x2={width - 20} y2={height - 20} stroke="currentColor" strokeWidth="1" />
      
      {/* Data line */}
      <polyline
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="rgb(59, 130, 246)"
        strokeWidth="2"
      />
      
      {/* Data points */}
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="rgb(59, 130, 246)"
          className="hover:r-6 transition-all"
        />
      ))}
      
      {/* X-axis labels */}
      {points.map((point, index) => (
        <text
          key={index}
          x={point.x}
          y={height - 5}
          textAnchor="middle"
          className="text-xs fill-current"
        >
          {point.label}
        </text>
      ))}
    </svg>
  );
};

// Simple SVG-based bar chart
const BarChart: React.FC<{ data: BarChartData; height: number; width: number }> = ({ data, height, width }) => {
  const { bars } = useMemo(() => {
    const values = data.data.map(d => d.value);
    const maxValue = Math.max(...values) || 1;
    const barWidth = (width - 40) / data.data.length;
    
    const bars = data.data.map((point, index) => {
      const x = 20 + index * barWidth + barWidth * 0.1;
      const barHeight = ((point.value / maxValue) * (height - 80));
      const y = height - 20 - barHeight;
      return { x, y, width: barWidth * 0.8, height: barHeight, label: point.label, value: point.value };
    });
    
    return { bars };
  }, [data, height, width]);

  return (
    <svg width={width} height={height} className="w-full h-full">
      <text x="10" y="20" className="text-sm font-medium fill-current">
        {data.title}
      </text>
      
      {/* Y-axis */}
      <line x1="20" y1="40" x2="20" y2={height - 20} stroke="currentColor" strokeWidth="1" />
      
      {/* X-axis */}
      <line x1="20" y1={height - 20} x2={width - 20} y2={height - 20} stroke="currentColor" strokeWidth="1" />
      
      {/* Bars */}
      {bars.map((bar, index) => (
        <g key={index}>
          <rect
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill="rgb(59, 130, 246)"
            className="hover:fill-blue-600 transition-colors"
          />
          <text
            x={bar.x + bar.width / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-xs fill-current"
          >
            {bar.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

// Simple SVG-based pie chart
const PieChart: React.FC<{ data: PieChartData; height: number; width: number }> = ({ data, height, width }) => {
  const { segments } = useMemo(() => {
    const total = data.data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = 0;
    
    const segments = data.data.map((point, index) => {
      const angle = (point.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;
      
      const startX = centerX + radius * Math.cos(startAngle);
      const startY = centerY + radius * Math.sin(startAngle);
      const endX = centerX + radius * Math.cos(currentAngle);
      const endY = centerY + radius * Math.sin(currentAngle);
      
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      return {
        path: `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`,
        label: point.label,
        value: point.value,
        percentage: ((point.value / total) * 100).toFixed(1),
        color: point.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`
      };
    });
    
    return { segments };
  }, [data, height, width]);

  return (
    <svg width={width} height={height} className="w-full h-full">
      <text x="10" y="20" className="text-sm font-medium fill-current">
        {data.title}
      </text>
      
      {/* Pie segments */}
      {segments.map((segment, index) => (
        <g key={index}>
          <path
            d={segment.path}
            fill={segment.color}
            className="hover:opacity-80 transition-opacity"
          />
          <text
            x={width / 2}
            y={height / 2 + 5}
            textAnchor="middle"
            className="text-xs fill-current font-medium"
          >
            {segment.label} ({segment.percentage}%)
          </text>
        </g>
      ))}
    </svg>
  );
};

export const DataVisualization: React.FC<DataVisualizationProps> = ({
  type,
  data,
  height = 300,
  width = 400,
  className = ''
}) => {
  const chartComponent = useMemo(() => {
    switch (type) {
      case 'line':
        return <LineChart data={data as LineChartData} height={height} width={width} />;
      case 'bar':
        return <BarChart data={data as BarChartData} height={height} width={width} />;
      case 'pie':
        return <PieChart data={data as PieChartData} height={height} width={width} />;
      default:
        return null;
    }
  }, [type, data, height, width]);

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}
      role="img"
      aria-label={`${type} chart showing ${data.title}`}
    >
      {chartComponent}
    </div>
  );
}; 