"""
Synthetic Bengaluru Bus Network
Landmarks, routes, and vehicle definitions.
"""
from typing import Dict, List, Any

# 14 Landmark stops in Bengaluru
LANDMARK_STOPS: List[Dict[str, Any]] = [
    {
        "id": "BLR-STOP-01",
        "name": "Majestic (Kempegowda Bus Station)",
        "short_name": "Majestic",
        "lat": 12.9767,
        "lng": 77.5713,
        "landmark": "City Railway Station & Central Metro Interchange",
        "facilities": ["Wheelchair Ramp", "Tactile Paving", "Braille Board", "Audio Announcement"]
    },
    {
        "id": "BLR-STOP-02",
        "name": "MG Road Metro / Trinity",
        "short_name": "MG Road",
        "lat": 12.9756,
        "lng": 77.6097,
        "landmark": "Brigade Road & Metro Purple Line",
        "facilities": ["Wheelchair Ramp", "Elevator to Metro", "Audio Announcement"]
    },
    {
        "id": "BLR-STOP-03",
        "name": "Shivajinagar Bus Station",
        "short_name": "Shivajinagar",
        "lat": 12.9856,
        "lng": 77.6050,
        "landmark": "Russell Market & Commercial Street",
        "facilities": ["Sheltered Seating", "Braille Map"]
    },
    {
        "id": "BLR-STOP-04",
        "name": "SJBIT College (Kengeri)",
        "short_name": "SJBIT College",
        "lat": 12.9015,
        "lng": 77.5028,
        "landmark": "BGS Health City, Uttarahalli-Kengeri Main Rd",
        "facilities": ["Accessible Boarding Curb", "Audio Announcement"]
    },
    {
        "id": "BLR-STOP-05",
        "name": "Silk Board Junction",
        "short_name": "Silk Board",
        "lat": 12.9175,
        "lng": 77.6238,
        "landmark": "Hosur Road & Outer Ring Road flyover junction",
        "facilities": ["Pedestrian Skywalk", "Wheelchair Ramp"]
    },
    {
        "id": "BLR-STOP-06",
        "name": "Koramangala Sony World Signal",
        "short_name": "Koramangala",
        "lat": 12.9352,
        "lng": 77.6245,
        "landmark": "80ft Road & 100ft Road cross",
        "facilities": ["Wheelchair Curb", "Audio Announcement"]
    },
    {
        "id": "BLR-STOP-07",
        "name": "Indiranagar 100ft Road",
        "short_name": "Indiranagar",
        "lat": 12.9719,
        "lng": 77.6412,
        "landmark": "12th Main food & shopping high street",
        "facilities": ["Tactile Paving", "Audio Announcement"]
    },
    {
        "id": "BLR-STOP-08",
        "name": "Electronic City Phase 1",
        "short_name": "Electronic City",
        "lat": 12.8452,
        "lng": 77.6602,
        "landmark": "Elevated Tollway & Tech Park Gate",
        "facilities": ["Sheltered Terminal", "Ramp Access"]
    },
    {
        "id": "BLR-STOP-09",
        "name": "Banashankari TTMC",
        "short_name": "Banashankari",
        "lat": 12.9155,
        "lng": 77.5736,
        "landmark": "Kanpur Road & Green Line Metro",
        "facilities": ["Wheelchair Ramp", "Tactile Paving", "Audio Announcement"]
    },
    {
        "id": "BLR-STOP-10",
        "name": "Malleshwaram 8th Cross",
        "short_name": "Malleshwaram",
        "lat": 13.0031,
        "lng": 77.5701,
        "landmark": "Sampige Road Market",
        "facilities": ["Braille Signage", "Low-floor Curb"]
    },
    {
        "id": "BLR-STOP-11",
        "name": "Rajajinagar 1st Block",
        "short_name": "Rajajinagar",
        "lat": 13.0084,
        "lng": 77.5552,
        "landmark": "Navrang Circle & Orion Mall nearby",
        "facilities": ["Accessible Boarding", "Audio Announcement"]
    },
    {
        "id": "BLR-STOP-12",
        "name": "Jayanagar 4th Block Complex",
        "short_name": "Jayanagar",
        "lat": 12.9299,
        "lng": 77.5824,
        "landmark": "Shopping Complex & Bus Stand",
        "facilities": ["Tactile Paving", "Wheelchair Ramp"]
    },
    {
        "id": "BLR-STOP-13",
        "name": "Whitefield TTMC",
        "short_name": "Whitefield",
        "lat": 12.9698,
        "lng": 77.7499,
        "landmark": "ITPL & Kadugodi Metro",
        "facilities": ["Modern Terminal", "Wheelchair Access", "Audio Announcement"]
    },
    {
        "id": "BLR-STOP-14",
        "name": "Hebbal Flyover",
        "short_name": "Hebbal",
        "lat": 13.0358,
        "lng": 77.5970,
        "landmark": "Airport Expressway junction & Hebbal Lake",
        "facilities": ["Skywalk Ramp", "Audio Announcement"]
    }
]

# 3 Routes
ROUTES: List[Dict[str, Any]] = [
    {
        "id": "WM-1",
        "route_number": "404",
        "name": "Route 404: MG Road ↔ SJBIT College via Majestic",
        "color": "#00A896", # Teal
        "stops": [
            "BLR-STOP-02", # MG Road
            "BLR-STOP-03", # Shivajinagar
            "BLR-STOP-01", # Majestic
            "BLR-STOP-10", # Malleshwaram
            "BLR-STOP-11", # Rajajinagar
            "BLR-STOP-04"  # SJBIT College
        ],
        # Approximate distance in km between successive stops
        "leg_distances_km": [2.1, 3.4, 3.8, 2.0, 12.5],
        "leg_standard_minutes": [7, 10, 11, 6, 25]
    },
    {
        "id": "WM-2",
        "route_number": "210",
        "name": "Route 210: Banashankari ↔ Majestic via Koramangala",
        "color": "#FFB703", # Amber/Yellow
        "stops": [
            "BLR-STOP-09", # Banashankari
            "BLR-STOP-12", # Jayanagar
            "BLR-STOP-05", # Silk Board
            "BLR-STOP-06", # Koramangala
            "BLR-STOP-02", # MG Road
            "BLR-STOP-01"  # Majestic
        ],
        "leg_distances_km": [2.6, 4.3, 2.4, 5.1, 4.2],
        "leg_standard_minutes": [8, 14, 8, 16, 12]
    },
    {
        "id": "WM-3",
        "route_number": "175",
        "name": "Route 175: Electronic City ↔ Hebbal via Indiranagar",
        "color": "#02C39A", # Vibrant Mint
        "stops": [
            "BLR-STOP-08", # Electronic City
            "BLR-STOP-05", # Silk Board
            "BLR-STOP-07", # Indiranagar
            "BLR-STOP-03", # Shivajinagar
            "BLR-STOP-14"  # Hebbal
        ],
        "leg_distances_km": [11.2, 7.8, 4.5, 7.2],
        "leg_standard_minutes": [22, 19, 13, 18]
    }
]

# 6 Vehicles
VEHICLES: List[Dict[str, Any]] = [
    {
        "id": "WM-V1",
        "vehicle_number": "KA-01-F-4040",
        "display_name": "Bus 404",
        "route_id": "WM-1",
        "is_demo_bus": True,
        "demo_name": "DEMO-BUS-A",
        "capacity": 6,
        "wheelchair_accessible": True,
        "low_floor": True,
        "ramp_available": True,
        "audio_announcement": True,
        "camera_feed_enabled": True
    },
    {
        "id": "WM-V2",
        "vehicle_number": "KA-01-F-2101",
        "display_name": "Bus 210",
        "route_id": "WM-2",
        "is_demo_bus": False,
        "demo_name": None,
        "capacity": 6,
        "wheelchair_accessible": True,
        "low_floor": False,
        "ramp_available": False,
        "audio_announcement": True,
        "camera_feed_enabled": False
    },
    {
        "id": "WM-V3",
        "vehicle_number": "KA-01-F-1750",
        "display_name": "Bus 175",
        "route_id": "WM-3",
        "is_demo_bus": False,
        "demo_name": None,
        "capacity": 6,
        "wheelchair_accessible": False,
        "low_floor": False,
        "ramp_available": False,
        "audio_announcement": True,
        "camera_feed_enabled": False
    },
    {
        "id": "WM-V4",
        "vehicle_number": "KA-01-F-3022",
        "display_name": "Bus 302",
        "route_id": "WM-2",
        "is_demo_bus": False,
        "demo_name": None,
        "capacity": 6,
        "wheelchair_accessible": True,
        "low_floor": True,
        "ramp_available": True,
        "audio_announcement": True,
        "camera_feed_enabled": False
    },
    {
        "id": "WM-V5",
        "vehicle_number": "KA-01-F-4049",
        "display_name": "Bus 404B",
        "route_id": "WM-1",
        "is_demo_bus": False,
        "demo_name": None,
        "capacity": 6,
        "wheelchair_accessible": True,
        "low_floor": False,
        "ramp_available": True,
        "audio_announcement": False,
        "camera_feed_enabled": False
    },
    {
        "id": "WM-V6",
        "vehicle_number": "KA-01-F-1759",
        "display_name": "Bus 175B",
        "route_id": "WM-3",
        "is_demo_bus": False,
        "demo_name": None,
        "capacity": 6,
        "wheelchair_accessible": False,
        "low_floor": False,
        "ramp_available": False,
        "audio_announcement": True,
        "camera_feed_enabled": False
    }
]

# Stops map for quick lookup
STOPS_BY_ID = {s["id"]: s for s in LANDMARK_STOPS}
ROUTES_BY_ID = {r["id"]: r for r in ROUTES}
