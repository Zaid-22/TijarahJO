import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { Product, UserProfile } from "../types";
import { isOwnProductForUser } from "./appRoutesUtils";

interface UseProductDetailsRouteDataParams {
  id: string | undefined;
  availableProducts: Product[];
  isLoadingProducts: boolean;
  isAuthenticated: boolean;
  userProfile: UserProfile;
}

export const useProductDetailsRouteData = ({
  id,
  availableProducts,
  isLoadingProducts,
  isAuthenticated,
  userProfile,
}: UseProductDetailsRouteDataParams) => {
  const product = availableProducts.find((item) => item.id === id);
  const [fallbackProduct, setFallbackProduct] = useState<Product | null>(null);
  const [isLoadingFallbackProduct, setIsLoadingFallbackProduct] =
    useState(false);

  useEffect(() => {
    let isCancelled = false;

    setFallbackProduct(null);

    if (!id || isLoadingProducts || product) {
      setIsLoadingFallbackProduct(false);
      return;
    }

    setIsLoadingFallbackProduct(true);

    (async () => {
      try {
        const fetchedProduct = await api.posts.getPost(id);
        if (isCancelled) {
          return;
        }
        setFallbackProduct(fetchedProduct);
      } catch {
        if (!isCancelled) {
          setFallbackProduct(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFallbackProduct(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [id, isLoadingProducts, product]);

  const resolvedProduct = product || fallbackProduct;
  const isLoadingRouteProduct =
    (isLoadingProducts || isLoadingFallbackProduct) && !resolvedProduct;

  const isOwnProduct = useMemo(
    () =>
      resolvedProduct
        ? isOwnProductForUser(resolvedProduct, userProfile, isAuthenticated)
        : false,
    [resolvedProduct, userProfile, isAuthenticated],
  );

  return {
    resolvedProduct,
    isLoadingRouteProduct,
    isOwnProduct,
  };
};
