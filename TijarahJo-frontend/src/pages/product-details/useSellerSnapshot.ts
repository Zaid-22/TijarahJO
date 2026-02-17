import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { normalizeSellerDisplayName } from "../../utils/sellerDisplayName";

export interface SellerSnapshot {
  joinDate: string | null;
  avatar: string | null;
  phone: string | null;
  name: string | null;
  city: string | null;
  area: string | null;
}

const INITIAL_SNAPSHOT: SellerSnapshot = {
  joinDate: null,
  avatar: null,
  phone: null,
  name: null,
  city: null,
  area: null,
};

export function useSellerSnapshot(sellerId: string | number | undefined): SellerSnapshot {
  const normalizedSellerId = String(sellerId || "").trim();
  const [snapshot, setSnapshot] = useState<SellerSnapshot>(INITIAL_SNAPSHOT);

  useEffect(() => {
    let cancelled = false;

    const fetchSellerData = async () => {
      setSnapshot(INITIAL_SNAPSHOT);

      if (!normalizedSellerId) {
        return;
      }

      try {
        const user = await api.users.getUser(normalizedSellerId);
        if (cancelled || !user) {
          return;
        }

        const joinDate = user?.JoinedDate || user?.joinedDate || user?.JoinDate || null;
        const avatar = user?.avatar || null;
        const phone = user?.phone || null;
        let city = user?.city || null;
        let area = user?.area || null;
        const firstName = user?.FirstName || user?.firstName || "";
        const lastName = user?.LastName || user?.lastName || "";
        const fullName = user?.name || `${firstName} ${lastName}`.trim();
        const email = user?.Email || user?.email || "";

        const normalizedName =
          fullName || email
            ? normalizeSellerDisplayName(fullName || email, normalizedSellerId)
            : null;

        if (!city && !area) {
          try {
            const sellerProfileResponse = await api.sellers.getSellerProfile(normalizedSellerId);
            const sellerProfile = sellerProfileResponse?.seller;
            city = sellerProfile?.city || city;
            area = sellerProfile?.area || area;
          } catch {
            // Keep fallback behavior when profile endpoint fails.
          }
        }

        if (!cancelled) {
          setSnapshot({
            joinDate,
            avatar,
            phone,
            name: normalizedName,
            city: city ? String(city) : null,
            area: area ? String(area) : null,
          });
        }
      } catch {
        if (!cancelled) {
          setSnapshot(INITIAL_SNAPSHOT);
        }
      }
    };

    void fetchSellerData();

    return () => {
      cancelled = true;
    };
  }, [normalizedSellerId]);

  return snapshot;
}
