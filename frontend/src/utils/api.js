const API_BASE = '/api';

export async function fetchMenu() {
  const res = await fetch(`${API_BASE}/menu`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}

export async function fetchRecommendations(cartItemNames) {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart_items: cartItemNames })
  });
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export async function createOrder(orderData) {
  const res = await fetch(`${API_BASE}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to place order');
  }
  return res.json();
}

export async function fetchOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`);
  if (!res.ok) throw new Error('Order not found');
  return res.json();
}

export async function fetchAllOrders() {
  const res = await fetch(`${API_BASE}/orders`);
  if (!res.ok) throw new Error('Failed to fetch admin orders');
  return res.json();
}

export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function fetchDemandForecast() {
  const res = await fetch(`${API_BASE}/admin/forecast`);
  if (!res.ok) throw new Error('Failed to fetch demand forecast');
  return res.json();
}

export function connectCustomerWebSocket(orderId, onMessage, onError) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws/customer/${orderId}`;
  
  let socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (e) {
      console.error('WebSocket parse error', e);
    }
  };

  socket.onerror = (err) => {
    if (onError) onError(err);
  };

  return socket;
}

export function connectAdminWebSocket(onMessage, onError) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws/admin`;
  
  let socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (e) {
      console.error('WebSocket parse error', e);
    }
  };

  socket.onerror = (err) => {
    if (onError) onError(err);
  };

  return socket;
}
