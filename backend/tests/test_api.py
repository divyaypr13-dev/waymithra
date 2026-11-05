import pytest
from backend.app.main import (
    health_check, get_stops, get_routes, get_journey_plan,
    issue_ticket, cancel_ticket_endpoint, submit_help_request,
    update_help_request_status, get_operator_overview, get_camera_status
)
from backend.app.config import get_crowd_level
from backend.app.models import (
    TicketCreateRequest, HelpRequestCreate, HelpRequestUpdate
)
from backend.app.network_data import LANDMARK_STOPS, ROUTES

def test_health_check():
    res = health_check()
    assert res["status"] == "healthy"
    assert "WayMithra" in res["service"]

def test_stops_and_routes_count():
    stops = get_stops()
    assert len(stops) == 14

    routes = get_routes()
    assert len(routes) == 3

def test_crowd_threshold_overrides():
    # Strict specification: 0-2 Low, 3-4 Moderate, 5-6 High, >6 High + Exceeded
    assert get_crowd_level(0) == ("Low", False)
    assert get_crowd_level(2) == ("Low", False)
    assert get_crowd_level(3) == ("Moderate", False)
    assert get_crowd_level(4) == ("Moderate", False)
    assert get_crowd_level(5) == ("High", False)
    assert get_crowd_level(6) == ("High", False)
    assert get_crowd_level(7) == ("High", True)

def test_journey_planner_direct_and_diff_note():
    # MG Road (BLR-STOP-02) to SJBIT (BLR-STOP-04) on WM-1
    res = get_journey_plan("BLR-STOP-02", "BLR-STOP-04")
    assert len(res.plans) >= 2
    
    types = [p.type for p in res.plans]
    assert "Fastest" in types
    assert "Less Crowded" in types
    
    # Check less crowded note
    lc_card = next(p for p in res.plans if p.type == "Less Crowded")
    assert lc_card.crowd_differential_note is not None

def test_journey_planner_transfer():
    # Banashankari (BLR-STOP-09 on WM-2) to Hebbal (BLR-STOP-14 on WM-3)
    res = get_journey_plan("BLR-STOP-09", "BLR-STOP-14")
    assert len(res.plans) > 0
    # Must have a transfer option
    transfer_plan = any(p.transfer_count >= 1 for p in res.plans)
    assert transfer_plan is True

def test_ticket_idempotency_and_cancellation():
    key = "test-idempotency-key-py314-test"
    req = TicketCreateRequest(
        idempotency_key=key,
        vehicle_id="WM-V1",
        from_stop_id="BLR-STOP-02",
        to_stop_id="BLR-STOP-01",
        passenger_count=2,
        fare_paid_inr=40.0
    )
    
    # First issuance
    t1 = issue_ticket(req)
    assert t1["idempotency_key"] == key
    assert t1["passenger_count"] == 2
    ticket_id = t1["ticket_id"]
    
    # Second issuance with same idempotency key must return same ticket
    t2 = issue_ticket(req)
    assert t2["ticket_id"] == ticket_id
    
    # Cancellation
    res_cancel = cancel_ticket_endpoint(ticket_id)
    assert res_cancel["status"] == "CANCELLED"

def test_help_request_lifecycle():
    req = HelpRequestCreate(
        stop_id="BLR-STOP-02",
        assistance_type="Wheelchair Ramp Required",
        passenger_name="Deepa Rao",
        notes="Waiting near platform 2"
    )
    data = submit_help_request(req)
    assert data["receipt_token"].startswith("WM-HELP-")
    assert data["status"] == "REQUESTED"
    token = data["receipt_token"]
    
    # Update status to ACKNOWLEDGED
    up_req = HelpRequestUpdate(status="ACKNOWLEDGED", notes="Conductor notified")
    res_up = update_help_request_status(token, up_req)
    assert res_up["status"] == "ACKNOWLEDGED"

def test_operator_truthful_metrics():
    data = get_operator_overview()
    assert data["total_buses"] == 6
    assert isinstance(data["total_passengers_onboard"], int)
    assert data["system_status"] == "System Online"

def test_camera_privacy_status():
    status = get_camera_status()
    assert status["privacy_filter"] == "line_art_sketch_active"
    assert status["faces_revealed"] is False
    assert status["smoothed_count"] >= 0
