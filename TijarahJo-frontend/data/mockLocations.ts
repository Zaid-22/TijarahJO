// Mock Locations Data with Unique IDs
import { Location } from "../types";

export const mockLocations: Location[] = [
  {
    id: "loc_1734600000000_amman",
    name: "Amman",
    city: "Amman",
    country: "Jordan",
    coordinates: {
      lat: 31.9539,
      lng: 35.9106,
    },
  },
  {
    id: "loc_1734600001000_irbid",
    name: "Irbid",
    city: "Irbid",
    country: "Jordan",
    coordinates: {
      lat: 32.5556,
      lng: 35.8500,
    },
  },
  {
    id: "loc_1734600002000_zarqa",
    name: "Zarqa",
    city: "Zarqa",
    country: "Jordan",
    coordinates: {
      lat: 32.0833,
      lng: 36.1000,
    },
  },
  {
    id: "loc_1734600003000_aqaba",
    name: "Aqaba",
    city: "Aqaba",
    country: "Jordan",
    coordinates: {
      lat: 29.5267,
      lng: 35.0067,
    },
  },
  {
    id: "loc_1734600004000_madaba",
    name: "Madaba",
    city: "Madaba",
    country: "Jordan",
    coordinates: {
      lat: 31.7167,
      lng: 35.7833,
    },
  },
  {
    id: "loc_1734600005000_karak",
    name: "Karak",
    city: "Karak",
    country: "Jordan",
    coordinates: {
      lat: 31.1850,
      lng: 35.7047,
    },
  },
  {
    id: "loc_1734600006000_mafraq",
    name: "Mafraq",
    city: "Mafraq",
    country: "Jordan",
    coordinates: {
      lat: 32.3406,
      lng: 36.2081,
    },
  },
  {
    id: "loc_1734600007000_jerash",
    name: "Jerash",
    city: "Jerash",
    country: "Jordan",
    coordinates: {
      lat: 32.2722,
      lng: 35.8914,
    },
  },
  {
    id: "loc_1734600008000_ajloun",
    name: "Ajloun",
    city: "Ajloun",
    country: "Jordan",
    coordinates: {
      lat: 32.3328,
      lng: 35.7517,
    },
  },
  {
    id: "loc_1734600009000_saltcity",
    name: "Salt",
    city: "Salt",
    country: "Jordan",
    coordinates: {
      lat: 32.0392,
      lng: 35.7272,
    },
  },
];

// Helper function to get location by ID
export function getLocationById(id: string): Location | undefined {
  return mockLocations.find(location => location.id === id);
}

// Helper function to get location by name
export function getLocationByName(name: string): Location | undefined {
  return mockLocations.find(
    location => location.name.toLowerCase() === name.toLowerCase()
  );
}

// Helper function to get location ID by name (for backward compatibility)
export function getLocationIdByName(name: string): string | undefined {
  const location = getLocationByName(name);
  return location?.id;
}
