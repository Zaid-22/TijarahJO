function parsePushPayload(eventData) {
  if (!eventData) {
    return {};
  }

  try {
    return eventData.json();
  } catch {
    try {
      return { body: eventData.text() };
    } catch {
      return {};
    }
  }
}

self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event.data);
  const title =
    String(payload.title || payload.Title || payload.notificationTitle || "TijarahJo").trim() ||
    "TijarahJo";
  const body = String(payload.body || payload.Body || payload.message || "").trim();
  const routeUrl = String(payload.routeUrl || payload.RouteUrl || payload.url || "/chat").trim();
  const tag = String(payload.tag || payload.notificationId || "").trim();

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: tag || undefined,
      data: {
        routeUrl: routeUrl || "/chat",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const routeUrl = String(event.notification?.data?.routeUrl || "/chat");
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(routeUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(routeUrl);
      }

      return undefined;
    }),
  );
});
