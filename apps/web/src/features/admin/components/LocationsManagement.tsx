/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Badge } from "../../../shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../shared/ui/dialog";
import { api } from "../../../services/api";
import { AdminCityItem } from "../../../services/api/admin";
import { logger } from "../../../shared/lib/logger";

export function LocationsManagement() {
  const [cities, setCities] = useState<AdminCityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCityId, setExpandedCityId] = useState<number | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<
    "addCity" | "editCity" | "addArea" | "editArea"
  >("addCity");
  const [editName, setEditName] = useState("");
  const [editId, setEditId] = useState(0);
  const [editCityId, setEditCityId] = useState(0);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "city" | "area";
    id: number;
    name: string;
  } | null>(null);

  const fetchCities = async () => {
    try {
      setIsLoading(true);
      const result = await api.admin.getCities();
      setCities(result);
    } catch (error) {
      logger.warn("[LocationsManagement] Failed to fetch cities", error);
      toast.error("Failed to fetch cities");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCities();
  }, []);

  const openDialog = (
    mode: typeof dialogMode,
    name = "",
    id = 0,
    cityId = 0,
  ) => {
    setDialogMode(mode);
    setEditName(name);
    setEditId(id);
    setEditCityId(cityId);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      if (dialogMode === "addCity") {
        await api.admin.createCity(editName.trim());
        toast.success("City created");
      } else if (dialogMode === "editCity") {
        await api.admin.updateCity(editId, editName.trim());
        toast.success("City updated");
      } else if (dialogMode === "addArea") {
        await api.admin.createArea(editCityId, editName.trim());
        toast.success("Area created");
      } else if (dialogMode === "editArea") {
        await api.admin.updateArea(editId, editName.trim());
        toast.success("Area updated");
      }
      setDialogOpen(false);
      await fetchCities();
    } catch (error) {
      logger.warn("[LocationsManagement] Save failed", error);
      toast.error("Save failed");
    }
  };

  const handleDeleteCity = async (cityId: number) => {
    try {
      await api.admin.deleteCity(cityId);
      toast.success("City deleted");
      setDeleteTarget(null);
      await fetchCities();
    } catch (error) {
      logger.warn("[LocationsManagement] Delete city failed", error);
      toast.error("Failed to delete city");
    }
  };

  const handleDeleteArea = async (areaId: number) => {
    try {
      await api.admin.deleteArea(areaId);
      toast.success("Area deleted");
      setDeleteTarget(null);
      await fetchCities();
    } catch (error) {
      logger.warn("[LocationsManagement] Delete area failed", error);
      toast.error("Failed to delete area");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "city") {
      await handleDeleteCity(deleteTarget.id);
    } else if (deleteTarget.type === "area") {
      await handleDeleteArea(deleteTarget.id);
    }
  };

  const dialogTitle = {
    addCity: "Add City",
    editCity: "Edit City",
    addArea: "Add Area",
    editArea: "Edit Area",
  }[dialogMode];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Locations Management
          </h1>
        </div>
        <Button onClick={() => openDialog("addCity")}>
          <Plus className="w-4 h-4 mr-2" /> Add City
        </Button>
      </div>

      {cities.length === 0 ? (
        <div className="rounded-md border border-border p-8 text-center text-muted-foreground">
          No cities found. Add your first city.
        </div>
      ) : (
        <div className="space-y-3">
          {cities.map((city) => {
            const isExpanded = expandedCityId === city.cityID;
            return (
              <div
                key={city.cityID}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    setExpandedCityId(isExpanded ? null : city.cityID)
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={`Toggle areas for ${city.cityName}`}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    setExpandedCityId(isExpanded ? null : city.cityID)
                  }
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-foreground">
                      {city.cityName}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {city.areas.length} areas
                    </Badge>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Add area to ${city.cityName}`}
                      onClick={() => openDialog("addArea", "", 0, city.cityID)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${city.cityName}`}
                      onClick={() =>
                        openDialog("editCity", city.cityName, city.cityID)
                      }
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${city.cityName}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        setDeleteTarget({
                          type: "city",
                          id: city.cityID,
                          name: city.cityName,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20">
                    {city.areas.length === 0 ? (
                      <p className="px-10 py-4 text-sm text-muted-foreground">
                        No areas in this city yet.
                      </p>
                    ) : (
                      city.areas.map((area) => (
                        <div
                          key={area.areaID}
                          className="flex items-center justify-between px-10 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm text-foreground">
                            {area.areaName}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${area.areaName}`}
                              onClick={() =>
                                openDialog(
                                  "editArea",
                                  area.areaName,
                                  area.areaID,
                                  area.cityID,
                                )
                              }
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${area.areaName}`}
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "area",
                                  id: area.areaID,
                                  name: area.areaName,
                                })
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter name..."
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong>?
            {deleteTarget?.type === "city" &&
              " This will also remove all its areas."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
