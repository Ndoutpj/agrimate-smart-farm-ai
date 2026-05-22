import logo from "@/assets/agrimate-logo.jpeg";

export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div className={`${className} rounded-xl overflow-hidden bg-white ring-1 ring-border shadow-sm`}>
      <img src={logo} alt="AgriMate" className="h-full w-full object-cover" />
    </div>
  );
}
