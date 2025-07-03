export default function MatchDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Summary Section */}
      <div className="flex flex-wrap items-center gap-4 text-sm border-b pb-2 mb-2">
        <div className="h-8 bg-muted rounded w-8"></div>
        <div className="h-3 bg-muted rounded w-2"></div>
        <div className="h-8 bg-muted rounded w-8"></div>
        <div className="h-5 bg-muted rounded w-6"></div>
        <div className="h-5 bg-muted rounded w-6"></div>
        <div className="h-3 bg-muted rounded w-20"></div>
        <div className="h-3 bg-muted rounded w-2"></div>
        <div className="h-3 bg-muted rounded w-24"></div>
      </div>
      
      {/* Picks and Bans */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col items-center">
          <div className="h-5 bg-muted rounded w-20 mb-2"></div>
          <div className="h-4 bg-muted rounded w-12 mb-1"></div>
          <div className="flex flex-wrap gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-muted rounded w-12 mb-1"></div>
          <div className="flex flex-wrap gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-6 h-6 bg-muted rounded"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="h-5 bg-muted rounded w-20 mb-2"></div>
          <div className="h-4 bg-muted rounded w-12 mb-1"></div>
          <div className="flex flex-wrap gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-muted rounded w-12 mb-1"></div>
          <div className="flex flex-wrap gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-6 h-6 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Player Stats */}
      <div>
        <div className="h-4 bg-muted rounded w-16 mb-1"></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr>
                {[...Array(8)].map((_, i) => (
                  <th key={i} className="py-1 px-2">
                    <div className="h-3 bg-muted rounded w-8"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[...Array(8)].map((_, colIndex) => (
                    <td key={colIndex} className="py-1 px-2">
                      <div className="h-3 bg-muted rounded w-12"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 