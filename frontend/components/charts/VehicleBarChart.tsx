'use client'

import { useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useStore } from '../../store/useStore'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface VehicleBarChartProps {
  data: { vehicleType: string; count: number; percentage: number }[]
  title?: string
}

export default function VehicleBarChart({ data, title = 'Vehicle Distribution' }: VehicleBarChartProps) {
  const darkMode = useStore((s) => s.darkMode)

  const vehicleColors: Record<string, string> = {
    CAR: 'rgba(99, 102, 241, 0.8)',
    BIKE: 'rgba(16, 185, 129, 0.8)',
    TRUCK: 'rgba(245, 158, 11, 0.8)',
    SUV: 'rgba(139, 92, 246, 0.8)',
    BUS: 'rgba(236, 72, 153, 0.8)',
  }

  const vehicleBorderColors: Record<string, string> = {
    CAR: 'rgba(99, 102, 241, 1)',
    BIKE: 'rgba(16, 185, 129, 1)',
    TRUCK: 'rgba(245, 158, 11, 1)',
    SUV: 'rgba(139, 92, 246, 1)',
    BUS: 'rgba(236, 72, 153, 1)',
  }

  const chartData = {
    labels: data.map(d => d.vehicleType),
    datasets: [
      {
        label: 'Count',
        data: data.map(d => d.count),
        backgroundColor: data.map(d => vehicleColors[d.vehicleType] || 'rgba(99, 102, 241, 0.8)'),
        borderColor: data.map(d => vehicleBorderColors[d.vehicleType] || 'rgba(99, 102, 241, 1)'),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        color: darkMode ? '#fff' : '#333',
        font: {
          size: 16,
          weight: 600,
        },
      },
      tooltip: {
        backgroundColor: darkMode ? '#1a1a1a' : '#fff',
        titleColor: darkMode ? '#fff' : '#333',
        bodyColor: darkMode ? '#fff' : '#333',
        borderColor: darkMode ? '#333' : '#ddd',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const value = context.raw as number
            const percentage = data[context.dataIndex]?.percentage || 0
            return `${value} vehicles (${percentage}%)`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? '#888' : '#666',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? '#333' : '#e5e5e5',
        },
        ticks: {
          color: darkMode ? '#888' : '#666',
          font: {
            size: 12,
          },
          stepSize: 1,
        },
      },
    },
  }

  useEffect(() => {
    // Force re-render when dark mode changes
  }, [darkMode])

  return (
    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
