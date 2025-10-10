import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface SimplePlayerLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function SimplePlayerLayout({ leftPanel, rightPanel }: SimplePlayerLayoutProps) {
  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal">
        {/* Player List Panel */}
        <ResizablePanel 
          id="player-list" 
          defaultSize={50}
          minSize={30} 
          maxSize={70} 
          className="overflow-hidden"
        >
          {leftPanel}
        </ResizablePanel>

        <ResizableHandle />

        {/* Player Details Panel */}
        <ResizablePanel 
          id="player-details" 
          defaultSize={50}
          minSize={30} 
          maxSize={70} 
          className="overflow-hidden"
        >
          {rightPanel}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
