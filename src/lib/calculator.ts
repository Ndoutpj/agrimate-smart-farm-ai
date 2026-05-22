export type CropKey =
  | "maize" | "wheat" | "tomatoes" | "potatoes" | "spinach"
  | "cabbage" | "beans" | "rice" | "onions" | "carrots";

export type IrrigationKey = "rainfed" | "sprinkler" | "drip" | "flood";
export type SoilKey = "sandy" | "loam" | "clay" | "silt";
export type MethodKey = "manual" | "mechanized" | "mixed";

export interface CropProfile {
  label: string;
  seedKgPerHa: number;     // kg of seed per hectare
  waterMmSeason: number;   // mm of water per season
  fertKgPerHa: number;     // kg fertilizer per ha
  yieldTonPerHa: number;   // tons yield per ha (rainfed loam baseline)
  daysToHarvest: number;
  pricePerTonZar: number;  // farm-gate price (ZAR)
}

export const CROPS: Record<CropKey, CropProfile> = {
  maize:    { label: "Maize",    seedKgPerHa: 25,  waterMmSeason: 550, fertKgPerHa: 300, yieldTonPerHa: 6,   daysToHarvest: 130, pricePerTonZar: 4200 },
  wheat:    { label: "Wheat",    seedKgPerHa: 120, waterMmSeason: 500, fertKgPerHa: 220, yieldTonPerHa: 4,   daysToHarvest: 120, pricePerTonZar: 5200 },
  tomatoes: { label: "Tomatoes", seedKgPerHa: 0.3, waterMmSeason: 700, fertKgPerHa: 450, yieldTonPerHa: 60,  daysToHarvest: 100, pricePerTonZar: 9000 },
  potatoes: { label: "Potatoes", seedKgPerHa: 2000,waterMmSeason: 600, fertKgPerHa: 400, yieldTonPerHa: 35,  daysToHarvest: 110, pricePerTonZar: 6500 },
  spinach:  { label: "Spinach",  seedKgPerHa: 10,  waterMmSeason: 400, fertKgPerHa: 200, yieldTonPerHa: 18,  daysToHarvest: 55,  pricePerTonZar: 12000 },
  cabbage:  { label: "Cabbage",  seedKgPerHa: 0.4, waterMmSeason: 500, fertKgPerHa: 300, yieldTonPerHa: 50,  daysToHarvest: 90,  pricePerTonZar: 5500 },
  beans:    { label: "Beans",    seedKgPerHa: 90,  waterMmSeason: 450, fertKgPerHa: 150, yieldTonPerHa: 2.5, daysToHarvest: 95,  pricePerTonZar: 14000 },
  rice:     { label: "Rice",     seedKgPerHa: 80,  waterMmSeason: 1200,fertKgPerHa: 250, yieldTonPerHa: 5,   daysToHarvest: 140, pricePerTonZar: 7800 },
  onions:   { label: "Onions",   seedKgPerHa: 5,   waterMmSeason: 550, fertKgPerHa: 350, yieldTonPerHa: 40,  daysToHarvest: 120, pricePerTonZar: 7000 },
  carrots:  { label: "Carrots",  seedKgPerHa: 4,   waterMmSeason: 500, fertKgPerHa: 280, yieldTonPerHa: 35,  daysToHarvest: 100, pricePerTonZar: 8500 },
};

const IRRIGATION: Record<IrrigationKey, { water: number; cost: number; label: string }> = {
  rainfed:   { water: 0.0, cost: 0,    label: "Rain-fed" },
  sprinkler: { water: 1.0, cost: 4500, label: "Sprinkler" },
  drip:      { water: 0.6, cost: 7500, label: "Drip" },
  flood:     { water: 1.4, cost: 2200, label: "Flood" },
};

const SOIL: Record<SoilKey, number> = { sandy: 0.85, loam: 1.0, clay: 0.95, silt: 1.05 };
const METHOD: Record<MethodKey, { labor: number; cost: number }> = {
  manual:     { labor: 5,   cost: 1.0 },
  mechanized: { labor: 1.2, cost: 1.4 },
  mixed:      { labor: 2.5, cost: 1.15 },
};

export interface CalcInput {
  crop: CropKey;
  hectares: number;
  irrigation: IrrigationKey;
  soil: SoilKey;
  method: MethodKey;
  density: number; // 0.7 - 1.3
}

export interface CalcResult {
  seedKg: number;
  waterM3: number;
  workers: number;
  fertilizerKg: number;
  irrigationCostZar: number;
  totalBudgetZar: number;
  daysToHarvest: number;
  expectedYieldTon: number;
  estimatedRevenueZar: number;
  estimatedProfitZar: number;
}

export function calculate(input: CalcInput): CalcResult {
  const c = CROPS[input.crop];
  const ir = IRRIGATION[input.irrigation];
  const soilFactor = SOIL[input.soil];
  const m = METHOD[input.method];
  const ha = Math.max(0, input.hectares);
  const d = Math.max(0.7, Math.min(1.3, input.density));

  const seedKg = c.seedKgPerHa * ha * d;
  // 1 mm rainfall over 1 ha = 10 m³
  const waterM3 = c.waterMmSeason * ha * 10 * (ir.water || 0.4); // rainfed still needs supplemental
  const workers = Math.max(1, Math.round(m.labor * ha * d));
  const fertilizerKg = c.fertKgPerHa * ha * d * (2 - soilFactor); // poorer soil = more fert
  const irrigationCostZar = ir.cost * ha;

  const seedCost = seedKg * 35;
  const fertCost = fertilizerKg * 18;
  const laborCost = workers * 4500;
  const totalBudgetZar = (seedCost + fertCost + laborCost + irrigationCostZar) * m.cost;

  const expectedYieldTon = c.yieldTonPerHa * ha * soilFactor * d * (ir.water > 0 ? 1.15 : 0.9);
  const estimatedRevenueZar = expectedYieldTon * c.pricePerTonZar;
  const estimatedProfitZar = estimatedRevenueZar - totalBudgetZar;

  return {
    seedKg, waterM3, workers, fertilizerKg, irrigationCostZar,
    totalBudgetZar, daysToHarvest: c.daysToHarvest,
    expectedYieldTon, estimatedRevenueZar, estimatedProfitZar,
  };
}

export const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);
export const num = (n: number, digits = 0) =>
  new Intl.NumberFormat("en-ZA", { maximumFractionDigits: digits }).format(n);
