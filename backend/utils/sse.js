const clients = new Map(); // userId -> Set of Response objects

/**
 * Register an active SSE client connection
 */
export function addClient(userId, res) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);
}

/**
 * Remove an SSE client connection
 */
export function removeClient(userId, res) {
  if (clients.has(userId)) {
    const userClients = clients.get(userId);
    userClients.delete(res);
    if (userClients.size === 0) {
      clients.delete(userId);
    }
  }
}

/**
 * Send real-time SSE event to all active client tabs for a user
 */
export function sendSSE(userId, event, data) {
  if (clients.has(userId)) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients.get(userId)) {
      try {
        res.write(message);
      } catch (err) {
        console.error(`Error writing SSE to user ${userId}:`, err.message);
      }
    }
  }
}
