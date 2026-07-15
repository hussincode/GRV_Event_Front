import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, ScanLine, CornerDownLeft } from 'lucide-react';

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

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
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

  // Start/stop the camera scanner whenever the modal opens/closes.
  useEffect(() => {
    if (!open) return;
    setCameraError(null);
    processingRef.current = false;

    let cancelled = false;
    const html5Qrcode = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = html5Qrcode;

    html5Qrcode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (cancelled) return;
          handleDecoded(extractTicketId(decodedText));
        },
        () => {
          // Per-frame "no QR found" callback — expected constantly, ignore.
        },
      )
      .then(() => {
        isScanningRef.current = true;
      })
      .catch((err) => {
        if (cancelled) return;
        setCameraError(
          err?.message?.includes('Permission')
            ? 'Camera permission denied. Allow camera access in your browser settings, or use manual entry below.'
            : 'Could not access the camera. Use manual entry below, or try a different browser.',
        );
      });

    return () => {
      cancelled = true;
      if (isScanningRef.current) {
        html5Qrcode
          .stop()
          .then(() => html5Qrcode.clear())
          .catch(() => {
            try {
              html5Qrcode.clear();
            } catch {
              // Element may already be gone from the DOM — safe to ignore.
            }
          });
        isScanningRef.current = false;
      } else {
        try {
          html5Qrcode.clear();
        } catch {
          // Nothing to clear yet.
        }
      }
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

        <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border bg-black/40 glass-card">
          <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />
          {cameraError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-6 text-center bg-background/95">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
              <p className="text-sm text-muted-foreground">{cameraError}</p>
            </div>
          )}
        </div>

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
