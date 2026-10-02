import json
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        # Admin connections: set of WebSocket instances
        self.admin_connections: List[WebSocket] = []
        # Customer connections: map of order_id -> list of WebSocket instances
        self.customer_connections: Dict[str, List[WebSocket]] = {}

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.append(websocket)

    def disconnect_admin(self, websocket: WebSocket):
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)

    async def connect_customer(self, order_id: str, websocket: WebSocket):
        await websocket.accept()
        if order_id not in self.customer_connections:
            self.customer_connections[order_id] = []
        self.customer_connections[order_id].append(websocket)

    def disconnect_customer(self, order_id: str, websocket: WebSocket):
        if order_id in self.customer_connections:
            if websocket in self.customer_connections[order_id]:
                self.customer_connections[order_id].remove(websocket)
            if not self.customer_connections[order_id]:
                del self.customer_connections[order_id]

    async def broadcast_to_admin(self, message: dict):
        """Broadcast event to all connected admin dashboards."""
        payload = json.dumps(message)
        disconnected = []
        for connection in self.admin_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect_admin(conn)

    async def notify_customer(self, order_id: str, message: dict):
        """Notify specific customer by order_id."""
        if order_id in self.customer_connections:
            payload = json.dumps(message)
            disconnected = []
            for connection in self.customer_connections[order_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect_customer(order_id, conn)

manager = ConnectionManager()
