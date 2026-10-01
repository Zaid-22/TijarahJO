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

function normalizeNotificationRouteUrl(value) {
  try {
    const routeUrl = new URL(String(value || "/chat"), self.location.origin);
    if (routeUrl.origin !== self.location.origin) {
      return "/chat";
    }

    return `${routeUrl.pathname}${routeUrl.search}${routeUrl.hash}` || "/chat";
  } catch {
    return "/chat";
  }
}

self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event.data);
  const title =
    String(payload.title || payload.Title || payload.notificationTitle || "TijarahJo").trim() ||
    "TijarahJo";
  const body = String(payload.body || payload.Body || payload.message || "").trim();
  const routeUrl = normalizeNotificationRouteUrl(
    payload.routeUrl || payload.RouteUrl || payload.url,
  );
  const tag = String(payload.tag || payload.notificationId || "").trim();

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: tag || undefined,
      data: {
        routeUrl,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const routeUrl = normalizeNotificationRouteUrl(
    event.notification?.data?.routeUrl,
  );
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          const navigation =
            "navigate" in client
              ? client.navigate(routeUrl).catch(() => undefined)
              : Promise.resolve();
          return navigation.then(() => client.focus());
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(routeUrl);
      }

      return undefined;
    }),
  );
});
