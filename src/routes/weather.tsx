import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { MapPin, Droplets, Wind, Thermometer, Sun, CloudRain, Loader2, AlertTriangle, Clock } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  Bar, BarChart,
} from "recharts";

const REFRESH_MS = 30 * 60 * 1000; // 30 minutes

function severeAlerts(d: WeatherData): string[] {
  const out: string[] = [];
  const severeCodes = new Set([95, 96, 99, 75, 82]);
  for (const day of d.daily.slice(0, 3)) {
    const w = WMO[day.code];
    if (severeCodes.has(day.code)) out.push(`${w?.emoji ?? "⚠️"} ${w?.label ?? "Severe weather"} expected on ${new Date(day.date).toLocaleDateString(undefined, { weekday: "long" })}.`);
    if (day.precip > 50) out.push(`🌊 Flood risk on ${new Date(day.date).toLocaleDateString(undefined, { weekday: "long" })} (${day.precip}mm rain).`);
    if (day.tmax > 38) out.push(`🔥 Extreme heat on ${new Date(day.date).toLocaleDateString(undefined, { weekday: "long" })} (${Math.round(day.tmax)}°C).`);
    if (day.tmin < 2) out.push(`❄️ Frost risk on ${new Date(day.date).toLocaleDateString(undefined, { weekday: "long" })} (${Math.round(day.tmin)}°C).`);
  }
  if (d.current.wind > 50) out.push(`💨 Strong winds right now (${Math.round(d.current.wind)} km/h).`);
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

// WMO weather code → label + emoji
const WMO: Record<number, { label: string; emoji: string }> = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mainly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Fog", emoji: "🌫️" },
  48: { label: "Rime fog", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  61: { label: "Light rain", emoji: "🌧️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "🌧️" },
  71: { label: "Light snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "🌨️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  80: { label: "Rain showers", emoji: "🌦️" },
  81: { label: "Heavy showers", emoji: "🌧️" },
  82: { label: "Violent showers", emoji: "⛈️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunder + hail", emoji: "⛈️" },
  99: { label: "Severe thunder", emoji: "⛈️" },
};

type WeatherData = {
  place: string;
  current: {
    temp: number; apparent: number; humidity: number; wind: number; code: number; precip: number;
  };
  hourly: { time: string; temp: number; precip: number }[];
  daily: { date: string; tmax: number; tmin: number; precip: number; code: number; rainProb: number }[];
};

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`);
    const j = await r.json();
    const x = j?.results?.[0];
    if (x) return [x.name, x.admin1, x.country].filter(Boolean).join(", ");
  } catch {}
  return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation` +
    `&hourly=temperature_2m,precipitation` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
    `&timezone=auto&forecast_days=7`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Weather request failed");
  const j = await r.json();
  const place = await reverseGeocode(lat, lon);

  const now = new Date();
  const hourly = (j.hourly.time as string[])
    .map((t, i) => ({ time: t, temp: j.hourly.temperature_2m[i], precip: j.hourly.precipitation[i] }))
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
  if (next3Rain > 20) return "🌧️ Heavy rain expected — delay fertilizer application and check drainage.";
  if (next3Rain < 2 && current.temp > 28) return "☀️ Hot & dry — irrigate early morning or late evening to reduce evaporation.";
  if (current.wind > 30) return "💨 Strong winds — postpone spraying pesticides or foliar feeds.";
  if (daily[0]?.rainProb > 60) return "☔ Rain likely today — perfect for transplanting seedlings.";
  return "🌱 Conditions are favourable for routine field work.";
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <Card className="tilt-card p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function WeatherPage() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDefault, setUsingDefault] = useState(false);

  const load = (lat: number, lon: number, isDefault = false) => {
    setLoading(true);
    setError(null);
    setUsingDefault(isDefault);
    fetchWeather(lat, lon)
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load weather"))
      .finally(() => setLoading(false));
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      load(-25.7479, 28.2293, true); // Pretoria fallback
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude, false),
      () => load(-25.7479, 28.2293, true),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  const cur = data?.current;
  const wmo = cur ? WMO[cur.code] ?? { label: "—", emoji: "🌡️" } : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-soft)]" />
        <div className="absolute -top-20 -right-20 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="mx-auto max-w-6xl px-4 py-10 animate-fade-up">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {data?.place ?? "Locating…"}
                {usingDefault && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px]">default location</span>}
              </p>
              <h1 className="text-3xl font-bold md:text-4xl">Weather Intelligence</h1>
              <p className="mt-1 text-muted-foreground">Live conditions and 7-day forecast for your farm.</p>
            </div>
            <Button variant="outline" size="sm" onClick={requestLocation} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Use my location
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {error && (
          <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
            {error}. <button className="underline" onClick={requestLocation}>Retry</button>
          </Card>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading weather…
          </div>
        )}

        {data && cur && wmo && (
          <>
            <Card className="tilt-card overflow-hidden p-6">
              <div className="grid items-center gap-6 md:grid-cols-2">
                <div>
                  <div className="text-6xl">{wmo.emoji}</div>
                  <div className="mt-2 text-5xl font-bold">{Math.round(cur.temp)}°C</div>
                  <div className="text-muted-foreground">{wmo.label} · feels {Math.round(cur.apparent)}°C</div>
                  <div className="mt-4 rounded-xl bg-primary/5 p-3 text-sm text-foreground/80">
                    {farmingTip(data)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Stat icon={Droplets} label="Humidity" value={`${cur.humidity}%`} />
                  <Stat icon={Wind} label="Wind" value={`${Math.round(cur.wind)} km/h`} />
                  <Stat icon={CloudRain} label="Precip now" value={`${cur.precip} mm`} />
                  <Stat icon={Thermometer} label="Feels like" value={`${Math.round(cur.apparent)}°C`} />
                </div>
              </div>
            </Card>

            <Card className="tilt-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Next 24 hours — temperature</h2>
                <Sun className="h-4 w-4 text-primary" />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.hourly.map(h => ({ t: new Date(h.time).getHours() + "h", temp: h.temp }))}>
                    <defs>
                      <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} interval={2} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="°" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                    <Area type="monotone" dataKey="temp" stroke="var(--primary)" strokeWidth={2} fill="url(#wt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="tilt-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Rain forecast (mm, 7 days)</h2>
                <CloudRain className="h-4 w-4 text-primary" />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily.map(d => ({
                    d: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
                    mm: d.precip,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="mm" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                    <Bar dataKey="mm" fill="var(--primary-glow)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div>
              <h2 className="mb-3 font-semibold">7-day outlook</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {data.daily.map((d) => {
                  const w = WMO[d.code] ?? { label: "—", emoji: "🌡️" };
                  return (
                    <Card key={d.date} className="tilt-card p-4 text-center">
                      <div className="text-xs text-muted-foreground">
                        {new Date(d.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                      </div>
                      <div className="my-2 text-3xl">{w.emoji}</div>
                      <div className="text-sm font-medium">{Math.round(d.tmax)}° / {Math.round(d.tmin)}°</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{w.label}</div>
                      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-primary">
                        <Droplets className="h-3 w-3" /> {d.rainProb}% · {d.precip}mm
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
