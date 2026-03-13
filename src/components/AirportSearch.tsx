import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { searchAirports, getAirport, type Airport } from "@/data/airports";
import { Plane } from "lucide-react";

interface AirportSearchProps {
  value: string; // IATA code stored
  onChange: (iata: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AirportSearch({ value, onChange, placeholder = "Search airport or city...", className }: AirportSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync display text with value
  useEffect(() => {
    if (value && !focused) {
      const airport = getAirport(value);
      setQuery(airport ? `${airport.iata} - ${airport.city}` : value);
    }
  }, [value, focused]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
        // Restore display if valid selection
        if (value) {
          const airport = getAirport(value);
          setQuery(airport ? `${airport.iata} - ${airport.city}` : value);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value]);

  const handleInput = (text: string) => {
    setQuery(text);
    if (text.length >= 1) {
      setResults(searchAirports(text, 8));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  };

  const handleSelect = (airport: Airport) => {
    onChange(airport.iata);
    setQuery(`${airport.iata} - ${airport.city}`);
    setOpen(false);
    setFocused(false);
  };

  const handleFocus = () => {
    setFocused(true);
    setQuery("");
    if (query.length >= 1) {
      setResults(searchAirports(query, 8));
      setOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className || ""}`}>
      <Plane className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="pl-9 h-11"
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map(airport => (
            <button
              key={airport.iata}
              type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors flex items-start gap-2 border-b border-border/50 last:border-0"
              onClick={() => handleSelect(airport)}
            >
              <span className="font-mono font-bold text-primary text-sm mt-0.5 shrink-0">
                {airport.iata}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{airport.name}</p>
                <p className="text-xs text-muted-foreground">{airport.city}, {airport.country}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
