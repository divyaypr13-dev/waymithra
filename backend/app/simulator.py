import time
import math
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from .network_data import STOPS_BY_ID, ROUTES_BY_ID, VEHICLES
from .config import get_crowd_level, DEFAULT_BUS_CAPACITY

def calculate_heading(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate geographic heading in degrees (0-360) from point 1 to point 2."""
    d_lng = math.radians(lng2 - lng1)
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    y = math.sin(d_lng) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(d_lng)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360) % 360

def interpolate_coordinates(lat1: float, lng1: float, lat2: float, lng2: float, fraction: float) -> tuple[float, float]:
    """Linear interpolation between two lat/lng coordinates."""
    f = max(0.0, min(1.0, fraction))
    lat = lat1 + (lat2 - lat1) * f
    lng = lng1 + (lng2 - lng1) * f
    return lat, lng

class SimulatorEngine:
    def __init__(self):
        self.lock = threading.Lock()
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.speed_multiplier = 1.0
        self.paused = False
        self.scenario = "normal"  # normal, evening_surge, silk_board_jam, sensor_glitch
        
        # In-memory live vehicle states
        self.vehicles_state: Dict[str, Dict[str, Any]] = {}
        self._initialize_vehicles()

    def _initialize_vehicles(self):
        # Stagger vehicles across their route stops initially
        stagger_indices = {
            "WM-V1": 0, # MG Road -> Shivajinagar
            "WM-V2": 1, # Jayanagar -> Silk Board
            "WM-V3": 0, # Electronic City -> Silk Board
            "WM-V4": 3, # Koramangala -> MG Road
            "WM-V5": 3, # Malleshwaram -> Rajajinagar
            "WM-V6": 2  # Indiranagar -> Shivajinagar
        }
        
        # Initial crowd counts (0-2 Low, 3-4 Moderate, 5-6 High)
        initial_crowds = {
            "WM-V1": 3, # Moderate
            "WM-V2": 5, # High
            "WM-V3": 2, # Low
            "WM-V4": 1, # Low
            "WM-V5": 4, # Moderate
            "WM-V6": 2  # Low
        }

        for v in VEHICLES:
            v_id = v["id"]
            route = ROUTES_BY_ID[v["route_id"]]
            stop_ids = route["stops"]
            
            leg_idx = stagger_indices.get(v_id, 0)
            if leg_idx >= len(stop_ids) - 1:
                leg_idx = 0
                
            curr_stop_id = stop_ids[leg_idx]
            next_stop_id = stop_ids[leg_idx + 1]
            curr_stop = STOPS_BY_ID[curr_stop_id]
            next_stop = STOPS_BY_ID[next_stop_id]
            
            initial_crowd = initial_crowds.get(v_id, 2)
            crowd_lvl, exceeded = get_crowd_level(initial_crowd, v["capacity"])
            
            heading = calculate_heading(curr_stop["lat"], curr_stop["lng"], next_stop["lat"], next_stop["lng"])
            
            self.vehicles_state[v_id] = {
                "id": v_id,
                "vehicle_number": v["vehicle_number"],
                "display_name": v["display_name"],
                "route_id": v["route_id"],
                "is_demo_bus": v["is_demo_bus"],
                "demo_name": v["demo_name"],
                "capacity": v["capacity"],
                "leg_index": leg_idx,
                "direction": 1, # 1: forward, -1: reverse
                "progress": 0.15,
                "lat": curr_stop["lat"],
                "lng": curr_stop["lng"],
                "heading": heading,
                "current_stop_id": curr_stop_id,
                "next_stop_id": next_stop_id,
                "status": "ON_TIME",
                "speed_kmh": 24.0,
                "dwell_remaining_seconds": 0,
                "eta_next_stop_minutes": 2,
                "crowd_count": initial_crowd,
                "crowd_level": crowd_lvl,
                "capacity_exceeded": exceeded,
                "crowd_source": "Simulated crowd observation",
                "last_crowd_update_iso": datetime.now(timezone.utc).isoformat(),
                # Accessibility
                "wheelchair_accessible": v["wheelchair_accessible"],
                "low_floor": v["low_floor"],
                "ramp_available": v["ramp_available"],
                "audio_announcement": v["audio_announcement"],
                "camera_feed_enabled": v["camera_feed_enabled"]
            }

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)

    def set_scenario(self, scenario: str, speed_multiplier: float = 1.0, paused: bool = False):
        with self.lock:
            self.scenario = scenario
            self.speed_multiplier = max(0.2, min(10.0, speed_multiplier))
            self.paused = paused

    def update_demo_bus_crowd(self, count: int, source: str):
        """Called by camera worker or manual input to update DEMO-BUS-A crowd."""
        with self.lock:
            v = self.vehicles_state.get("WM-V1")
            if v:
                v["crowd_count"] = count
                level, exceeded = get_crowd_level(count, v["capacity"])
                v["crowd_level"] = level
                v["capacity_exceeded"] = exceeded
                v["crowd_source"] = source
                v["last_crowd_update_iso"] = datetime.now(timezone.utc).isoformat()

    def _run_loop(self):
        while self.running:
            time.sleep(1.0)
            if self.paused:
                continue
            with self.lock:
                self._tick()

    def _tick(self):
        dt = 1.0 * self.speed_multiplier
        
        for v_id, v in self.vehicles_state.items():
            route = ROUTES_BY_ID[v["route_id"]]
            stop_ids = route["stops"]
            leg_distances = route["leg_distances_km"]
            
            # Scenario impacts
            current_stop_id = v["current_stop_id"]
            if self.scenario == "silk_board_jam" and (current_stop_id == "BLR-STOP-05" or v["next_stop_id"] == "BLR-STOP-05"):
                v["speed_kmh"] = 8.0
                v["status"] = "DELAYED"
            elif self.scenario == "evening_surge":
                v["speed_kmh"] = 18.0
                v["status"] = "ON_TIME"
                if not v["is_demo_bus"]:
                    v["crowd_count"] = min(v["capacity"], max(4, v["crowd_count"]))
                    lvl, exc = get_crowd_level(v["crowd_count"], v["capacity"])
                    v["crowd_level"] = lvl
                    v["capacity_exceeded"] = exc
            else:
                v["speed_kmh"] = 24.0
                if v["status"] == "DELAYED":
                    v["status"] = "ON_TIME"

            # Handle dwell at stop
            if v["dwell_remaining_seconds"] > 0:
                v["dwell_remaining_seconds"] -= dt
                v["status"] = "AT_STOP"
                if v["dwell_remaining_seconds"] <= 0:
                    v["dwell_remaining_seconds"] = 0
                    v["status"] = "ON_TIME"
                continue

            # Leg movement
            leg_idx = v["leg_index"]
            curr_stop = STOPS_BY_ID[v["current_stop_id"]]
            next_stop = STOPS_BY_ID[v["next_stop_id"]]
            
            dist_km = leg_distances[leg_idx] if leg_idx < len(leg_distances) else 3.0
            total_leg_seconds = (dist_km / max(5.0, v["speed_kmh"])) * 3600.0
            
            # Advance progress
            progress_step = dt / max(10.0, total_leg_seconds)
            v["progress"] += progress_step
            
            # Update heading and interpolated lat/lng
            v["heading"] = calculate_heading(curr_stop["lat"], curr_stop["lng"], next_stop["lat"], next_stop["lng"])
            v["lat"], v["lng"] = interpolate_coordinates(
                curr_stop["lat"], curr_stop["lng"],
                next_stop["lat"], next_stop["lng"],
                v["progress"]
            )
            
            # Status near stop
            if v["progress"] >= 0.85:
                v["status"] = "NEAR_STOP"
            else:
                if v["status"] != "DELAYED":
                    v["status"] = "ON_TIME"

            # Remaining ETA to next stop
            remaining_seconds = max(0.0, (1.0 - v["progress"]) * total_leg_seconds)
            v["eta_next_stop_minutes"] = max(1, math.ceil(remaining_seconds / 60.0))

            # Arrived at next stop
            if v["progress"] >= 1.0:
                v["progress"] = 0.0
                v["dwell_remaining_seconds"] = 12.0  # Dwell 12 seconds
                v["status"] = "AT_STOP"
                v["current_stop_id"] = v["next_stop_id"]
                
                # Advance to subsequent stop
                direction = v["direction"]
                curr_idx_in_route = stop_ids.index(v["current_stop_id"])
                next_idx = curr_idx_in_route + direction
                
                # Reverse if end reached
                if next_idx >= len(stop_ids):
                    v["direction"] = -1
                    next_idx = curr_idx_in_route - 1
                elif next_idx < 0:
                    v["direction"] = 1
                    next_idx = 1
                    
                v["next_stop_id"] = stop_ids[next_idx]
                v["leg_index"] = min(curr_idx_in_route, next_idx)

                # Simulated passenger boarding/alighting at stop (for non-demo buses)
                if not v["is_demo_bus"]:
                    alighting = min(v["crowd_count"], 1)
                    boarding = 1 if v["crowd_count"] < v["capacity"] else 0
                    v["crowd_count"] = max(0, min(v["capacity"], v["crowd_count"] - alighting + boarding))
                    lvl, exc = get_crowd_level(v["crowd_count"], v["capacity"])
                    v["crowd_level"] = lvl
                    v["capacity_exceeded"] = exc
                    v["last_crowd_update_iso"] = datetime.now(timezone.utc).isoformat()

    def get_all_vehicles(self) -> List[Dict[str, Any]]:
        with self.lock:
            return [dict(v) for v in self.vehicles_state.values()]

    def get_vehicle(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        with self.lock:
            v = self.vehicles_state.get(vehicle_id)
            return dict(v) if v else None

simulator_instance = SimulatorEngine()
simulator_instance.start()
