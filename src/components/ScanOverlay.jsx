import { ScanLine, Zap } from "lucide-react";

export default function ScanOverlay({ isScanning }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Corner brackets */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72">
          {/* Top-left */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-3 border-l-3 border-primary rounded-tl-lg" 
               style={{ borderTopWidth: '3px', borderLeftWidth: '3px' }} />
          {/* Top-right */}
          <div className="absolute top-0 right-0 w-10 h-10 border-t-3 border-r-3 border-primary rounded-tr-lg"
               style={{ borderTopWidth: '3px', borderRightWidth: '3px' }} />
          {/* Bottom-left */}
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-3 border-l-3 border-primary rounded-bl-lg"
               style={{ borderBottomWidth: '3px', borderLeftWidth: '3px' }} />
          {/* Bottom-right */}
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-3 border-r-3 border-primary rounded-br-lg"
               style={{ borderBottomWidth: '3px', borderRightWidth: '3px' }} />

          {/* Scan line */}
          {isScanning && (
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-lg shadow-primary/50" />
          )}

          {/* Pulse rings */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-primary/30 animate-pulse-ring" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom instruction */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 backdrop-blur-md border border-border/50">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground/80">
            Point at a QR code to scan
          </span>
        </div>
      </div>
    </div>
  );
}