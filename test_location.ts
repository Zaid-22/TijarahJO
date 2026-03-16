import { resolveDisplayLocationLabel } from './apps/web/src/features/post-details/postDetailsUtils';

const arabicJordanLabel = "الأردن";

const result1 = resolveDisplayLocationLabel({
  postArea: undefined,
  postLocation: "Jordan", // Typical from backend
  sellerArea: undefined,
  sellerCity: undefined,
  jordanLabel: arabicJordanLabel,
});

console.log("Result 1 (Backend 'Jordan'):", result1);

const result2 = resolveDisplayLocationLabel({
  postArea: undefined,
  postLocation: "Amman", 
  sellerArea: undefined,
  sellerCity: undefined,
  jordanLabel: arabicJordanLabel,
});

console.log("Result 2 (Specific City):", result2);
