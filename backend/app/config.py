import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "waymithra.db"

# Secret token for operator preview & admin access
OPERATOR_SECRET = os.getenv("WAYMITHRA_OPERATOR_SECRET", "waymithra-operator-token-blr")

# Simulator configuration
SIMULATION_TICK_SECONDS = 1.0
DEFAULT_BUS_CAPACITY = 6  # 6-passenger demo bus

# Crowd categories for 6-passenger demo bus:
# 0-2: Low
# 3-4: Moderate
# 5-6: High
# >6: High + Exceeded Capacity notice
def get_crowd_level(count: int, capacity: int = DEFAULT_BUS_CAPACITY) -> tuple[str, bool]:
    exceeded = count > capacity
    if count <= 2:
        return "Low", False
    elif count <= 4:
        return "Moderate", False
    else:
        return "High", exceeded
