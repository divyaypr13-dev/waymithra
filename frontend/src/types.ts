export type Language = 'en' | 'kn' | 'hi';
export type AppMode = 'user' | 'admin' | 'conductor';
export type CrowdLevel = 'Low' | 'Moderate' | 'High';
export type VehicleStatus = 'ON_TIME' | 'DELAYED' | 'NEAR_STOP' | 'AT_STOP';

export interface Stop {
  id: string;
  name: string;
  short_name: string;
  lat: number;
  lng: number;
  landmark?: string;
  facilities: string[];
}

export interface Route {
  id: string;
  route_number: string;
  name: string;
  color: string;
  stops: string[];
  leg_distances_km: number[];
  leg_standard_minutes: number[];
}

export interface VehicleLiveState {
  id: string;
  vehicle_number: string;
  display_name: string;
  route_id: string;
  is_demo_bus: boolean;
  demo_name?: string;
  capacity: number;
  lat: number;
  lng: number;
  heading: number;
  current_stop_id: string;
  next_stop_id?: string;
  progress_between_stops: number;
  status: VehicleStatus;
  speed_kmh: number;
  eta_next_stop_minutes: number;
  crowd_count: number;
  crowd_level: CrowdLevel;
  capacity_exceeded: boolean;
  crowd_source: string;
  last_crowd_update_iso?: string;
  wheelchair_accessible: boolean;
  low_floor: boolean;
  ramp_available: boolean;
  audio_announcement: boolean;
  camera_feed_enabled: boolean;
}

export interface StopForecast {
  stop_id: string;
  stop_name: string;
  estimated_arrival_minutes: number;
  predicted_crowd_count: number;
  predicted_crowd_level: CrowdLevel;
  predicted_boardings: number;
  predicted_alightings: number;
}

export interface JourneyLeg {
  vehicle_id: string;
  vehicle_name: string;
  route_id: string;
  route_number: string;
  from_stop_id: string;
  from_stop_name: string;
  to_stop_id: string;
  to_stop_name: string;
  departure_in_minutes: number;
  arrival_in_minutes: number;
  transit_duration_minutes: number;
  walk_to_stop_minutes: number;
  current_crowd_level: CrowdLevel;
  current_crowd_count: number;
  capacity: number;
  crowd_source: string;
  stop_forecasts?: StopForecast[];
}

export interface JourneyCard {
  id: string;
  type: 'Fastest' | 'Less Crowded' | 'Alternative';
  total_travel_time_minutes: number;
  departure_in_minutes: number;
  arrival_in_minutes: number;
  legs: JourneyLeg[];
  transfer_count: number;
  overall_crowd_level: CrowdLevel;
  crowd_differential_note?: string;
  summary_text: string;
}

export interface JourneyPlanResponse {
  origin_stop_id: string;
  destination_stop_id: string;
  plans: JourneyCard[];
  timestamp: string;
}

export interface Ticket {
  ticket_id: string;
  idempotency_key: string;
  vehicle_id: string;
  from_stop_id: string;
  to_stop_id: string;
  passenger_count: number;
  fare_paid_inr: number;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  created_at_iso: string;
}

export interface HelpRequest {
  receipt_token: string;
  stop_id: string;
  stop_name: string;
  vehicle_id?: string;
  assistance_type: string;
  notes?: string;
  status: 'REQUESTED' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED';
  created_at_iso: string;
  updated_at_iso?: string;
}

export interface OperatorOverview {
  total_buses: number;
  active_buses: number;
  delayed_buses: number;
  total_passengers_onboard: number;
  active_alerts_count: number;
  active_help_requests: number;
  system_status: string;
  current_scenario: string;
  simulation_speed: number;
  simulation_paused: boolean;
  server_time_iso: string;
}

export interface CameraStatus {
  mode: string;
  raw_count: number;
  smoothed_count: number;
  crowd_level: CrowdLevel;
  capacity_exceeded: boolean;
  source: string;
  is_stale: boolean;
  privacy_filter?: string;
  faces_revealed?: boolean;
  timestamp_iso: string;
}
