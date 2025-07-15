
const palettes = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
];
const shades = [50,100,200,300,400,500,600,700,800,900,950];

const customColors = [
  { name: 'primary', className: 'bg-primary' },
  { name: 'primary-foreground', className: 'bg-primary-foreground' },
  { name: 'secondary', className: 'bg-secondary' },
  { name: 'secondary-foreground', className: 'bg-secondary-foreground' },
  { name: 'destructive', className: 'bg-destructive' },
  { name: 'destructive-foreground', className: 'bg-destructive-foreground' },
  { name: 'muted', className: 'bg-muted' },
  { name: 'muted-foreground', className: 'bg-muted-foreground' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'accent-foreground', className: 'bg-accent-foreground' },
  { name: 'popover', className: 'bg-popover' },
  { name: 'popover-foreground', className: 'bg-popover-foreground' },
  { name: 'card', className: 'bg-card' },
  { name: 'card-foreground', className: 'bg-card-foreground' },
  { name: 'border', className: 'bg-border' },
  { name: 'input', className: 'bg-input' },
  { name: 'ring', className: 'bg-ring' },
  { name: 'background', className: 'bg-background' },
  { name: 'foreground', className: 'bg-foreground' },
  { name: 'dota-radiant', className: 'bg-dota-radiant' },
  { name: 'dota-dire', className: 'bg-dota-dire' },
  { name: 'dota-green', className: 'bg-dota-green' },
  { name: 'dota-yellow', className: 'bg-dota-yellow' },
  { name: 'dota-purple', className: 'bg-dota-purple' },
];

export default function ColorsDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <h1 className="text-3xl font-bold mb-8">Tailwind & Custom Color Palette Demo</h1>
      <div className="space-y-12">
        {/* Default Tailwind Palettes */}
        {palettes.map((palette) => (
          <div key={palette}>
            <h2 className="text-2xl font-semibold mb-4 capitalize">{palette}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
              {shades.map((shade) => {
                const colorClass = `bg-${palette}-${shade}`;
                const textClass = shade > 400 ? 'text-white' : 'text-black';
                return (
                  <div
                    key={shade}
                    className={`flex flex-col items-center justify-center h-20 rounded shadow ${colorClass} ${textClass}`}
                  >
                    <span className="text-xs font-mono">{palette}-{shade}</span>
                    <span className="text-xs">{colorClass}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {/* Custom Semantic & Dota Colors */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Custom Semantic & Dota Colors</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {customColors.map(({ name, className }) => (
              <div
                key={name}
                className={`flex flex-col items-center justify-center h-20 rounded shadow ${className} text-white`}
              >
                <span className="text-xs font-mono">{name}</span>
                <span className="text-xs">{className}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 