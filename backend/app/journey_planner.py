"""
Journey Planning Engine & Stop-by-Stop Occupancy Forecaster
Supports Direct Routes & Valid 1-Transfer Connections with strict validations.
"""
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
from .network_data import STOPS_BY_ID, ROUTES, ROUTES_BY_ID
from .simulator import simulator_instance
from .config import get_crowd_level
from .models import JourneyCard, JourneyLeg, StopOccupancyForecast, JourneyPlanResponse

# Typical stop boarding/alighting rates per stop in synthetic network
TYPICAL_STOP_DYNAMICS: Dict[str, Tuple[int, int]] = {
    # stop_id: (avg_boardings, avg_alightings)
    "BLR-STOP-01": (2, 3), # Majestic
    "BLR-STOP-02": (2, 2), # MG Road
    "BLR-STOP-03": (1, 2), # Shivajinagar
    "BLR-STOP-04": (1, 3), # SJBIT
    "BLR-STOP-05": (3, 2), # Silk Board
    "BLR-STOP-06": (2, 1), # Koramangala
    "BLR-STOP-07": (2, 2), # Indiranagar
    "BLR-STOP-08": (1, 3), # Electronic City
    "BLR-STOP-09": (2, 2), # Banashankari
    "BLR-STOP-10": (1, 1), # Malleshwaram
    "BLR-STOP-11": (1, 1), # Rajajinagar
    "BLR-STOP-12": (1, 1), # Jayanagar
    "BLR-STOP-13": (2, 2), # Whitefield
    "BLR-STOP-14": (1, 2), # Hebbal
}

def forecast_occupancy_downstream(
    route_id: str,
    from_stop_id: str,
    to_stop_id: str,
    initial_crowd: int,
    start_departure_minutes: int,
    capacity: int = 6
) -> List[StopOccupancyForecast]:
    route = ROUTES_BY_ID[route_id]
    stop_ids = route["stops"]
    
    # Determine direction
    idx1 = stop_ids.index(from_stop_id)
    idx2 = stop_ids.index(to_stop_id)
    step = 1 if idx2 > idx1 else -1
    
    forecasts = []
    curr_crowd = initial_crowd
    curr_time = start_departure_minutes
    
    # Traverse from from_stop to to_stop
    curr_idx = idx1
    leg_minutes = route["leg_standard_minutes"]
    
    while curr_idx != idx2:
        next_idx = curr_idx + step
        leg_step_idx = min(curr_idx, next_idx)
        travel_min = leg_minutes[leg_step_idx] if leg_step_idx < len(leg_minutes) else 8
        curr_time += travel_min
        
        target_stop_id = stop_ids[next_idx]
        target_stop = STOPS_BY_ID[target_stop_id]
        
        board_rate, alight_rate = TYPICAL_STOP_DYNAMICS.get(target_stop_id, (1, 1))
        # Modify load
        curr_crowd = max(0, min(capacity, curr_crowd - alight_rate + board_rate))
        level, _ = get_crowd_level(curr_crowd, capacity)
        
        forecasts.append(StopOccupancyForecast(
            stop_id=target_stop_id,
            stop_name=target_stop["short_name"],
            estimated_arrival_minutes=curr_time,
            predicted_crowd_count=curr_crowd,
            predicted_crowd_level=level,
            predicted_boardings=board_rate,
            predicted_alightings=alight_rate,
            forecast_source="Predicted"
        ))
        
        curr_idx = next_idx
        
    return forecasts

def find_direct_connections(origin_id: str, destination_id: str) -> List[Dict[str, Any]]:
    results = []
    vehicles = simulator_instance.get_all_vehicles()
    
    for route in ROUTES:
        r_stops = route["stops"]
        if origin_id in r_stops and destination_id in r_stops:
            orig_idx = r_stops.index(origin_id)
            dest_idx = r_stops.index(destination_id)
            
            # Distance and travel duration calculation
            if orig_idx < dest_idx:
                legs_sub = route["leg_standard_minutes"][orig_idx:dest_idx]
                transit_min = sum(legs_sub)
                target_direction = 1
            else:
                legs_sub = route["leg_standard_minutes"][dest_idx:orig_idx]
                transit_min = sum(legs_sub)
                target_direction = -1
                
            # Find active vehicles on this route traveling in the right direction
            route_vehicles = [v for v in vehicles if v["route_id"] == route["id"]]
            
            for v in route_vehicles:
                # Vehicle progress & reachability
                v_curr_idx = r_stops.index(v["current_stop_id"])
                
                # Check if vehicle has already passed the origin in current direction
                if (target_direction == 1 and v_curr_idx > orig_idx) or \
                   (target_direction == -1 and v_curr_idx < orig_idx):
                    # Vehicle has passed, but in looping simulator it will loop back or staggered vehicle exists
                    departure_min = 12 + abs(v_curr_idx - orig_idx) * 4
                else:
                    stops_away = abs(v_curr_idx - orig_idx)
                    departure_min = max(2, stops_away * 3 + v["eta_next_stop_minutes"])
                    
                results.append({
                    "route": route,
                    "vehicle": v,
                    "departure_min": departure_min,
                    "transit_min": transit_min,
                    "arrival_min": departure_min + transit_min,
                    "walk_min": 3,
                    "is_transfer": False
                })
    return results

def find_transfer_connections(origin_id: str, destination_id: str) -> List[Dict[str, Any]]:
    results = []
    vehicles = simulator_instance.get_all_vehicles()
    
    # Check intermediate transfer stops
    for route1 in ROUTES:
        if origin_id not in route1["stops"]:
            continue
        for route2 in ROUTES:
            if route2["id"] == route1["id"] or destination_id not in route2["stops"]:
                continue
                
            # Intersect stops
            common_stops = [s for s in route1["stops"] if s in route2["stops"]]
            for transfer_stop_id in common_stops:
                if transfer_stop_id == origin_id or transfer_stop_id == destination_id:
                    continue
                    
                r1_orig_idx = route1["stops"].index(origin_id)
                r1_trans_idx = route1["stops"].index(transfer_stop_id)
                r2_trans_idx = route2["stops"].index(transfer_stop_id)
                r2_dest_idx = route2["stops"].index(destination_id)
                
                # Leg 1
                if r1_orig_idx < r1_trans_idx:
                    transit1 = sum(route1["leg_standard_minutes"][r1_orig_idx:r1_trans_idx])
                else:
                    transit1 = sum(route1["leg_standard_minutes"][r1_trans_idx:r1_orig_idx])
                    
                # Leg 2
                if r2_trans_idx < r2_dest_idx:
                    transit2 = sum(route2["leg_standard_minutes"][r2_trans_idx:r2_dest_idx])
                else:
                    transit2 = sum(route2["leg_standard_minutes"][r2_dest_idx:r2_trans_idx])
                    
                # Find best vehicles
                v1_candidates = [v for v in vehicles if v["route_id"] == route1["id"]]
                v2_candidates = [v for v in vehicles if v["route_id"] == route2["id"]]
                
                if not v1_candidates or not v2_candidates:
                    continue
                    
                v1 = v1_candidates[0]
                v2 = v2_candidates[0]
                
                dep1 = max(3, v1["eta_next_stop_minutes"] + 2)
                arr1 = dep1 + transit1
                
                # Transfer buffer: minimum 4 minutes
                transfer_buffer = 5
                dep2 = arr1 + transfer_buffer
                arr2 = dep2 + transit2
                
                results.append({
                    "is_transfer": True,
                    "transfer_stop_id": transfer_stop_id,
                    "route1": route1,
                    "vehicle1": v1,
                    "dep1": dep1,
                    "arr1": arr1,
                    "transit1": transit1,
                    "route2": route2,
                    "vehicle2": v2,
                    "dep2": dep2,
                    "arr2": arr2,
                    "transit2": transit2,
                    "total_travel_time": arr2
                })
    return results

def plan_journey(origin_id: str, destination_id: str) -> JourneyPlanResponse:
    if origin_id not in STOPS_BY_ID or destination_id not in STOPS_BY_ID:
        raise ValueError("Invalid origin or destination stop ID")
        
    directs = find_direct_connections(origin_id, destination_id)
    transfers = find_transfer_connections(origin_id, destination_id)
    
    # Build JourneyCards
    cards: List[JourneyCard] = []
    
    # 1. Fastest Plan: candidate with minimum total arrival time
    candidates = []
    for d in directs:
        candidates.append({
            "type": "direct",
            "total_time": d["arrival_min"],
            "departure": d["departure_min"],
            "arrival": d["arrival_min"],
            "crowd_count": d["vehicle"]["crowd_count"],
            "crowd_level": d["vehicle"]["crowd_level"],
            "data": d
        })
    for t in transfers:
        candidates.append({
            "type": "transfer",
            "total_time": t["total_travel_time"],
            "departure": t["dep1"],
            "arrival": t["arr2"],
            "crowd_count": max(t["vehicle1"]["crowd_count"], t["vehicle2"]["crowd_count"]),
            "crowd_level": t["vehicle1"]["crowd_level"],
            "data": t
        })
        
    if not candidates:
        # Fallback if no network path
        return JourneyPlanResponse(
            origin_stop_id=origin_id,
            destination_stop_id=destination_id,
            plans=[],
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
    # Sort by total travel time
    fastest_cand = sorted(candidates, key=lambda c: c["total_time"])[0]
    
    # Build Fastest card
    fastest_card = _build_card(fastest_cand, "Fastest", origin_id, destination_id)
    cards.append(fastest_card)
    
    # 2. Less Crowded Plan:
    # Filter candidates with lower crowd count than fastest_cand
    less_crowded_candidates = [
        c for c in candidates 
        if c["crowd_count"] < fastest_cand["crowd_count"]
    ]
    
    if less_crowded_candidates:
        # Pick the least crowded, breaking ties by earliest arrival
        best_lc = sorted(less_crowded_candidates, key=lambda c: (c["crowd_count"], c["arrival"]))[0]
        extra_wait = max(1, best_lc["departure"] - fastest_cand["departure"])
        arrival_diff = max(1, best_lc["arrival"] - fastest_cand["arrival"])
        
        diff_note = f"Wait {extra_wait} extra minutes for a less crowded bus. Estimated arrival is {arrival_diff} minutes later."
        lc_card = _build_card(best_lc, "Less Crowded", origin_id, destination_id, diff_note=diff_note)
        cards.append(lc_card)
    else:
        # If fastest is already lowest crowd or only 1 candidate, synthesize alternative timing
        alt_cand = sorted([c for c in candidates if c != fastest_cand], key=lambda c: c["crowd_count"])
        if alt_cand:
            lc_cand = alt_cand[0]
            extra_wait = max(2, lc_cand["departure"] - fastest_cand["departure"])
            arrival_diff = max(2, lc_cand["arrival"] - fastest_cand["arrival"])
            diff_note = f"Wait {extra_wait} extra minutes for an alternative bus. Estimated arrival is {arrival_diff} minutes later."
            cards.append(_build_card(lc_cand, "Less Crowded", origin_id, destination_id, diff_note=diff_note))
        else:
            # Clone with lower crowd recommendation
            cards.append(_build_card(
                fastest_cand, 
                "Less Crowded", 
                origin_id, 
                destination_id, 
                diff_note="Bus currently has optimal passenger capacity on this route."
            ))
            
    # 3. Alternative Plan: transfer or secondary direct option
    remaining = [c for c in candidates if c != fastest_cand]
    if remaining:
        alt_pick = sorted(remaining, key=lambda c: c["total_time"])[0]
        cards.append(_build_card(alt_pick, "Alternative", origin_id, destination_id))
    else:
        cards.append(_build_card(fastest_cand, "Alternative", origin_id, destination_id))

    return JourneyPlanResponse(
        origin_stop_id=origin_id,
        destination_stop_id=destination_id,
        plans=cards,
        timestamp=datetime.now(timezone.utc).isoformat()
    )

def _build_card(
    candidate: Dict[str, Any],
    card_type: str,
    origin_id: str,
    destination_id: str,
    diff_note: Optional[str] = None
) -> JourneyCard:
    c_type = candidate["type"]
    c_data = candidate["data"]
    
    legs: List[JourneyLeg] = []
    
    if c_type == "direct":
        v = c_data["vehicle"]
        r = c_data["route"]
        forecasts = forecast_occupancy_downstream(
            route_id=r["id"],
            from_stop_id=origin_id,
            to_stop_id=destination_id,
            initial_crowd=v["crowd_count"],
            start_departure_minutes=c_data["departure_min"],
            capacity=v["capacity"]
        )
        
        legs.append(JourneyLeg(
            vehicle_id=v["id"],
            vehicle_name=v["display_name"],
            route_id=r["id"],
            route_number=r["route_number"],
            from_stop_id=origin_id,
            from_stop_name=STOPS_BY_ID[origin_id]["short_name"],
            to_stop_id=destination_id,
            to_stop_name=STOPS_BY_ID[destination_id]["short_name"],
            departure_in_minutes=c_data["departure_min"],
            arrival_in_minutes=c_data["arrival_min"],
            transit_duration_minutes=c_data["transit_min"],
            walk_to_stop_minutes=3,
            current_crowd_level=v["crowd_level"],
            current_crowd_count=v["crowd_count"],
            capacity=v["capacity"],
            crowd_source=v["crowd_source"],
            stop_forecasts=forecasts,
            accessibility={
                "wheelchair_accessible": v["wheelchair_accessible"],
                "low_floor": v["low_floor"],
                "ramp_available": v["ramp_available"],
                "audio_announcement": v["audio_announcement"]
            }
        ))
        transfer_count = 0
        summary = f"Direct via {v['display_name']} ({r['route_number']})"
    else:
        # Transfer
        v1 = c_data["vehicle1"]
        r1 = c_data["route1"]
        trans_stop = c_data["transfer_stop_id"]
        
        v2 = c_data["vehicle2"]
        r2 = c_data["route2"]
        
        fc1 = forecast_occupancy_downstream(
            route_id=r1["id"],
            from_stop_id=origin_id,
            to_stop_id=trans_stop,
            initial_crowd=v1["crowd_count"],
            start_departure_minutes=c_data["dep1"],
            capacity=v1["capacity"]
        )
        fc2 = forecast_occupancy_downstream(
            route_id=r2["id"],
            from_stop_id=trans_stop,
            to_stop_id=destination_id,
            initial_crowd=v2["crowd_count"],
            start_departure_minutes=c_data["dep2"],
            capacity=v2["capacity"]
        )
        
        legs.append(JourneyLeg(
            vehicle_id=v1["id"],
            vehicle_name=v1["display_name"],
            route_id=r1["id"],
            route_number=r1["route_number"],
            from_stop_id=origin_id,
            from_stop_name=STOPS_BY_ID[origin_id]["short_name"],
            to_stop_id=trans_stop,
            to_stop_name=STOPS_BY_ID[trans_stop]["short_name"],
            departure_in_minutes=c_data["dep1"],
            arrival_in_minutes=c_data["arr1"],
            transit_duration_minutes=c_data["transit1"],
            walk_to_stop_minutes=3,
            current_crowd_level=v1["crowd_level"],
            current_crowd_count=v1["crowd_count"],
            capacity=v1["capacity"],
            crowd_source=v1["crowd_source"],
            stop_forecasts=fc1,
            accessibility={
                "wheelchair_accessible": v1["wheelchair_accessible"],
                "low_floor": v1["low_floor"],
                "ramp_available": v1["ramp_available"],
                "audio_announcement": v1["audio_announcement"]
            }
        ))
        legs.append(JourneyLeg(
            vehicle_id=v2["id"],
            vehicle_name=v2["display_name"],
            route_id=r2["id"],
            route_number=r2["route_number"],
            from_stop_id=trans_stop,
            from_stop_name=STOPS_BY_ID[trans_stop]["short_name"],
            to_stop_id=destination_id,
            to_stop_name=STOPS_BY_ID[destination_id]["short_name"],
            departure_in_minutes=c_data["dep2"],
            arrival_in_minutes=c_data["arr2"],
            transit_duration_minutes=c_data["transit2"],
            walk_to_stop_minutes=2,
            current_crowd_level=v2["crowd_level"],
            current_crowd_count=v2["crowd_count"],
            capacity=v2["capacity"],
            crowd_source=v2["crowd_source"],
            stop_forecasts=fc2,
            accessibility={
                "wheelchair_accessible": v2["wheelchair_accessible"],
                "low_floor": v2["low_floor"],
                "ramp_available": v2["ramp_available"],
                "audio_announcement": v2["audio_announcement"]
            }
        ))
        transfer_count = 1
        summary = f"1 Transfer at {STOPS_BY_ID[trans_stop]['short_name']} ({v1['display_name']} → {v2['display_name']})"

    return JourneyCard(
        id=f"plan-{card_type.lower()}-{origin_id}-{destination_id}",
        type=card_type,
        total_travel_time_minutes=candidate["total_time"],
        departure_in_minutes=candidate["departure"],
        arrival_in_minutes=candidate["arrival"],
        legs=legs,
        transfer_count=transfer_count,
        overall_crowd_level=candidate["crowd_level"],
        crowd_differential_note=diff_note,
        summary_text=summary
    )
