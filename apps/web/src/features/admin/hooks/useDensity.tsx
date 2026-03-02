import { useState, createContext, useContext } from "react";

type Density = "comfortable" | "compact";

type DensityContextType = {
  density: Density;
  toggleDensity: () => void;
  tableRowClass: string;
  tableCellClass: string;
};

const DensityContext = createContext<DensityContextType>({
  density: "comfortable",
  toggleDensity: () => {},
  tableRowClass: "py-4",
  tableCellClass: "px-4 py-4",
});

export function useDensity() {
  return useContext(DensityContext);
}

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensity] = useState<Density>(() => {
    try {
      return (
        (localStorage.getItem("admin-density") as Density) || "comfortable"
      );
    } catch {
      return "comfortable";
    }
  });

  const toggleDensity = () => {
    const next = density === "comfortable" ? "compact" : "comfortable";
    setDensity(next);
    try {
      localStorage.setItem("admin-density", next);
    } catch {
      // ignore
    }
  };

  const tableRowClass = density === "compact" ? "py-2" : "py-4";
  const tableCellClass =
    density === "compact" ? "px-3 py-2 text-xs" : "px-4 py-4 text-sm";

  return (
    <DensityContext.Provider
      value={{ density, toggleDensity, tableRowClass, tableCellClass }}
    >
      {children}
    </DensityContext.Provider>
  );
}
