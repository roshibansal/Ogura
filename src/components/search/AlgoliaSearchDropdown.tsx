import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InstantSearch, useHits, useSearchBox, Configure, useInstantSearch } from "react-instantsearch";
import { ArrowRight, Camera } from "lucide-react";
import { searchClient, ALGOLIA_INDEX_NAME } from "@/lib/algoliaClient";
import { AlgoliaSearchBox } from "./AlgoliaSearchBox";
import { AlgoliaProductHit } from "./AlgoliaProductHit";
import { AlgoliaTrendingProducts, saveRecentSearch } from "./AlgoliaTrendingProducts";
import { AlgoliaNoResults } from "./AlgoliaNoResults";
import { ImageSearchDialog } from "@/components/ImageSearchDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlgoliaSearchDropdownProps {
  isScrolled?: boolean;
  className?: string;
}

const SearchResults = ({ onResultClick }: { onResultClick: () => void }) => {
  const { hits } = useHits();
  const { query } = useSearchBox();
  const { status } = useInstantSearch();
  const navigate = useNavigate();

  if (!query) {
    return (
      <AlgoliaTrendingProducts
        onSearchClick={(q) => {
          saveRecentSearch(q);
          navigate(`/search?q=${encodeURIComponent(q)}`);
          onResultClick();
        }}
        onClose={onResultClick}
      />
    );
  }

  // Show loading while searching
  if (status === "loading" || status === "stalled") {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (hits.length === 0) {
    return <AlgoliaNoResults />;
  }

  const handleViewAll = () => {
    saveRecentSearch(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    onResultClick();
  };

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <div className="p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Products ({hits.length} found)
        </h4>
        <ul className="space-y-1">
          {hits.slice(0, 6).map((hit: any) => (
            <li key={hit.objectID}>
              <AlgoliaProductHit hit={hit} onClick={onResultClick} />
            </li>
          ))}
        </ul>
      </div>

      {hits.length > 0 && (
        <div className="p-3 border-t border-border">
          <button
            onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary hover:underline"
          >
            View all results for "{query}"
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const SearchDropdownContent = ({
  isScrolled,
  isOpen,
  setIsOpen,
  containerRef,
}: {
  isScrolled: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  const navigate = useNavigate();
  const { query } = useSearchBox();

  const handleSubmit = (searchQuery: string) => {
    saveRecentSearch(searchQuery);
    setIsOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleResultClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Configure always active so Algolia fetches results immediately */}
      <Configure hitsPerPage={6} />
      
      <div className="flex items-center gap-1">
        <AlgoliaSearchBox
          isScrolled={isScrolled}
          onFocus={() => setIsOpen(true)}
          onSubmit={handleSubmit}
          className="w-48"
        />
        <ImageSearchDialog
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "transition-colors",
                !isScrolled && "text-white hover:bg-white/10"
              )}
              title="Search by image"
            >
              <Camera className="h-5 w-5" />
            </Button>
          }
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in min-w-[320px]">
          <SearchResults onResultClick={handleResultClick} />
        </div>
      )}
    </>
  );
};

export const AlgoliaSearchDropdown = ({
  isScrolled = true,
  className,
}: AlgoliaSearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <InstantSearch
        searchClient={searchClient}
        indexName={ALGOLIA_INDEX_NAME}
      >
        <SearchDropdownContent
          isScrolled={isScrolled}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          containerRef={containerRef}
        />
      </InstantSearch>
    </div>
  );
};
