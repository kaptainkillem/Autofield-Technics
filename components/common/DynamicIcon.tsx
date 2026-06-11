import { 
  Wrench, Cpu, Droplet, Disc, Battery, Cog, Zap, Gauge, 
  Flame, Car, Truck, Fuel, Thermometer, Activity, AlertTriangle, 
  Circle, CheckCircle, Shield, Hammer, Key, Lock, Fan, Wind, 
  Sun, Snowflake, Navigation, MapPin, Phone, Mail, User, 
  Clock, Calendar, Star, Heart, Check, X, ArrowRight, ArrowLeft,
  ChevronRight, ChevronDown, ChevronUp, Plus, Minus, Search,
  Menu, Home, Settings, Bell, FileText, Image, Video, Music,
  type LucideIcon 
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Wrench, Cpu, Droplet, Disc, Battery, Cog, Zap, Gauge,
  Flame, Car, Truck, Fuel, Thermometer, Activity, AlertTriangle,
  Circle, CheckCircle, Shield, Hammer, Key, Lock, Fan, Wind,
  Sun, Snowflake, Navigation, MapPin, Phone, Mail, User,
  Clock, Calendar, Star, Heart, Check, X, ArrowRight, ArrowLeft,
  ChevronRight, ChevronDown, ChevronUp, Plus, Minus, Search,
  Menu, Home, Settings, Bell, FileText, Image, Video, Music,
}

interface DynamicIconProps {
  name: string
  size?: number
  className?: string
}

export function DynamicIcon({ name, size = 24, className = '' }: DynamicIconProps) {
  const IconComponent = iconMap[name]

  if (!IconComponent) {
    return <Wrench size={size} className={className} />
  }

  return <IconComponent size={size} className={className} />
}