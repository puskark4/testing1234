'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Calendar,
  MapPin,
  Thermometer,
  Droplets
} from 'lucide-react'

interface CaptureRecord {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  created_at: string
  data: {
    location: string
    date: string
    time: string
    temperature: string
    humidity: string
    windSpeed: string
    waterLevel: string
    waterQuality: string
    observations: string
    photoUrls: string[]
  }
}

export function DataList() {
  const { user } = useSupabase()
  const [captures, setCaptures] = useState<CaptureRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCapture, setSelectedCapture] = useState<CaptureRecord | null>(null)

  useEffect(() => {
    fetchCaptures()
  }, [])

  const fetchCaptures = async () => {
    try {
      const { data, error } = await supabase
        .from('captures')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCaptures(data || [])
    } catch (error) {
      console.error('Error fetching captures:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCaptures = captures.filter(capture => {
    const matchesSearch = capture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         capture.data.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || capture.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'submitted': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this capture?')) {
      try {
        const { error } = await supabase
          .from('captures')
          .delete()
          .eq('id', id)

        if (error) throw error
        fetchCaptures()
      } catch (error) {
        console.error('Error deleting capture:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Records</h1>
          <p className="text-gray-600">View and manage your captured data</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search captures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data List */}
      <div className="grid gap-4">
        {filteredCaptures.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No captures found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCaptures.map((capture) => (
            <Card key={capture.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{capture.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(capture.status)}`}>
                        {capture.status}
                      </span>
                    </div>
                    
                    {capture.description && (
                      <p className="text-gray-600 mb-3">{capture.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{capture.data.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(capture.data.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-gray-400" />
                        <span>{capture.data.temperature}°C</span>
                      </div>
                    </div>

                    {capture.data.observations && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                        {capture.data.observations}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCapture(capture)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(capture.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedCapture.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedCapture(null)}
                >
                  ×
                </Button>
              </div>
              <CardDescription>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCapture.status)}`}>
                  {selectedCapture.status}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCapture.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{selectedCapture.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <p className="text-gray-600">{selectedCapture.data.location}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Date & Time</h4>
                  <p className="text-gray-600">
                    {new Date(selectedCapture.data.date).toLocaleDateString()} at {selectedCapture.data.time}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Temperature</h4>
                  <p className="text-gray-600">{selectedCapture.data.temperature}°C</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Humidity</h4>
                  <p className="text-gray-600">{selectedCapture.data.humidity}%</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Wind Speed</h4>
                  <p className="text-gray-600">{selectedCapture.data.windSpeed} km/h</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Water Level</h4>
                  <p className="text-gray-600">{selectedCapture.data.waterLevel} m</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Water Quality</h4>
                  <p className="text-gray-600 capitalize">{selectedCapture.data.waterQuality}</p>
                </div>
              </div>

              {selectedCapture.data.observations && (
                <div>
                  <h4 className="font-medium mb-2">Observations</h4>
                  <p className="text-gray-600">{selectedCapture.data.observations}</p>
                </div>
              )}

              {selectedCapture.data.photoUrls && selectedCapture.data.photoUrls.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedCapture.data.photoUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedCapture(null)}>
                  Close
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}