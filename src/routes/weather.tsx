import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  Droplets,
  Wind,
  Thermometer,
  Sun,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudSnow,
  CloudSun,
  Snowflake,
  Sprout,
  CloudRain,
  Loader2,
  AlertTriangle,
  Clock,
  Lock,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
} from "recharts";
import { usePremium } from "@/lib/premium";

const REFRESH_MS = 30 * 60 * 1000; // 30 minutes

function severeAlerts(d: WeatherData): string[] {
  const out: string[] = [];
  const severeCodes = new Set([95, 96, 99, 75, 82]);
  for (const day of d.daily.slice(0, 3)) {
    const w = WMO[day.code];
    const dayName = new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: "long",
    });
    if (severeCodes.has(day.code)) {
      out.push(`${w?.label ?? "Severe weather"} expected ${dayName}.`);
    }
    if (day.precip > 50) {
      out.push(`Heavy rainfall may cause local flooding ${dayName} (${day.precip} mm expected).`);
    }
    if (day.tmax > 38) {
      out.push(`Extreme heat expected ${dayName} (${Math.round(day.tmax)}°C).`);
    }
    if (day.tmin < 2) {
      out.push(`Frost risk ${dayName} (${Math.round(day.tmin)}°C).`);
    }
  }
  if (d.current.wind > 50) out.push(`Strong winds now (${Math.round(d.current.wind)} km/h).`);
  return Array.from(new Set(out));
}

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Weather Intelligence — AgriMate" },
      { name: "description", content: "Live, location-based weather and 7-day farming forecast." },
    ],
  }),
  component: WeatherPage,
});

// WMO weather code → label + consistent line icon.
const WMO: Record<number, { label: string; icon: LucideIcon }> = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mainly clear", icon: Sun },
  2: { label: "Partly cloudy", icon: CloudSun },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Fog", icon: CloudFog },
  48: { label: "Rime fog", icon: CloudFog },
  51: { label: "Light drizzle", icon: CloudDrizzle },
  53: { label: "Drizzle", icon: CloudDrizzle },
  55: { label: "Heavy drizzle", icon: CloudRain },
  61: { label: "Light rain", icon: CloudRain },
  63: { label: "Rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  71: { label: "Light snow", icon: CloudSnow },
  73: { label: "Snow", icon: CloudSnow },
  75: { label: "Heavy snow", icon: Snowflake },
  80: { label: "Rain showers", icon: CloudRain },
  81: { label: "Heavy showers", icon: CloudRain },
  82: { label: "Violent showers", icon: CloudLightning },
  95: { label: "Thunderstorm", icon: CloudLightning },
  96: { label: "Thunder + hail", icon: CloudLightning },
  99: { label: "Severe thunder", icon: CloudLightning },
};

type WeatherData = {
  place: string;
  current: {
    temp: number;
    apparent: number;
    humidity: number;
    wind: number;
    code: number;
    precip: number;
  };
  hourly: { time: string; temp: number; precip: number }[];
  daily: {
    date: string;
    tmax: number;
    tmin: number;
    precip: number;
    code: number;
    rainProb: number;
  }[];
};

async function fetchWeather(lat: number, lon: number, place: string): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation` +
    `&hourly=temperature_2m,precipitation` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
    `&timezone=auto&forecast_days=14`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Weather request failed");
  const j = await r.json();

  const now = new Date();
  const hourly = (j.hourly.time as string[])
    .map((t, i) => ({
      time: t,
      temp: j.hourly.temperature_2m[i],
      precip: j.hourly.precipitation[i],
    }))
    .filter((h) => new Date(h.time) >= new Date(now.getTime() - 60 * 60 * 1000))
    .slice(0, 24);

  const daily = (j.daily.time as string[]).map((d, i) => ({
    date: d,
    tmax: j.daily.temperature_2m_max[i],
    tmin: j.daily.temperature_2m_min[i],
    precip: j.daily.precipitation_sum[i],
    code: j.daily.weather_code[i],
    rainProb: j.daily.precipitation_probability_max?.[i] ?? 0,
  }));

  return {
    place,
    current: {
      temp: j.current.temperature_2m,
      apparent: j.current.apparent_temperature,
      humidity: j.current.relative_humidity_2m,
      wind: j.current.wind_speed_10m,
      code: j.current.weather_code,
      precip: j.current.precipitation,
    },
    hourly,
    daily,
  };
}

function farmingTip(d: WeatherData): string {
  const { current, daily } = d;
  const next3Rain = daily.slice(0, 3).reduce((s, x) => s + x.precip, 0);
  if (next3Rain > 20) {
    return "Heavy rain is expected. Check field drainage and consider delaying fertilizer application.";
  }
  if (next3Rain < 2 && current.temp > 28) {
    return "Hot and dry conditions ahead. Irrigate early morning or late evening to reduce evaporation.";
  }
  if (current.wind > 30) {
    return "Windy conditions may affect spraying. Consider postponing pesticide or foliar applications.";
  }
  if (daily[0]?.rainProb > 60) {
    return "Rain is likely today. Check soil conditions before transplanting or irrigating.";
  }
  return "Conditions look suitable for routine field work. Check your crop and soil before acting.";
}

type WeatherStatProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function Stat({ icon: Icon, label, value }: WeatherStatProps) {
  return (
    <Card className="border-white/20 bg-white/10 p-4 text-white shadow-none backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/10 p-2.5">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-white/75">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function WeatherPage() {
  const { isPremium, openUpgrade } = usePremium();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDefault, setUsingDefault] = useState(false);

  const load = useCallback((lat: number, lon: number, isDefault = false) => {
    setLoading(true);
    setError(null);
    setUsingDefault(isDefault);
    setCoords({ lat, lon });
    fetchWeather(lat, lon, isDefault ? "Pretoria, South Africa" : "Current location")
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load weather"))
      .finally(() => setLoading(false));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      load(-25.7479, 28.2293, true); // Pretoria fallback
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude, false),
      () => load(-25.7479, 28.2293, true),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, [load]);

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);
  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    if (!coords) return;
    const id = setInterval(() => load(coords.lat, coords.lon, usingDefault), REFRESH_MS);
    return () => clearInterval(id);
  }, [coords, load, usingDefault]);

  const cur = data?.current;
  const wmo = cur ? (WMO[cur.code] ?? { label: "Unknown conditions", icon: CloudSun }) : null;
  const alerts = data ? severeAlerts(data) : [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 animate-fade-up sm:px-6 lg:py-10">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live weather
              <span className="text-border">·</span>
              <MapPin className="h-3.5 w-3.5" />
              {data?.place ?? "Finding your location…"}
              {usingDefault && <span className="text-xs text-muted-foreground">(default)</span>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Weather intelligence</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Local conditions and forecasts to help plan your farm work.
            </p>
            {now && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {now.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                <span>·</span>
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={requestLocation}
            disabled={loading}
            className="self-start sm:self-auto"
          >
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh weather
          </Button>
        </section>

        {alerts.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/[0.06] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Severe weather alert</p>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {alerts.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/30 bg-destructive/[0.06] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Weather couldn’t be loaded</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={requestLocation}>
                <RefreshCw /> Try again
              </Button>
            </div>
          </Card>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading weather…
          </div>
        )}

        {data && cur && wmo && (
          <>
            <section className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
              <Card
                className="overflow-hidden border-0 p-6 text-white shadow-[var(--shadow-md)] sm:p-8"
                style={{ background: "var(--gradient-hero)" }}
              >
                <div className="grid items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <div className="flex items-center gap-3">
                      <wmo.icon className="h-12 w-12 text-white" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-white/75">Current conditions</p>
                        <p className="mt-1 text-6xl font-bold tracking-tight">
                          {Math.round(cur.temp)}°C
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-lg font-medium">{wmo.label}</p>
                    <p className="mt-1 text-sm text-white/75">
                      Feels like {Math.round(cur.apparent)}°C
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Stat icon={Droplets} label="Humidity" value={`${cur.humidity}%`} />
                    <Stat icon={Wind} label="Wind" value={`${Math.round(cur.wind)} km/h`} />
                    <Stat icon={CloudRain} label="Rain now" value={`${cur.precip} mm`} />
                  </div>
                </div>
              </Card>

              <Card className="flex flex-col justify-between p-5 sm:p-6">
                <div>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Sprout className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold">Farm planning note</p>
                  </div>
                  <p className="mt-4 text-base font-medium leading-7">{farmingTip(data)}</p>
                </div>
                <p className="mt-5 text-xs text-muted-foreground">
                  Use this as a guide and check conditions in your fields before making decisions.
                </p>
              </Card>
            </section>

            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Hourly temperature</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Next 24 hours · °C</p>
                </div>
                <Sun className="h-5 w-5 text-primary" />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.hourly.map((h) => ({
                      t: new Date(h.time).toLocaleTimeString([], { hour: "numeric" }),
                      temp: h.temp,
                    }))}
                  >
                    <defs>
                      <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="t"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      interval={2}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      unit="°"
                      domain={["dataMin - 3", "dataMax + 3"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="temp"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#wt)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Rainfall outlook</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Next 7 days · mm</p>
                </div>
                <CloudRain className="h-5 w-5 text-primary" />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.daily.slice(0, 7).map((d) => ({
                      d: new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, {
                        weekday: "short",
                      }),
                      mm: d.precip,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="mm" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="mm" fill="var(--primary-glow)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    {isPremium ? "14-day outlook" : "7-day outlook"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">High / low · rain chance</p>
                </div>
                {!isPremium && (
                  <button
                    onClick={() => openUpgrade("14-day weather forecast")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300"
                  >
                    <Lock className="h-3 w-3" /> Unlock 14 days
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {data.daily.slice(0, isPremium ? 14 : 7).map((d, idx) => {
                  const w = WMO[d.code] ?? { label: "Unknown", icon: CloudSun };
                  const DayIcon = w.icon;
                  const isLocked = !isPremium && idx >= 7;
                  return (
                    <Card
                      key={d.date}
                      onClick={isLocked ? () => openUpgrade("14-day weather forecast") : undefined}
                      className={`tilt-card relative p-4 text-center ${isLocked ? "cursor-pointer overflow-hidden" : ""}`}
                    >
                      <div className="text-xs text-muted-foreground">
                        {new Date(d.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                        })}
                      </div>
                      <DayIcon className="mx-auto my-3 h-8 w-8 text-primary" aria-hidden="true" />
                      <div className="text-sm font-medium">
                        {Math.round(d.tmax)}° / {Math.round(d.tmin)}°
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{w.label}</div>
                      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-primary">
                        <Droplets className="h-3 w-3" /> {d.rainProb}% chance
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {d.precip} mm expected
                      </div>
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                            <Lock className="h-3 w-3" /> Premium
                          </span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
