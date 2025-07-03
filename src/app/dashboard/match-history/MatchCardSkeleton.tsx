export default function MatchCardSkeleton() {
  return (
    <div className="p-4 border-b animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-muted rounded w-24"></div>
          </div>
          <div className="h-3 bg-muted rounded w-16 mt-1"></div>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-5 bg-muted rounded w-6"></div>
            <div className="h-5 bg-muted rounded w-6"></div>
            <div className="h-3 bg-muted rounded w-12"></div>
            <div className="h-3 bg-muted rounded w-8"></div>
          </div>
        </div>
        <div className="flex flex-col items-end ml-12 min-w-[56px]">
          <div className="flex items-center gap-1 mb-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-5 h-5 bg-muted rounded"></div>
            ))}
          </div>
          <div className="w-full flex justify-center text-[10px] text-muted-foreground my-0.5">vs</div>
          <div className="flex items-center gap-1 mt-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-5 h-5 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 