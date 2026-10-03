import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sprout,
  CloudSun,
  CloudRain,
  Droplets,
  Wind,
  Thermometer,
  Bug,
  Calculator,
  Leaf,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MapPin,
  Package,
  Plus,
  ShoppingBag,
  Store,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgriMate" },
      {
        name: "description",
        content: "Your AgriMate overview for crops, daily tasks, orders and service bookings.",
      },
    ],
  }),
  component: Dashboard,
});

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good evening";
}

type FarmCrop = {
  id: string;
  crop: string;
  field_name: string | null;
  hectares: number;
  status: string;
  expected_harvest_date: string | null;
};

type FarmTask = { id: string; title: string; priority: string; due_at: string | null };
type ActivityItem = { id: string; status: string; created_at: string; start_date?: string };

const statusStyles: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  growing: "bg-primary/10 text-primary",
  harvested: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  fallow: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  accepted: "bg-primary/10 text-primary",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  declined: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function shortDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [crops, setCrops] = useState<FarmCrop[]>([]);
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [taskCount, setTaskCount] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityCount, setActivityCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const accountType = profile?.account_type ?? "farmer";
  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ??
    user?.user_metadata?.full_name?.trim().split(/\s+/)[0] ??
    "there";
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!user || profileLoading) return;
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setCrops([]);
      setTasks([]);
      setTaskCount(0);
      setActivity([]);
      setActivityCount(0);
      setPendingCount(0);
      try {
        if (accountType === "farmer") {
          const [cropResult, taskResult, taskCountResult] = await Promise.all([
            supabase
              .from("farm_crops")
              .select("id,crop,field_name,hectares,status,expected_harvest_date")
              .eq("user_id", user.id)
              .order("expected_harvest_date", { ascending: true, nullsFirst: false }),
            supabase
              .from("tasks")
              .select("id,title,priority,due_at")
              .eq("user_id", user.id)
              .eq("task_date", today)
              .eq("completed", false)
              .order("priority", { ascending: false })
              .limit(4),
            supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("task_date", today)
              .eq("completed", false),
          ]);
          if (cropResult.error) throw cropResult.error;
          if (taskResult.error) throw taskResult.error;
          if (taskCountResult.error) throw taskCountResult.error;
          if (active) {
            setCrops((cropResult.data ?? []) as FarmCrop[]);
            setTasks((taskResult.data ?? []) as FarmTask[]);
            setTaskCount(taskCountResult.count ?? 0);
          }
        } else if (accountType === "buyer") {
          const [recent, total, pending] = await Promise.all([
            supabase
              .from("orders")
              .select("id,status,created_at")
              .eq("buyer_id", user.id)
              .order("created_at", { ascending: false })
              .limit(5),
            supabase
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("buyer_id", user.id),
            supabase
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("buyer_id", user.id)
              .eq("status", "pending"),
          ]);
          if (recent.error) throw recent.error;
          if (total.error) throw total.error;
          if (pending.error) throw pending.error;
          if (active) {
            setActivity((recent.data ?? []) as ActivityItem[]);
            setActivityCount(total.count ?? 0);
            setPendingCount(pending.count ?? 0);
          }
        } else {
          const [recent, upcoming, pending] = await Promise.all([
            supabase
              .from("bookings")
              .select("id,status,created_at,start_date")
              .eq("provider_id", user.id)
              .gte("start_date", today)
              .order("start_date", { ascending: true })
              .limit(5),
            supabase
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("provider_id", user.id)
              .gte("start_date", today),
            supabase
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("provider_id", user.id)
              .eq("status", "pending"),
          ]);
          if (recent.error) throw recent.error;
          if (upcoming.error) throw upcoming.error;
          if (pending.error) throw pending.error;
          if (active) {
            setActivity((recent.data ?? []) as ActivityItem[]);
            setActivityCount(upcoming.count ?? 0);
            setPendingCount(pending.count ?? 0);
          }
        }
      } catch (error) {
        if (active) {
          toast.error("We couldn’t load your dashboard", {
            description: error instanceof Error ? error.message : "Please try again shortly.",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [accountType, profileLoading, today, user]);

  const totalHectares = crops.reduce((sum, crop) => sum + Number(crop.hectares || 0), 0);
  const primaryAction =
    accountType === "buyer"
      ? { to: "/browse" as const, label: "Browse produce", icon: ShoppingBag }
      : accountType === "service_provider"
        ? { to: "/services" as const, label: "Manage services", icon: Store }
        : { to: "/my-farm" as const, label: "Add a crop", icon: Plus };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 animate-fade-up sm:px-6 sm:py-8 lg:space-y-8 lg:py-10">
        <section className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-[var(--gradient-soft)] p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              {timeGreeting()}, {firstName}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {accountType === "buyer"
                ? "Your marketplace"
                : accountType === "service_provider"
                  ? "Your services"
                  : "Your farm, in focus"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              {accountType === "buyer"
                ? "Keep up with your produce orders and find your next local supplier."
                : accountType === "service_provider"
                  ? "Stay on top of bookings and keep your services moving."
                  : "A simple overview of your crops and the work planned for today."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {accountType === "farmer" && (
              <Link to="/tasks">
                <Button variant="outline">
                  <ClipboardList /> Today’s tasks
                </Button>
              </Link>
            )}
            <Link to={primaryAction.to}>
              <Button>
                <primaryAction.icon /> {primaryAction.label}
              </Button>
            </Link>
          </div>
        </section>

        {loading || profileLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading your overview…
          </div>
        ) : accountType === "farmer" ? (
          <>
            <section aria-label="Farm summary" className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">Farm snapshot</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Your crops and work planned for today.
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <SummaryCard icon={Leaf} label="Crops tracked" value={String(crops.length)} />
                <SummaryCard
                  icon={MapPin}
                  label="Area tracked"
                  value={`${totalHectares.toFixed(1)} ha`}
                />
                <SummaryCard
                  icon={ClipboardList}
                  label="Tasks for today"
                  value={String(taskCount)}
                />
              </div>
            </section>

            <DashboardWeather />

            <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
              <Card className="p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Crop overview</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your current plantings and planned harvests.
                    </p>
                  </div>
                  <Link
                    to="/my-farm"
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                {crops.length === 0 ? (
                  <EmptyState
                    icon={Sprout}
                    title="Start with your first crop"
                    text="Add a crop to keep planting and harvest details together."
                    to="/my-farm"
                    action="Add a crop"
                  />
                ) : (
                  <div className="divide-y divide-border/70">
                    {crops.slice(0, 5).map((crop) => (
                      <div
                        key={crop.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Sprout className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{crop.crop}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {crop.field_name || "Field not named"} ·{" "}
                              {Number(crop.hectares || 0).toFixed(1)} ha
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[crop.status] ?? statusStyles.planned}`}
                          >
                            {statusLabel(crop.status)}
                          </span>
                          {crop.expected_harvest_date && (
                            <span className="text-[11px] text-muted-foreground">
                              Harvest {shortDate(crop.expected_harvest_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Today’s tasks</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your open priorities for today.
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {taskCount} open
                  </span>
                </div>
                {tasks.length === 0 ? (
                  <div className="rounded-2xl bg-muted/50 p-5 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
                    <p className="mt-3 font-medium">You’re all caught up</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add a task whenever something needs attention.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {tasks.slice(0, 4).map((task) => (
                      <li key={task.id} className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                            {task.priority} priority
                            {task.due_at &&
                              ` · ${new Date(task.due_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/tasks"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open task list <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>
            </section>

            <section aria-label="Farm tools" className="grid gap-3 sm:grid-cols-2">
              <ToolLink
                to="/crop-doctor"
                icon={Bug}
                title="Crop Doctor"
                text="Get help identifying crop issues."
              />
              <ToolLink
                to="/calculator"
                icon={Calculator}
                title="Farm calculator"
                text="Estimate crop inputs and costs."
              />
            </section>
          </>
        ) : (
          <>
            <section aria-label="Account summary" className="grid gap-3 sm:grid-cols-2">
              <SummaryCard
                icon={accountType === "buyer" ? ShoppingBag : CalendarDays}
                label={accountType === "buyer" ? "Total orders" : "Upcoming bookings"}
                value={String(activityCount)}
              />
              <SummaryCard
                icon={ClipboardList}
                label={accountType === "buyer" ? "Awaiting confirmation" : "Pending requests"}
                value={String(pendingCount)}
              />
            </section>
            <Card className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {accountType === "buyer" ? "Recent orders" : "Bookings"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {accountType === "buyer"
                      ? "Track the status of your produce orders."
                      : "Review upcoming work and booking requests."}
                  </p>
                </div>
                <Link
                  to={accountType === "buyer" ? "/orders" : "/bookings"}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {activity.length === 0 ? (
                <EmptyState
                  icon={accountType === "buyer" ? Package : CalendarDays}
                  title={accountType === "buyer" ? "No orders yet" : "No bookings yet"}
                  text={
                    accountType === "buyer"
                      ? "Browse produce from local farms to place your first order."
                      : "New booking requests will appear here."
                  }
                  to={accountType === "buyer" ? "/browse" : "/services"}
                  action={accountType === "buyer" ? "Browse produce" : "Manage services"}
                />
              ) : (
                <div className="divide-y divide-border/70">
                  {activity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {accountType === "buyer" ? "Produce order" : "Service booking"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {accountType === "buyer" || !item.start_date
                            ? `Placed ${shortDate(item.created_at.slice(0, 10))}`
                            : `Starts ${shortDate(item.start_date)}`}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status] ?? statusStyles.pending}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <section aria-label="Account tools" className="grid gap-3 sm:grid-cols-2">
              {accountType === "buyer" ? (
                <ToolLink
                  to="/browse"
                  icon={ShoppingBag}
                  title="Browse produce"
                  text="Find fresh produce from local farms."
                />
              ) : (
                <ToolLink
                  to="/services"
                  icon={Store}
                  title="Your services"
                  text="Keep your service listings up to date."
                />
              )}
              <ToolLink
                to={accountType === "buyer" ? "/orders" : "/earnings"}
                icon={accountType === "buyer" ? Package : ClipboardList}
                title={accountType === "buyer" ? "Order history" : "Earnings"}
                text={
                  accountType === "buyer"
                    ? "Review your purchases and order updates."
                    : "Review income from completed bookings."
                }
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sprout;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-11 sm:w-11 sm:rounded-xl">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold tracking-tight sm:text-2xl">{value}</p>
        <p className="text-[11px] leading-tight text-muted-foreground sm:text-sm">{label}</p>
      </div>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  to,
  action,
}: {
  icon: typeof Sprout;
  title: string;
  text: string;
  to: "/my-farm" | "/browse" | "/services";
  action: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      <Link to={to} className="mt-4 inline-block">
        <Button size="sm">{action}</Button>
      </Link>
    </div>
  );
}

function ToolLink({
  to,
  icon: Icon,
  title,
  text,
}: {
  to:
    | "/weather"
    | "/crop-doctor"
    | "/calculator"
    | "/browse"
    | "/services"
    | "/orders"
    | "/earnings";
  icon: typeof Sprout;
  title: string;
  text: string;
}) {
  return (
    <Link to={to}>
      <Card className="group flex h-full items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{text}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </Card>
    </Link>
  );
}

type WeatherSnapshot = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  rain: number;
  rainChance: number;
  code: number;
};

function weatherCondition(code: number) {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 67) return "Drizzle and rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorms";
  return "Changing conditions";
}

function DashboardWeather() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const getWeather = () => {
    if (!navigator.geolocation) {
      setError("Location services aren’t available in this browser.");
      return;
    }

    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const query = new URLSearchParams({
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            current:
              "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
            daily: "precipitation_sum,precipitation_probability_max",
            forecast_days: "1",
            timezone: "auto",
          });
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
          if (!response.ok) throw new Error("Weather service is temporarily unavailable.");
          const result = (await response.json()) as {
            current: {
              temperature_2m: number;
              apparent_temperature: number;
              relative_humidity_2m: number;
              wind_speed_10m: number;
              weather_code: number;
            };
            daily: { precipitation_sum: number[]; precipitation_probability_max: number[] };
          };
          setWeather({
            temperature: result.current.temperature_2m,
            feelsLike: result.current.apparent_temperature,
            humidity: result.current.relative_humidity_2m,
            wind: result.current.wind_speed_10m,
            code: result.current.weather_code,
            rain: result.daily.precipitation_sum[0] ?? 0,
            rainChance: result.daily.precipitation_probability_max[0] ?? 0,
          });
          setUpdatedAt(new Date());
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not load local weather.");
        } finally {
          setLoading(false);
        }
      },
      (positionError) => {
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? "Allow location access to see your local forecast."
            : "Couldn’t determine your location. Try again or open Weather for more options.",
        );
        setLoading(false);
      },
      { timeout: 10_000, maximumAge: 10 * 60 * 1000 },
    );
  };

  const WeatherIcon = weather
    ? weather.code === 0
      ? CloudSun
      : weather.code >= 51
        ? CloudRain
        : CloudSun
    : CloudSun;

  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-sky-500/[0.06] p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <WeatherIcon className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Field weather</h2>
              {weather && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  Live local forecast
                </span>
              )}
            </div>
            {weather ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  {weatherCondition(weather.code)} · feels like {Math.round(weather.feelsLike)}°C
                </p>
                {updatedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated{" "}
                    {updatedAt.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Share your location to see local conditions and plan today’s field work.
              </p>
            )}
            {error && (
              <p role="status" className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={getWeather} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {weather ? "Refresh" : "Use my location"}
          </Button>
          <Link to="/weather">
            <Button>
              Full forecast <ArrowRight />
            </Button>
          </Link>
        </div>
      </div>

      {weather && (
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/70 pt-5 sm:grid-cols-4">
          <WeatherMetric
            icon={Thermometer}
            label="Temperature"
            value={`${Math.round(weather.temperature)}°C`}
          />
          <WeatherMetric
            icon={Droplets}
            label="Rain today"
            value={`${weather.rain} mm · ${weather.rainChance}%`}
          />
          <WeatherMetric icon={Wind} label="Wind" value={`${Math.round(weather.wind)} km/h`} />
          <WeatherMetric icon={CloudSun} label="Humidity" value={`${weather.humidity}%`} />
        </div>
      )}
    </Card>
  );
}

function WeatherMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CloudSun;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-background/75 p-3">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
