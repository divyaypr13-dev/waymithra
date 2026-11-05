import sqlite3
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from .config import DB_PATH

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tickets table (with idempotency_key UNIQUE)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        ticket_id TEXT PRIMARY KEY,
        idempotency_key TEXT UNIQUE NOT NULL,
        vehicle_id TEXT NOT NULL,
        from_stop_id TEXT NOT NULL,
        to_stop_id TEXT NOT NULL,
        passenger_count INTEGER NOT NULL DEFAULT 1,
        fare_paid_inr REAL NOT NULL DEFAULT 20.0,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at_iso TEXT NOT NULL
    )
    """)
    
    # Help / Accessibility requests
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS help_requests (
        receipt_token TEXT PRIMARY KEY,
        stop_id TEXT NOT NULL,
        stop_name TEXT NOT NULL,
        vehicle_id TEXT,
        passenger_name TEXT,
        assistance_type TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'REQUESTED',
        created_at_iso TEXT NOT NULL,
        updated_at_iso TEXT NOT NULL
    )
    """)
    
    # Audit log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp_iso TEXT NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()

# Ticket operations
def create_ticket(
    idempotency_key: str,
    vehicle_id: str,
    from_stop_id: str,
    to_stop_id: str,
    passenger_count: int = 1,
    fare_paid_inr: float = 20.0
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if idempotency_key already exists
    cursor.execute("SELECT * FROM tickets WHERE idempotency_key = ?", (idempotency_key,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return dict(existing)
    
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
        INSERT INTO tickets (ticket_id, idempotency_key, vehicle_id, from_stop_id, to_stop_id, passenger_count, fare_paid_inr, status, created_at_iso)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    """, (ticket_id, idempotency_key, vehicle_id, from_stop_id, to_stop_id, passenger_count, fare_paid_inr, now_iso))
    
    # Audit log
    cursor.execute("""
        INSERT INTO audit_logs (event_type, details, timestamp_iso)
        VALUES (?, ?, ?)
    """, ("TICKET_ISSUED", f"Ticket {ticket_id} issued for vehicle {vehicle_id} ({from_stop_id} -> {to_stop_id})", now_iso))
    
    conn.commit()
    
    cursor.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

def cancel_ticket(ticket_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return None
    
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("UPDATE tickets SET status = 'CANCELLED' WHERE ticket_id = ?", (ticket_id,))
    cursor.execute("""
        INSERT INTO audit_logs (event_type, details, timestamp_iso)
        VALUES (?, ?, ?)
    """, ("TICKET_CANCELLED", f"Ticket {ticket_id} was cancelled", now_iso))
    conn.commit()
    
    cursor.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

def list_tickets(vehicle_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if vehicle_id:
        cursor.execute("SELECT * FROM tickets WHERE vehicle_id = ? ORDER BY created_at_iso DESC", (vehicle_id,))
    else:
        cursor.execute("SELECT * FROM tickets ORDER BY created_at_iso DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_ticket_derived_occupancy(vehicle_id: str) -> int:
    """Calculate active ticket-derived passenger count strictly separate from camera."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT SUM(passenger_count) as total FROM tickets 
        WHERE vehicle_id = ? AND status = 'ACTIVE'
    """, (vehicle_id,))
    row = cursor.fetchone()
    conn.close()
    return int(row["total"] or 0)

# Help Request operations
def create_help_request(
    stop_id: str,
    stop_name: str,
    assistance_type: str,
    vehicle_id: Optional[str] = None,
    passenger_name: Optional[str] = "Passenger",
    notes: Optional[str] = ""
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    receipt_token = f"WM-HELP-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
        INSERT INTO help_requests (receipt_token, stop_id, stop_name, vehicle_id, passenger_name, assistance_type, notes, status, created_at_iso, updated_at_iso)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'REQUESTED', ?, ?)
    """, (receipt_token, stop_id, stop_name, vehicle_id, passenger_name, assistance_type, notes, now_iso, now_iso))
    
    cursor.execute("""
        INSERT INTO audit_logs (event_type, details, timestamp_iso)
        VALUES (?, ?, ?)
    """, ("HELP_REQUESTED", f"Assistance '{assistance_type}' requested at {stop_name} (Token: {receipt_token})", now_iso))
    
    conn.commit()
    cursor.execute("SELECT * FROM help_requests WHERE receipt_token = ?", (receipt_token,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

def update_help_request(receipt_token: str, status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM help_requests WHERE receipt_token = ?", (receipt_token,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return None
    
    now_iso = datetime.now(timezone.utc).isoformat()
    if notes is not None:
        cursor.execute("UPDATE help_requests SET status = ?, notes = ?, updated_at_iso = ? WHERE receipt_token = ?", (status, notes, now_iso, receipt_token))
    else:
        cursor.execute("UPDATE help_requests SET status = ?, updated_at_iso = ? WHERE receipt_token = ?", (status, now_iso, receipt_token))
        
    cursor.execute("""
        INSERT INTO audit_logs (event_type, details, timestamp_iso)
        VALUES (?, ?, ?)
    """, ("HELP_UPDATED", f"Help request {receipt_token} status changed to {status}", now_iso))
    
    conn.commit()
    cursor.execute("SELECT * FROM help_requests WHERE receipt_token = ?", (receipt_token,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

def get_help_request(receipt_token: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM help_requests WHERE receipt_token = ?", (receipt_token,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def list_help_requests() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM help_requests ORDER BY created_at_iso DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def list_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
