'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Thermometer, 
  Droplets, 
  Wind,
  MapPin,
  Calendar
} from 'lucide-react'

interface AnalyticsData {
  totalCaptures: number
  capturesByStatus: { [key: string]: number }
  averageTemperature: number
  averageHumidity: number
  averageWindSpeed: number
  averageWaterLevel: number
  waterQualityDistribution: { [key: string]: number }
  capturesByMonth: { [key: string]: number }
  topLocations: { location: string; count: number }[]
}

export function Analytics() {
  const { user } = useSupabase()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const { data: captures, error } = await supabase
        .from('captures')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const filteredCaptures = captures.filter(capture => {
        const captureDate = new Date(capture.created_at)
        const daysAgo = (Date.now() - captureDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysAgo <= parseInt(timeRange)
      })

      const analytics: AnalyticsData = {
        totalCaptures: filteredCaptures.length,
        capturesByStatus: {},
        averageTemperature: 0,
        averageHumidity: 0,
        averageWindSpeed: 0,
        averageWaterLevel: 0,
        waterQualityDistribution: {},
        capturesByMonth: {},
        topLocations: []
      }

      // Calculate status distribution
      filteredCaptures.forEach(capture => {
        analytics.capturesByStatus[capture.status] = (analytics.capturesByStatus[capture.status] || 0) + 1
      })

      // Calculate averages
      const validTemps = filteredCaptures.filter(c => c.data.temperature && !isNaN(Number(c.data.temperature)))
      const validHumidity = filteredCaptures.filter(c => c.data.humidity && !isNaN(Number(c.data.humidity)))
      const validWindSpeed = filteredCaptures.filter(c => c.data.windSpeed && !isNaN(Number(c.data.windSpeed)))
      const validWaterLevel = filteredCaptures.filter(c => c.data.waterLevel && !isNaN(Number(c.data.waterLevel)))

      analytics.averageTemperature = validTemps.length > 0 
        ? validTemps.reduce((sum, c) => sum + Number(c.data.temperature), 0) / validTemps.length 
        : 0
      analytics.averageHumidity = validHumidity.length > 0 
        ? validHumidity.reduce((sum, c) => sum + Number(c.data.humidity), 0) / validHumidity.length 
        : 0
      analytics.averageWindSpeed = validWindSpeed.length > 0 
        ? validWindSpeed.reduce((sum, c) => sum + Number(c.data.windSpeed), 0) / validWindSpeed.length 
        : 0
      analytics.averageWaterLevel = validWaterLevel.length > 0 
        ? validWaterLevel.reduce((sum, c) => sum + Number(c.data.waterLevel), 0) / validWaterLevel.length 
        : 0

      // Calculate water quality distribution
      filteredCaptures.forEach(capture => {
        if (capture.data.waterQuality) {
          analytics.waterQualityDistribution[capture.data.waterQuality] = 
            (analytics.waterQualityDistribution[capture.data.waterQuality] || 0) + 1
        }
      })

      // Calculate captures by month
      filteredCaptures.forEach(capture => {
        const month = new Date(capture.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        analytics.capturesByMonth[month] = (analytics.capturesByMonth[month] || 0) + 1
      })

      // Calculate top locations
      const locationCounts: { [key: string]: number } = {}
      filteredCaptures.forEach(capture => {
        if (capture.data.location) {
          locationCounts[capture.data.location] = (locationCounts[capture.data.location] || 0) + 1
        }
      })
      analytics.topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setAnalyticsData(analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center text-gray-500">
        No analytics data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Insights from your captured data</p>
        </div>
        <div className="w-48">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Captures</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalCaptures}</div>
            <p className="text-xs text-muted-foreground">
              In the last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageTemperature.toFixed(1)}°C</div>
            <p className="text-xs text-muted-foreground">
              Across all captures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Humidity</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageHumidity.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all captures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wind Speed</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageWindSpeed.toFixed(1)} km/h</div>
            <p className="text-xs text-muted-foreground">
              Across all captures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Capture Status Distribution</CardTitle>
            <CardDescription>Breakdown of captures by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analyticsData.capturesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'approved' ? 'bg-green-500' :
                      status === 'rejected' ? 'bg-red-500' :
                      status === 'submitted' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="capitalize">{status}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Water Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Water Quality Distribution</CardTitle>
            <CardDescription>Breakdown of water quality assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analyticsData.waterQualityDistribution).map(([quality, count]) => (
                <div key={quality} className="flex items-center justify-between">
                  <span className="capitalize">{quality}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Most frequently captured locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topLocations.map((location, index) => (
                <div key={location.location} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="truncate max-w-32">{location.location}</span>
                  </div>
                  <span className="font-medium">{location.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Captures over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analyticsData.capturesByMonth)
                .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                .map(([month, count]) => (
                  <div key={month} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{month}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Metrics</CardTitle>
          <CardDescription>Other important measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {analyticsData.averageWaterLevel.toFixed(2)}m
              </div>
              <p className="text-sm text-gray-600">Average Water Level</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {analyticsData.topLocations.length > 0 ? analyticsData.topLocations[0].location : 'N/A'}
              </div>
              <p className="text-sm text-gray-600">Most Active Location</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {Math.max(...Object.values(analyticsData.capturesByMonth))}
              </div>
              <p className="text-sm text-gray-600">Peak Monthly Captures</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}