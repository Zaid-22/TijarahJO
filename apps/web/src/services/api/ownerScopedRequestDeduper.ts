export function createOwnerScopedRequestDeduper<T>() {
  const inflightByOwner = new Map<string, Promise<T>>();

  return (
    ownerId: string,
    createRequest: () => Promise<T>,
  ): Promise<T> => {
    const ownerKey = String(ownerId || "").trim();
    if (!ownerKey) {
      return createRequest();
    }

    const existingRequest = inflightByOwner.get(ownerKey);
    if (existingRequest) {
      return existingRequest;
    }

    const trackedRequest = createRequest().finally(() => {
      if (inflightByOwner.get(ownerKey) === trackedRequest) {
        inflightByOwner.delete(ownerKey);
      }
    });
    inflightByOwner.set(ownerKey, trackedRequest);
    return trackedRequest;
  };
}
