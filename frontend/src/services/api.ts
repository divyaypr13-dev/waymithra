import {
  Stop, Route, VehicleLiveState, JourneyPlanResponse,
  Ticket, HelpRequest, OperatorOverview, CameraStatus
} from '../types';

const API_BASE = '/api';

// Fallback data in case backend server is initializing
const FALLBACK_STOPS: Stop[] = [
  { id: 'BLR-STOP-01', name: 'Majestic (Kempegowda Bus Station)', short_name: 'Majestic', lat: 12.9767, lng: 77.5713, landmark: 'City Railway Station', facilities: ['Wheelchair Ramp', 'Tactile Paving'] },
  { id: 'BLR-STOP-02', name: 'MG Road Metro / Trinity', short_name: 'MG Road', lat: 12.9756, lng: 77.6097, landmark: 'Brigade Road', facilities: ['Wheelchair Ramp', 'Elevator'] },
  { id: 'BLR-STOP-03', name: 'Shivajinagar Bus Station', short_name: 'Shivajinagar', lat: 12.9856, lng: 77.6050, landmark: 'Russell Market', facilities: ['Sheltered Seating'] },
  { id: 'BLR-STOP-04', name: 'SJBIT College (Kengeri)', short_name: 'SJBIT College', lat: 12.9015, lng: 77.5028, landmark: 'BGS Health City', facilities: ['Audio Announcement'] },
  { id: 'BLR-STOP-05', name: 'Silk Board Junction', short_name: 'Silk Board', lat: 12.9175, lng: 77.6238, landmark: 'Outer Ring Road', facilities: ['Pedestrian Skywalk'] },
  { id: 'BLR-STOP-06', name: 'Koramangala Sony World Signal', short_name: 'Koramangala', lat: 12.9352, lng: 77.6245, landmark: '80ft Road', facilities: ['Wheelchair Curb'] },
  { id: 'BLR-STOP-07', name: 'Indiranagar 100ft Road', short_name: 'Indiranagar', lat: 12.9719, lng: 77.6412, landmark: '12th Main', facilities: ['Audio Announcement'] },
  { id: 'BLR-STOP-08', name: 'Electronic City Phase 1', short_name: 'Electronic City', lat: 12.8452, lng: 77.6602, landmark: 'Tech Park Gate', facilities: ['Sheltered Terminal'] },
  { id: 'BLR-STOP-09', name: 'Banashankari TTMC', short_name: 'Banashankari', lat: 12.9155, lng: 77.5736, landmark: 'Green Line Metro', facilities: ['Tactile Paving'] },
  { id: 'BLR-STOP-10', name: 'Malleshwaram 8th Cross', short_name: 'Malleshwaram', lat: 13.0031, lng: 77.5701, landmark: 'Sampige Road', facilities: ['Low-floor Curb'] },
  { id: 'BLR-STOP-11', name: 'Rajajinagar 1st Block', short_name: 'Rajajinagar', lat: 13.0084, lng: 77.5552, landmark: 'Navrang Circle', facilities: ['Audio Announcement'] },
  { id: 'BLR-STOP-12', name: 'Jayanagar 4th Block Complex', short_name: 'Jayanagar', lat: 12.9299, lng: 77.5824, landmark: 'Shopping Complex', facilities: ['Tactile Paving'] },
  { id: 'BLR-STOP-13', name: 'Whitefield TTMC', short_name: 'Whitefield', lat: 12.9698, lng: 77.7499, landmark: 'ITPL', facilities: ['Modern Terminal'] },
  { id: 'BLR-STOP-14', name: 'Hebbal Flyover', short_name: 'Hebbal', lat: 13.0358, lng: 77.5970, landmark: 'Airport Expressway', facilities: ['Skywalk Ramp'] },
];

const FALLBACK_ROUTES: Route[] = [
  { id: 'WM-1', route_number: '404', name: 'Route 404: MG Road ↔ SJBIT College via Majestic', color: '#00A896', stops: ['BLR-STOP-02', 'BLR-STOP-03', 'BLR-STOP-01', 'BLR-STOP-10', 'BLR-STOP-11', 'BLR-STOP-04'], leg_distances_km: [2.1, 3.4, 3.8, 2.0, 12.5], leg_standard_minutes: [7, 10, 11, 6, 25] },
  { id: 'WM-2', route_number: '210', name: 'Route 210: Banashankari ↔ Majestic via Koramangala', color: '#FFB703', stops: ['BLR-STOP-09', 'BLR-STOP-12', 'BLR-STOP-05', 'BLR-STOP-06', 'BLR-STOP-02', 'BLR-STOP-01'], leg_distances_km: [2.6, 4.3, 2.4, 5.1, 4.2], leg_standard_minutes: [8, 14, 8, 16, 12] },
  { id: 'WM-3', route_number: '175', name: 'Route 175: Electronic City ↔ Hebbal via Indiranagar', color: '#02C39A', stops: ['BLR-STOP-08', 'BLR-STOP-05', 'BLR-STOP-07', 'BLR-STOP-03', 'BLR-STOP-14'], leg_distances_km: [11.2, 7.8, 4.5, 7.2], leg_standard_minutes: [22, 19, 13, 18] },
];

export const api = {
  async getStops(): Promise<Stop[]> {
    try {
      const res = await fetch(`${API_BASE}/stops`);
      if (!res.ok) throw new Error('Failed to fetch stops');
      return await res.json();
    } catch {
      return FALLBACK_STOPS;
    }
  },

  async getRoutes(): Promise<Route[]> {
    try {
      const res = await fetch(`${API_BASE}/routes`);
      if (!res.ok) throw new Error('Failed to fetch routes');
      return await res.json();
    } catch {
      return FALLBACK_ROUTES;
    }
  },

  async getVehicles(): Promise<VehicleLiveState[]> {
    try {
      const res = await fetch(`${API_BASE}/vehicles`);
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      return await res.json();
    } catch {
      return [
        {
          id: 'WM-V1',
          vehicle_number: 'KA-01-F-4040',
          display_name: 'Bus 404',
          route_id: 'WM-1',
          is_demo_bus: true,
          demo_name: 'DEMO-BUS-A',
          capacity: 6,
          lat: 12.9756,
          lng: 77.6097,
          heading: 270,
          current_stop_id: 'BLR-STOP-02',
          next_stop_id: 'BLR-STOP-03',
          progress_between_stops: 0.35,
          status: 'ON_TIME',
          speed_kmh: 24,
          eta_next_stop_minutes: 2,
          crowd_count: 3,
          crowd_level: 'Low',
          capacity_exceeded: false,
          crowd_source: 'Simulated crowd observation',
          wheelchair_accessible: true,
          low_floor: true,
          ramp_available: true,
          audio_announcement: true,
          camera_feed_enabled: true
        },
        {
          id: 'WM-V2',
          vehicle_number: 'KA-01-F-2101',
          display_name: 'Bus 210',
          route_id: 'WM-2',
          is_demo_bus: false,
          capacity: 6,
          lat: 12.9299,
          lng: 77.5824,
          heading: 90,
          current_stop_id: 'BLR-STOP-12',
          next_stop_id: 'BLR-STOP-05',
          progress_between_stops: 0.65,
          status: 'DELAYED',
          speed_kmh: 12,
          eta_next_stop_minutes: 5,
          crowd_count: 5,
          crowd_level: 'High',
          capacity_exceeded: false,
          crowd_source: 'Simulated crowd observation',
          wheelchair_accessible: true,
          low_floor: false,
          ramp_available: false,
          audio_announcement: true,
          camera_feed_enabled: false
        },
        {
          id: 'WM-V3',
          vehicle_number: 'KA-01-F-1750',
          display_name: 'Bus 175',
          route_id: 'WM-3',
          is_demo_bus: false,
          capacity: 6,
          lat: 12.8452,
          lng: 77.6602,
          heading: 330,
          current_stop_id: 'BLR-STOP-08',
          next_stop_id: 'BLR-STOP-05',
          progress_between_stops: 0.2,
          status: 'ON_TIME',
          speed_kmh: 28,
          eta_next_stop_minutes: 7,
          crowd_count: 4,
          crowd_level: 'Moderate',
          capacity_exceeded: false,
          crowd_source: 'Simulated crowd observation',
          wheelchair_accessible: false,
          low_floor: false,
          ramp_available: false,
          audio_announcement: true,
          camera_feed_enabled: false
        },
        {
          id: 'WM-V4',
          vehicle_number: 'KA-01-F-3022',
          display_name: 'Bus 302',
          route_id: 'WM-2',
          is_demo_bus: false,
          capacity: 6,
          lat: 12.9352,
          lng: 77.6245,
          heading: 310,
          current_stop_id: 'BLR-STOP-06',
          next_stop_id: 'BLR-STOP-02',
          progress_between_stops: 0.45,
          status: 'ON_TIME',
          speed_kmh: 22,
          eta_next_stop_minutes: 9,
          crowd_count: 2,
          crowd_level: 'Low',
          capacity_exceeded: false,
          crowd_source: 'Simulated crowd observation',
          wheelchair_accessible: true,
          low_floor: true,
          ramp_available: true,
          audio_announcement: true,
          camera_feed_enabled: false
        }
      ];
    }
  },

  async planJourney(origin: string, destination: string): Promise<JourneyPlanResponse> {
    try {
      const res = await fetch(`${API_BASE}/journey/plan?origin=${origin}&destination=${destination}`);
      if (!res.ok) throw new Error('Journey plan failed');
      return await res.json();
    } catch {
      return {
        origin_stop_id: origin,
        destination_stop_id: destination,
        timestamp: new Date().toISOString(),
        plans: [
          {
            id: 'plan-fastest',
            type: 'Fastest',
            total_travel_time_minutes: 18,
            departure_in_minutes: 2,
            arrival_in_minutes: 20,
            transfer_count: 0,
            overall_crowd_level: 'Low',
            summary_text: 'Direct Route 404 via Majestic',
            legs: [
              {
                vehicle_id: 'WM-V1',
                vehicle_name: 'Bus 404',
                route_id: 'WM-1',
                route_number: '404',
                from_stop_id: origin,
                from_stop_name: 'MG Road',
                to_stop_id: destination,
                to_stop_name: 'SJBIT Stop',
                departure_in_minutes: 2,
                arrival_in_minutes: 20,
                transit_duration_minutes: 18,
                walk_to_stop_minutes: 3,
                current_crowd_level: 'Low',
                current_crowd_count: 3,
                capacity: 6,
                crowd_source: 'Simulated crowd observation'
              }
            ]
          },
          {
            id: 'plan-less-crowded',
            type: 'Less Crowded',
            total_travel_time_minutes: 24,
            departure_in_minutes: 5,
            arrival_in_minutes: 29,
            transfer_count: 0,
            overall_crowd_level: 'Low',
            crowd_differential_note: 'Bus 210 has only 2 passengers (50% less crowded than average)',
            summary_text: 'Bus 210 with plenty of open seats',
            legs: [
              {
                vehicle_id: 'WM-V2',
                vehicle_name: 'Bus 210',
                route_id: 'WM-2',
                route_number: '210',
                from_stop_id: origin,
                from_stop_name: 'MG Road',
                to_stop_id: destination,
                to_stop_name: 'Majestic',
                departure_in_minutes: 5,
                arrival_in_minutes: 29,
                transit_duration_minutes: 24,
                walk_to_stop_minutes: 4,
                current_crowd_level: 'Low',
                current_crowd_count: 2,
                capacity: 6,
                crowd_source: 'Simulated crowd observation'
              }
            ]
          }
        ]
      };
    }
  },

  async getCameraStatus(): Promise<CameraStatus> {
    try {
      const res = await fetch(`${API_BASE}/camera/status`);
      if (!res.ok) throw new Error('Camera status unavailable');
      return await res.json();
    } catch {
      return {
        mode: 'synthetic_demo',
        raw_count: 3,
        smoothed_count: 3,
        crowd_level: 'Low',
        capacity_exceeded: false,
        source: 'Simulated crowd observation',
        is_stale: false,
        privacy_filter: 'line_art_sketch_active',
        faces_revealed: false,
        timestamp_iso: new Date().toISOString()
      };
    }
  },

  async setManualCount(count: number) {
    try {
      const res = await fetch(`${API_BASE}/camera/manual-count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      return await res.json();
    } catch (e) {
      console.warn('Manual count fallback:', e);
      return { status: 'ok', manual_count: count };
    }
  },

  async resetCamera() {
    try {
      const res = await fetch(`${API_BASE}/camera/reset`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn('Reset camera fallback:', e);
      return { status: 'ok' };
    }
  },

  async toggleWebcam(enable: boolean) {
    try {
      const res = await fetch(`${API_BASE}/camera/toggle-webcam?enable=${enable}`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn('Toggle webcam fallback:', e);
      return { status: 'ok', webcam_enabled: false };
    }
  },

  async getOperatorOverview(): Promise<OperatorOverview> {
    try {
      const res = await fetch(`${API_BASE}/operator/overview`);
      if (!res.ok) throw new Error('Overview fetch failed');
      return await res.json();
    } catch {
      return {
        total_buses: 6,
        active_buses: 5,
        delayed_buses: 1,
        total_passengers_onboard: 18,
        active_alerts_count: 1,
        active_help_requests: 0,
        system_status: 'System Online',
        current_scenario: 'normal',
        simulation_speed: 1.0,
        simulation_paused: false,
        server_time_iso: new Date().toISOString()
      };
    }
  },

  async issueTicket(data: {
    idempotency_key: string;
    vehicle_id: string;
    from_stop_id: string;
    to_stop_id: string;
    passenger_count: number;
    fare_paid_inr: number;
  }): Promise<Ticket> {
    try {
      const res = await fetch(`${API_BASE}/conductor/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Ticket issue failed');
      return await res.json();
    } catch {
      return {
        ticket_id: `WM-TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        idempotency_key: data.idempotency_key,
        vehicle_id: data.vehicle_id,
        from_stop_id: data.from_stop_id,
        to_stop_id: data.to_stop_id,
        passenger_count: data.passenger_count,
        fare_paid_inr: data.fare_paid_inr,
        status: 'ACTIVE',
        created_at_iso: new Date().toISOString()
      };
    }
  },

  async getTickets(vehicleId?: string): Promise<Ticket[]> {
    try {
      const url = vehicleId ? `${API_BASE}/conductor/tickets?vehicle_id=${vehicleId}` : `${API_BASE}/conductor/tickets`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Tickets fetch failed');
      return await res.json();
    } catch {
      return [
        {
          ticket_id: 'WM-TKT-8842',
          idempotency_key: 'mock-key-1',
          vehicle_id: 'WM-V1',
          from_stop_id: 'BLR-STOP-02',
          to_stop_id: 'BLR-STOP-01',
          passenger_count: 2,
          fare_paid_inr: 40,
          status: 'ACTIVE',
          created_at_iso: new Date().toISOString()
        }
      ];
    }
  },

  async cancelTicket(ticketId: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/conductor/tickets/${ticketId}/cancel`, { method: 'POST' });
    return await res.json();
  },

  async submitHelpRequest(data: {
    stop_id: string;
    vehicle_id?: string;
    assistance_type: string;
    passenger_name?: string;
    notes?: string;
  }): Promise<HelpRequest> {
    try {
      const res = await fetch(`${API_BASE}/help-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Help request failed');
      return await res.json();
    } catch {
      return {
        receipt_token: `WM-HELP-${Math.floor(1000 + Math.random() * 9000)}`,
        stop_id: data.stop_id,
        stop_name: 'Selected Stop',
        vehicle_id: data.vehicle_id,
        assistance_type: data.assistance_type,
        notes: data.notes,
        status: 'REQUESTED',
        created_at_iso: new Date().toISOString()
      };
    }
  },

  async getHelpRequests(): Promise<HelpRequest[]> {
    try {
      const res = await fetch(`${API_BASE}/help-requests`);
      if (!res.ok) throw new Error('Failed to get help requests');
      return await res.json();
    } catch {
      return [];
    }
  }
};
