import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  useGetAdminSession,
  useLookupTicket,
  useCheckinTicket,
} from '@/lib/api-client-react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ScanLine,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckinScannerModal } from '@/components/checkin-scanner-modal';

function getTicketFromSearch(search: string): string | null {
  return new URLSearchParams(search).get('ticket');
}

/** Landing view when /checkin-admin is opened without a ticket param: manual
 *  entry + in-app scanner, both of which route to the single-ticket view. */
function CheckinAdminHome() {
  const [, setLocation] = useLocation();
  const [manualTicketId, setManualTicketId] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const goToTicket = (ticketId: string) => {
    const trimmed = ticketId.trim();
    if (!trimmed) return;
    setLocation(`/checkin-admin?ticket=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-brand-soft" />
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <ScanLine className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-heading text-gradient">Check-in Attendee</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Scan a ticket QR code or enter a Ticket ID manually.
            </p>
          </div>

          <Button className="btn-primary w-full h-12" onClick={() => setScannerOpen(true)}>
            <ScanLine className="w-4 h-4 mr-2" />
            Scan QR Code
          </Button>

          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              goToTicket(manualTicketId);
            }}
          >
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
                Look up
              </Button>
            </div>
          </form>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setLocation('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>

      <CheckinScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanned={(ticketId) => {
          setScannerOpen(false);
          goToTicket(ticketId);
        }}
      />
    </div>
  );
}

/** Single-ticket confirmation view: looks up the ticket, shows attendee info,
 *  and requires an explicit "Check-in" click to actually flip Checked In. */
function TicketCheckinView({ ticketId }: { ticketId: string }) {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError, refetch } = useLookupTicket(ticketId);
  const checkinMutation = useCheckinTicket();
  const [confirmed, setConfirmed] = useState<{ result: string; fullName: string | null; checkedInAt: string | null } | null>(null);

  const handleCheckin = () => {
    checkinMutation.mutate({ ticketId }, {
      onSuccess: (result) => {
        setConfirmed(result);
      },
    });
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      {children}
      <Button variant="ghost" className="mt-8 text-muted-foreground" onClick={() => setLocation('/checkin-admin')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Scan Another Ticket
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <Shell>
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-2xl font-heading text-foreground animate-pulse">Looking up ticket...</h1>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell>
        <XCircle className="w-24 h-24 text-destructive mb-6" />
        <h1 className="text-3xl font-heading text-destructive mb-2">Lookup Failed</h1>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          A network or server error occurred while looking up this ticket.
        </p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </Shell>
    );
  }

  // Result of an explicit check-in click just performed.
  if (confirmed?.result === 'success') {
    return (
      <Shell>
        <CheckCircle2 className="w-32 h-32 text-green-500 mb-8 drop-shadow-[0_0_40px_rgba(34,197,94,0.6)]" />
        <h1 className="text-4xl font-heading text-green-500 mb-4 tracking-tight">✅ Check-in successful</h1>
        <div className="glass-card p-6 mt-4 w-full max-w-md text-center border-green-500/30">
          <p className="text-sm uppercase tracking-widest text-green-400/80 mb-2 font-semibold">Welcome</p>
          <p className="text-2xl font-bold text-foreground">{confirmed.fullName}</p>
        </div>
      </Shell>
    );
  }

  if (confirmed?.result === 'already_checked_in') {
    return (
      <Shell>
        <AlertTriangle className="w-32 h-32 text-amber-500 mb-8" />
        <h1 className="text-4xl font-heading text-amber-500 mb-4 tracking-tight">⚠️ Already checked in</h1>
        <div className="glass-card p-6 mt-4 w-full max-w-md text-center border-amber-500/20">
          <p className="text-lg text-foreground/80 mb-2">Attendee</p>
          <p className="text-2xl font-bold text-foreground mb-4">{confirmed.fullName}</p>
          <p className="text-sm text-muted-foreground mb-1">Previous check-in time</p>
          <p className="text-lg text-amber-400 font-medium">
            {confirmed.checkedInAt ? new Date(confirmed.checkedInAt).toLocaleString() : 'Unknown'}
          </p>
        </div>
      </Shell>
    );
  }

  const notFoundOrUnapproved = !data?.found || data.status !== 'Approved';

  if (notFoundOrUnapproved) {
    return (
      <Shell>
        <XCircle className="w-32 h-32 text-destructive mb-8" />
        <h1 className="text-4xl font-heading text-destructive mb-4 tracking-tight">❌ Invalid or unapproved ticket</h1>
        <p className="text-lg text-muted-foreground text-center max-w-md">
          {data?.found
            ? `This ticket exists but its status is "${data.status}", not Approved.`
            : 'No registration was found for this Ticket ID.'}
        </p>
      </Shell>
    );
  }

  // Found, Approved. Already checked in (per lookup, before any button click)?
  if (data.checkedIn) {
    return (
      <Shell>
        <AlertTriangle className="w-32 h-32 text-amber-500 mb-8" />
        <h1 className="text-4xl font-heading text-amber-500 mb-4 tracking-tight">⚠️ Already checked in</h1>
        <div className="glass-card p-6 mt-4 w-full max-w-md text-center border-amber-500/20">
          <p className="text-lg text-foreground/80 mb-2">Attendee</p>
          <p className="text-2xl font-bold text-foreground mb-4">{data.fullName}</p>
          <p className="text-sm text-muted-foreground mb-1">Previous check-in time</p>
          <p className="text-lg text-amber-400 font-medium">
            {data.checkedInAt ? new Date(data.checkedInAt).toLocaleString() : 'Unknown'}
          </p>
        </div>
      </Shell>
    );
  }

  // Approved, not yet checked in — show info + explicit Check-in button.
  return (
    <Shell>
      <div className="glass-card p-8 w-full max-w-md text-center border-primary/20">
        <p className="text-sm uppercase tracking-widest text-primary/80 mb-2 font-semibold">Attendee</p>
        <p className="text-3xl font-bold text-foreground mb-4">{data.fullName}</p>
        <div className="grid grid-cols-2 gap-4 text-left mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
            <p className="text-sm font-mono font-medium text-primary">{data.ticketId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <p className="text-sm font-medium text-green-500">{data.status}</p>
          </div>
        </div>
        <Button
          className="btn-primary w-full h-12"
          onClick={handleCheckin}
          disabled={checkinMutation.isPending}
        >
          {checkinMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check-in'}
        </Button>
        {checkinMutation.isError && (
          <p className="text-sm text-destructive mt-3">
            {checkinMutation.error?.data?.error || 'Could not process check-in. Please try again.'}
          </p>
        )}
      </div>
    </Shell>
  );
}

export default function CheckinAdminPage() {
  const [, setLocation] = useLocation();
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useGetAdminSession();
  const [search, setSearch] = useState(() => window.location.search);

  // Keep in sync if the ticket param changes via history navigation.
  useEffect(() => {
    setSearch(window.location.search);
  }, [window.location.href]);

  const ticketId = getTicketFromSearch(search);

  useEffect(() => {
    if (sessionLoading) return;
    if (sessionError || !session) {
      const redirectTarget = `/checkin-admin${ticketId ? `?ticket=${encodeURIComponent(ticketId)}` : ''}`;
      setLocation(`/admin?redirect=${encodeURIComponent(redirectTarget)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, sessionError, session]);

  if (sessionLoading || sessionError || !session) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (ticketId) {
    return <TicketCheckinView key={ticketId} ticketId={ticketId} />;
  }

  return <CheckinAdminHome />;
}
