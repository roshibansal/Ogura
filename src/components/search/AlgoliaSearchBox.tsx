import { useRef, useEffect } from "react";
import { useSearchBox, UseSearchBoxProps } from "react-instantsearch";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AlgoliaSearchBoxProps extends UseSearchBoxProps {
  isScrolled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: (query: string) => void;
  autoFocus?: boolean;
  className?: string;
}

export const AlgoliaSearchBox = ({
  isScrolled = true,
  placeholder = "Search for products, brands...",
  onFocus,
  onBlur,
  onSubmit,
  autoFocus = false,
  className,
  ...props
}: AlgoliaSearchBoxProps) => {
  const { query, refine, clear } = useSearchBox(props);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit?.(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      clear();
      inputRef.current?.blur();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors pointer-events-none",
          isScrolled ? "text-muted-foreground" : "text-white/70"
        )}
      />
      <Input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => refine(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={cn(
          "pl-10 pr-10 h-10 transition-all",
          isScrolled
            ? "bg-secondary border-border"
            : "bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
        )}
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            clear();
            inputRef.current?.focus();
          }}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 transition-colors",
            isScrolled
              ? "text-muted-foreground hover:text-foreground"
              : "text-white/70 hover:text-white"
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
};
