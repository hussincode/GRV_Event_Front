import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, ScanLine, CornerDownLeft, Camera } from 'lucide-react';

const SCANNER_ELEMENT_ID = 'grv-checkin-scanner-region';

/** Extracts a ticket ID from decoded QR text: either a full check-in URL
 *  (`.../checkin-admin?ticket=GRV-2026-XXXXX`) or the raw ticket ID string. */
function extractTicketId(decodedText: string): string {
  try {
    const url = new URL(decodedText);
    const fromQuery = url.searchParams.get('ticket');
    if (fromQuery) return fromQuery.trim();
  } catch {
    // Not a URL — fall through and treat the raw text as the ticket ID.
  }
  return decodedText.trim();
}

interface CheckinScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the extracted ticket ID once a QR code is decoded (or manual
   *  entry submitted). Does NOT perform check-in itself — the caller is
   *  expected to navigate to the single-ticket confirmation view. */
  onScanned: (ticketId: string) => void;
}

export function CheckinScannerModal({ open, onOpenChange, onScanned }: CheckinScannerModalProps) {
  const [manualTicketId, setManualTicketId] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);

  // Internal refs — never cause re-renders.
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const cancelledRef = useRef(false);
  const processingRef = useRef(false);

  const handleDecoded = useCallback((ticketId: string) => {
    if (processingRef.current || !ticketId) return;
    processingRef.current = true;
    onScanned(ticketId);
  }, [onScanned]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = manualTicketId.trim();
    if (!ticketId) return;
    setManualTicketId('');
    handleDecoded(ticketId);
  };

  /** Starts the camera. Called via a ref-callback once the container div
   *  is actually in the DOM — guaranteed timing, no race with portal rendering. */
  const startCamera = useCallback(async (elementId: string) => {
    if (cancelledRef.current) return;
    setCameraStarting(true);
    setCameraError(null);

    const scanner = new Html5Qrcode(elementId, { verbose: false });
    html5QrcodeRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (cancelledRef.current) return;
          handleDecoded(extractTicketId(decodedText));
        },
        () => {
          // Per-frame "no QR found" — expected constantly, ignore.
        },
      );
      if (!cancelledRef.current) {
        isScanningRef.current = true;
      }
    } catch (err: any) {
      if (cancelledRef.current) return;
      const msg: string = err?.message ?? '';
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, then try again.');
      } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no camera')) {
        setCameraError('No camera was found on this device. Use manual Ticket ID entry below.');
      } else {
        setCameraError('Could not start the camera. Try a different browser, or use manual entry below.');
      }
    } finally {
      setCameraStarting(false);
    }
  }, [handleDecoded]);

  /** Stops & cleans up the scanner instance. */
  const stopCamera = useCallback(async () => {
    const scanner = html5QrcodeRef.current;
    if (!scanner) return;
    html5QrcodeRef.current = null;

    if (isScanningRef.current) {
      isScanningRef.current = false;
      try {
        await scanner.stop();
      } catch { /* ignore */ }
    }
    try {
      scanner.clear();
    } catch { /* already cleared */ }
  }, []);

  // When the modal closes, tear down the scanner.
  useEffect(() => {
    if (open) {
      // Reset state for fresh open
      cancelledRef.current = false;
      processingRef.current = false;
      isScanningRef.current = false;
      setCameraError(null);
      setCameraStarting(false);
    } else {
      cancelledRef.current = true;
      stopCamera();
    }
  }, [open, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopCamera();
    };
  }, [stopCamera]);

  /**
   * Ref callback — fires as soon as the <div> is inserted into the real DOM by
   * the Radix portal, which is always AFTER the DialogContent animation starts.
   * This is the only safe place to call `new Html5Qrcode(elementId)`.
   */
  const scannerDivRef = useCallback((node: HTMLDivElement | null) => {
    if (node && open && !cancelledRef.current) {
      // The DOM node is now live — safe to start the scanner.
      startCamera(SCANNER_ELEMENT_ID);
    }
  }, [open, startCamera]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-2xl">
            <ScanLine className="w-5 h-5 text-primary" />
            Check-in Scanner
          </DialogTitle>
          <DialogDescription>
            Point the camera at an attendee's ticket QR code. You'll be taken to their check-in confirmation.
          </DialogDescription>
        </DialogHeader>

        {/* Camera viewport */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border bg-black/40 glass-card">
          {/* The ref-callback div: scanner mounts here the moment it's in the DOM */}
          <div
            id={SCANNER_ELEMENT_ID}
            ref={scannerDivRef}
            className="w-full h-full"
          />

          {/* Starting overlay */}
          {cameraStarting && !cameraError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80">
              <Camera className="w-10 h-10 text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground">Starting camera…</p>
            </div>
          )}

          {/* Scan-frame overlay (shown once camera is active) */}
          {!cameraStarting && !cameraError && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="w-52 h-52 relative">
                {/* Corner brackets */}
                <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
                {/* Animated scan line */}
                <span className="absolute left-1 right-1 h-0.5 bg-primary/70 shadow-[0_0_6px_2px] shadow-primary/40 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Error overlay */}
          {cameraError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-6 text-center bg-background/95">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
              <p className="text-sm text-muted-foreground">{cameraError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCameraError(null);
                  startCamera(SCANNER_ELEMENT_ID);
                }}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Manual fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-2 pt-2">
          <label className="text-xs text-muted-foreground font-medium">Or enter Ticket ID manually</label>
          <div className="flex gap-2">
            <Input
              placeholder="GRV-2026-XXXXX"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              className="bg-background/50 font-mono uppercase"
              autoComplete="off"
            />
            <Button type="submit" variant="outline" className="shrink-0" disabled={!manualTicketId.trim()}>
              <CornerDownLeft className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
