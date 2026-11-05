import time
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, Response, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import OPERATOR_SECRET, DB_PATH
from .db import (
    init_db, create_ticket, cancel_ticket, list_tickets,
    get_ticket_derived_occupancy, create_help_request, update_help_request,
    get_help_request, list_help_requests, list_audit_logs
)
from .network_data import LANDMARK_STOPS, ROUTES, STOPS_BY_ID, ROUTES_BY_ID
from .models import (
    StopModel, RouteModel, VehicleLiveState, JourneyPlanResponse,
    TicketCreateRequest, TicketModel, HelpRequestCreate, HelpRequestModel,
    HelpRequestUpdate, ScenarioRequest, ManualCountRequest
)
from .simulator import simulator_instance
from .camera_service import camera_service
from .journey_planner import plan_journey, forecast_occupancy_downstream

# Initialize database
init_db()

app = FastAPI(
    title="Way ಮಿತ್ರ (WayMithra) API",
    description="Real-time public transit companion with crowd intelligence and accessibility.",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev & build
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "WayMithra Transport Backend",
        "timestamp_iso": datetime.now(timezone.utc).isoformat()
    }

# ================= STOPS & ROUTES =================
@app.get("/api/stops", response_model=List[StopModel])
def get_stops():
    return LANDMARK_STOPS

@app.get("/api/places")
def search_places(query: str = Query("", min_length=0)):
    q = query.strip().lower()
    if not q:
        return LANDMARK_STOPS
    results = []
    for s in LANDMARK_STOPS:
        if q in s["name"].lower() or q in s["short_name"].lower() or (s.get("landmark") and q in s["landmark"].lower()):
            results.append(s)
    return results

@app.get("/api/routes", response_model=List[RouteModel])
def get_routes():
    return ROUTES

# ================= VEHICLES =================
@app.get("/api/vehicles", response_model=List[VehicleLiveState])
def get_vehicles():
    return simulator_instance.get_all_vehicles()

@app.get("/api/vehicles/{vehicle_id}", response_model=VehicleLiveState)
def get_vehicle_by_id(vehicle_id: str):
    v = simulator_instance.get_vehicle(vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v

# ================= JOURNEY PLANNING =================
@app.get("/api/journey/plan", response_model=JourneyPlanResponse)
def get_journey_plan(
    origin: str = Query(..., description="Origin Stop ID"),
    destination: str = Query(..., description="Destination Stop ID")
):
    try:
        return plan_journey(origin, destination)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/journey/forecast")
def get_occupancy_forecast(
    route_id: str = Query(...),
    from_stop_id: str = Query(...),
    to_stop_id: str = Query(...)
):
    if route_id not in ROUTES_BY_ID:
        raise HTTPException(status_code=404, detail="Route not found")
    # Get vehicle on route
    vehicles = [v for v in simulator_instance.get_all_vehicles() if v["route_id"] == route_id]
    crowd = vehicles[0]["crowd_count"] if vehicles else 3
    forecasts = forecast_occupancy_downstream(route_id, from_stop_id, to_stop_id, crowd, 2)
    return forecasts

# ================= CAMERA & COMPUTER VISION =================
@app.get("/api/camera/status")
def get_camera_status():
    return camera_service.get_status()

def _mjpeg_generator():
    while True:
        frame_bytes = camera_service.get_latest_frame()
        if frame_bytes:
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
        time.sleep(0.08)

@app.get("/api/camera/stream")
def get_camera_stream():
    """Live MJPEG video stream for operator console and user mode."""
    return StreamingResponse(
        _mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/camera/snapshot")
def get_camera_snapshot():
    """Single JPEG snapshot for privacy camera view."""
    frame_bytes = camera_service.get_latest_frame()
    if not frame_bytes:
        raise HTTPException(status_code=503, detail="Camera frame not ready")
    return Response(content=frame_bytes, media_type="image/jpeg")

@app.post("/api/camera/toggle-webcam")
def toggle_webcam(enable: bool = Query(...)):
    success = camera_service.toggle_webcam(enable)
    return {
        "status": "ok",
        "webcam_enabled": success if enable else False,
        "mode": camera_service.mode
    }

@app.post("/api/camera/manual-count")
def set_manual_count(req: ManualCountRequest):
    camera_service.set_manual_count(req.count)
    return {"status": "ok", "manual_count": req.count, "mode": "manual_override"}

@app.post("/api/camera/reset")
def reset_camera():
    camera_service.reset_to_camera_or_sim()
    return {"status": "ok", "mode": camera_service.mode}

# ================= CONDUCTOR TICKETING =================
@app.post("/api/conductor/tickets", response_model=TicketModel)
def issue_ticket(req: TicketCreateRequest):
    ticket = create_ticket(
        idempotency_key=req.idempotency_key,
        vehicle_id=req.vehicle_id,
        from_stop_id=req.from_stop_id,
        to_stop_id=req.to_stop_id,
        passenger_count=req.passenger_count,
        fare_paid_inr=req.fare_paid_inr
    )
    return ticket

@app.get("/api/conductor/tickets", response_model=List[TicketModel])
def get_tickets(vehicle_id: Optional[str] = None):
    return list_tickets(vehicle_id)

@app.post("/api/conductor/tickets/{ticket_id}/cancel")
def cancel_ticket_endpoint(ticket_id: str):
    ticket = cancel_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.get("/api/conductor/occupancy/{vehicle_id}")
def get_conductor_occupancy(vehicle_id: str):
    count = get_ticket_derived_occupancy(vehicle_id)
    return {
        "vehicle_id": vehicle_id,
        "ticket_derived_passenger_count": count,
        "source": "Conductor ticket transactions (segregated)"
    }

# ================= PASSENGER HELP & ACCESSIBILITY =================
@app.post("/api/help-requests", response_model=HelpRequestModel)
def submit_help_request(req: HelpRequestCreate):
    stop = STOPS_BY_ID.get(req.stop_id)
    if not stop:
        raise HTTPException(status_code=400, detail="Invalid stop ID")
    res = create_help_request(
        stop_id=req.stop_id,
        stop_name=stop["short_name"],
        assistance_type=req.assistance_type,
        vehicle_id=req.vehicle_id,
        passenger_name=req.passenger_name or "Passenger",
        notes=req.notes or ""
    )
    return res

@app.get("/api/help-requests/{receipt_token}", response_model=HelpRequestModel)
def get_help_request_by_token(receipt_token: str):
    req = get_help_request(receipt_token)
    if not req:
        raise HTTPException(status_code=404, detail="Help request token not found")
    return req

@app.get("/api/help-requests", response_model=List[HelpRequestModel])
def get_all_help_requests():
    return list_help_requests()

@app.patch("/api/help-requests/{receipt_token}", response_model=HelpRequestModel)
def update_help_request_status(receipt_token: str, req: HelpRequestUpdate):
    updated = update_help_request(receipt_token, req.status, req.notes)
    if not updated:
        raise HTTPException(status_code=404, detail="Help request token not found")
    return updated

# ================= OPERATOR & SYSTEM METRICS =================
@app.get("/api/operator/overview")
def get_operator_overview():
    """
    Truthful live metrics calculated directly from system state.
    NO fabricated +6% or 48 buses.
    """
    vehicles = simulator_instance.get_all_vehicles()
    total_buses = len(vehicles)
    active_buses = sum(1 for v in vehicles if v["status"] != "DELAYED")
    delayed_buses = sum(1 for v in vehicles if v["status"] == "DELAYED")
    total_passengers_onboard = sum(v["crowd_count"] for v in vehicles)
    
    help_reqs = list_help_requests()
    active_help_requests = sum(1 for h in help_reqs if h["status"] in ["REQUESTED", "ACKNOWLEDGED", "DISPATCHED"])
    
    # Check for active alerts (high crowd or delay)
    high_crowd_alerts = [v["display_name"] for v in vehicles if v["crowd_level"] == "High"]
    active_alerts_count = len(high_crowd_alerts) + (1 if delayed_buses > 0 else 0) + active_help_requests
    
    return {
        "total_buses": total_buses,
        "active_buses": active_buses,
        "delayed_buses": delayed_buses,
        "total_passengers_onboard": total_passengers_onboard,
        "active_alerts_count": active_alerts_count,
        "active_help_requests": active_help_requests,
        "system_status": "System Online",
        "current_scenario": simulator_instance.scenario,
        "simulation_speed": simulator_instance.speed_multiplier,
        "simulation_paused": simulator_instance.paused,
        "server_time_iso": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/operator/scenario")
def set_scenario(req: ScenarioRequest):
    simulator_instance.set_scenario(
        scenario=req.scenario,
        speed_multiplier=req.simulation_speed or 1.0,
        paused=req.paused or False
    )
    return {
        "status": "ok",
        "scenario": simulator_instance.scenario,
        "speed": simulator_instance.speed_multiplier,
        "paused": simulator_instance.paused
    }

@app.get("/api/operator/logs")
def get_operator_logs():
    return list_audit_logs(limit=30)

from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Static frontend mount
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")
