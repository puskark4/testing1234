'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  MapPin, 
  Calendar,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react'

interface CaptureFormData {
  title: string
  description: string
  location: string
  date: string
  time: string
  temperature: string
  humidity: string
  windSpeed: string
  waterLevel: string
  waterQuality: string
  observations: string
  photos: File[]
}

export function CaptureForm({ onBack }: { onBack: () => void }) {
  const { user } = useSupabase()
  const [formData, setFormData] = useState<CaptureFormData>({
    title: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
    temperature: '',
    humidity: '',
    windSpeed: '',
    waterLevel: '',
    waterQuality: '',
    observations: '',
    photos: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: keyof CaptureFormData, value: string | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Upload photos to Supabase Storage
      const photoUrls: string[] = []
      
      for (const photo of formData.photos) {
        const fileName = `${Date.now()}-${photo.name}`
        const { data, error } = await supabase.storage
          .from('capture-photos')
          .upload(fileName, photo)
        
        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
          .from('capture-photos')
          .getPublicUrl(fileName)
        
        photoUrls.push(publicUrl)
      }

      // Save capture data to database
      const { error } = await supabase
        .from('captures')
        .insert({
          user_id: user?.id,
          title: formData.title,
          description: formData.description,
          data: {
            location: formData.location,
            date: formData.date,
            time: formData.time,
            temperature: formData.temperature,
            humidity: formData.humidity,
            windSpeed: formData.windSpeed,
            waterLevel: formData.waterLevel,
            waterQuality: formData.waterQuality,
            observations: formData.observations,
            photoUrls
          },
          status: 'draft'
        })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        onBack()
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>
                Data capture saved successfully! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Data Capture</h1>
          <p className="text-gray-600">Record your field observations and measurements</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General details about this capture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Capture Title *
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Water Quality Survey - Site A"
                  required
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter location coordinates or address"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this capture"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-2">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium mb-2">
                  Time *
                </label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environmental Measurements */}
        <Card>
          <CardHeader>
            <CardTitle>Environmental Measurements</CardTitle>
            <CardDescription>Record weather and environmental conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium mb-2">
                  Temperature (°C)
                </label>
                <div className="relative">
                  <Thermometer className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                    placeholder="25.5"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="humidity" className="block text-sm font-medium mb-2">
                  Humidity (%)
                </label>
                <div className="relative">
                  <Droplets className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="humidity"
                    type="number"
                    step="0.1"
                    value={formData.humidity}
                    onChange={(e) => handleInputChange('humidity', e.target.value)}
                    placeholder="65.0"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="windSpeed" className="block text-sm font-medium mb-2">
                  Wind Speed (km/h)
                </label>
                <div className="relative">
                  <Wind className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="windSpeed"
                    type="number"
                    step="0.1"
                    value={formData.windSpeed}
                    onChange={(e) => handleInputChange('windSpeed', e.target.value)}
                    placeholder="12.0"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Water Measurements */}
        <Card>
          <CardHeader>
            <CardTitle>Water Measurements</CardTitle>
            <CardDescription>Record water-related measurements and observations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="waterLevel" className="block text-sm font-medium mb-2">
                  Water Level (m)
                </label>
                <Input
                  id="waterLevel"
                  type="number"
                  step="0.01"
                  value={formData.waterLevel}
                  onChange={(e) => handleInputChange('waterLevel', e.target.value)}
                  placeholder="1.25"
                />
              </div>
              <div>
                <label htmlFor="waterQuality" className="block text-sm font-medium mb-2">
                  Water Quality
                </label>
                <Select value={formData.waterQuality} onValueChange={(value) => handleInputChange('waterQuality', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select water quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="very-poor">Very Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label htmlFor="observations" className="block text-sm font-medium mb-2">
                Observations
              </label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Additional observations, notes, or comments..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Photos & Documentation</CardTitle>
            <CardDescription>Upload photos related to this capture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <span className="text-primary hover:text-primary/80 font-medium">
                      Click to upload photos
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
              
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newPhotos = formData.photos.filter((_, i) => i !== index)
                          handleInputChange('photos', newPhotos)
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Capture
          </Button>
        </div>
      </form>
    </div>
  )
}