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

interface RevenueBarChartProps {
  data: { date: string; revenue: number; tickets: number }[]
  title?: string
}

export default function RevenueBarChart({ data, title = 'Revenue Overview' }: RevenueBarChartProps) {
  const darkMode = useStore((s) => s.darkMode)

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Revenue (Rs.)',
        data: data.map(d => d.revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
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
          callback: function(value) {
            return 'Rs. ' + value.toLocaleString()
          },
        },
      },
    },
  }

  return (
    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
