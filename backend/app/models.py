from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

# Truthful source badge types
SourceBadge = Literal[
    "Live webcam observation",
    "Simulated position",
    "Simulated crowd observation",
    "Manual demo input",
    "Predicted",
    "Unknown / unavailable"
]

CrowdLevel = Literal["Low", "Moderate", "High"]
VehicleStatus = Literal["ON_TIME", "DELAYED", "NEAR_STOP", "AT_STOP"]

class StopModel(BaseModel):
    id: str
    name: str
    short_name: str
    lat: float
    lng: float
    landmark: Optional[str] = None
    facilities: List[str] = []

class RouteModel(BaseModel):
    id: str
    route_number: str
    name: str
    color: str
    stops: List[str]
    leg_distances_km: List[float]
    leg_standard_minutes: List[int]

class VehicleLiveState(BaseModel):
    id: str
    vehicle_number: str
    display_name: str
    route_id: str
    is_demo_bus: bool
    demo_name: Optional[str] = None
    capacity: int = 6
    lat: float
    lng: float
    heading: float = 0.0
    current_stop_id: str
    next_stop_id: Optional[str] = None
    progress_between_stops: float = 0.0  # 0.0 to 1.0
    status: VehicleStatus = "ON_TIME"
    speed_kmh: float = 24.0
    eta_next_stop_minutes: int = 2
    
    # Live crowd state
    crowd_count: int = 0
    crowd_level: CrowdLevel = "Low"
    capacity_exceeded: bool = False
    crowd_source: SourceBadge = "Simulated crowd observation"
    last_crowd_update_iso: Optional[str] = None
    
    # Accessibility capabilities
    wheelchair_accessible: bool = True
    low_floor: bool = True
    ramp_available: bool = True
    audio_announcement: bool = True
    camera_feed_enabled: bool = False

class StopOccupancyForecast(BaseModel):
    stop_id: str
    stop_name: str
    estimated_arrival_minutes: int
    predicted_crowd_count: int
    predicted_crowd_level: CrowdLevel
    predicted_boardings: int
    predicted_alightings: int
    forecast_source: SourceBadge = "Predicted"

class JourneyLeg(BaseModel):
    vehicle_id: str
    vehicle_name: str
    route_id: str
    route_number: str
    from_stop_id: str
    from_stop_name: str
    to_stop_id: str
    to_stop_name: str
    departure_in_minutes: int
    arrival_in_minutes: int
    transit_duration_minutes: int
    walk_to_stop_minutes: int = 3
    current_crowd_level: CrowdLevel
    current_crowd_count: int
    capacity: int = 6
    crowd_source: SourceBadge
    stop_forecasts: List[StopOccupancyForecast] = []
    accessibility: Dict[str, bool] = {}

class JourneyCard(BaseModel):
    id: str
    type: Literal["Fastest", "Less Crowded", "Alternative"]
    total_travel_time_minutes: int
    departure_in_minutes: int
    arrival_in_minutes: int
    legs: List[JourneyLeg]
    transfer_count: int
    overall_crowd_level: CrowdLevel
    crowd_differential_note: Optional[str] = None
    summary_text: str

class JourneyPlanResponse(BaseModel):
    origin_stop_id: str
    destination_stop_id: str
    plans: List[JourneyCard]
    timestamp: str

class TicketCreateRequest(BaseModel):
    idempotency_key: str
    vehicle_id: str
    from_stop_id: str
    to_stop_id: str
    passenger_count: int = 1
    fare_paid_inr: float = 20.0

class TicketModel(BaseModel):
    ticket_id: str
    idempotency_key: str
    vehicle_id: str
    from_stop_id: str
    to_stop_id: str
    passenger_count: int
    fare_paid_inr: float
    status: Literal["ACTIVE", "CANCELLED", "COMPLETED"]
    created_at_iso: str

class HelpRequestCreate(BaseModel):
    vehicle_id: Optional[str] = None
    route_id: Optional[str] = None
    stop_id: str
    passenger_name: Optional[str] = "Passenger"
    assistance_type: Literal[
        "Wheelchair Ramp Required",
        "Visual/Audio Boarding Guide",
        "Elderly/Mobility Support",
        "General Assistance"
    ]
    notes: Optional[str] = ""

class HelpRequestModel(BaseModel):
    receipt_token: str
    stop_id: str
    stop_name: str
    vehicle_id: Optional[str]
    assistance_type: str
    notes: Optional[str]
    status: Literal["REQUESTED", "ACKNOWLEDGED", "DISPATCHED", "RESOLVED"]
    created_at_iso: str
    updated_at_iso: str

class HelpRequestUpdate(BaseModel):
    status: Literal["ACKNOWLEDGED", "DISPATCHED", "RESOLVED"]
    notes: Optional[str] = None

class ScenarioRequest(BaseModel):
    scenario: Literal["normal", "evening_surge", "silk_board_jam", "sensor_glitch"]
    simulation_speed: Optional[float] = 1.0
    paused: Optional[bool] = False

class ManualCountRequest(BaseModel):
    count: int = Field(ge=0, le=12)
