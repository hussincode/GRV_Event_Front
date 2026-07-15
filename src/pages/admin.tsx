import React, { useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  useGetAdminSession, 
  useAdminLogin, 
  useAdminLogout, 
  useListRegistrations, 
  useGetRegistrationStats,
  useApproveRegistration,
  useRejectRegistration,
  getListRegistrationsQueryKey,
  getGetRegistrationStatsQueryKey,
  getGetAdminSessionQueryKey
} from '@/lib/api-client-react';
import { type Registration } from '@/lib/api-client-react/src/generated/api.schemas';
import { 
  Loader2, 
  RefreshCcw, 
  LogOut, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  QrCode,
  ScanLine,
  Eye,
  ShieldAlert
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

function AdminLogin() {
  const queryClient = useQueryClient();
  const loginMutation = useAdminLogin();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
        toast({ title: 'Logged in successfully' });
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        if (redirect) {
          setLocation(decodeURIComponent(redirect));
        }
      },
      onError: (error) => {
        toast({ 
          title: 'Login Failed', 
          description: error.error || 'Invalid credentials', 
          variant: 'destructive' 
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-10">
      <Card className="glass-card w-full max-w-md overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-brand-soft" />
        <CardHeader className="pt-8 pb-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading text-gradient">Admin Access</CardTitle>
          <CardDescription>Sign in to manage event registrations</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" className="bg-input/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-input/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="btn-primary w-full h-12 mt-4"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useGetAdminSession();
  const logoutMutation = useAdminLogout();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
        queryClient.setQueryData(getGetAdminSessionQueryKey(), null);
        toast({ title: 'Logged out' });
      }
    });
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (sessionError || !session) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen w-full pb-20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-heading font-bold text-foreground">GRV Portal</h1>
            <Badge variant="outline" className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20">
              Admin
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">Logged in as <strong className="text-foreground">{session.username}</strong></span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <DashboardContent />
      </main>
    </div>
  );
}

function DashboardContent() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching: statsRefetching } = useGetRegistrationStats();
  const { data: registrations, isLoading: regsLoading, refetch: refetchRegs, isRefetching: regsRefetching } = useListRegistrations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRow, setSelectedRow] = useState<Registration | null>(null);
  const [, setLocation] = useLocation();

  const approveMutation = useApproveRegistration();
  const rejectMutation = useRejectRegistration();
  const { toast } = useToast();

  const handleRefresh = () => {
    refetchStats();
    refetchRegs();
  };

  const isRefreshing = statsRefetching || regsRefetching;

  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];
    let result = registrations;
    
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.fullName.toLowerCase().includes(lowerSearch) || 
        r.email.toLowerCase().includes(lowerSearch) ||
        r.mobileNumber.includes(searchTerm) ||
        (r.ticketId && r.ticketId.toLowerCase().includes(lowerSearch))
      );
    }
    
    return result;
  }, [registrations, searchTerm, statusFilter]);

  const handleApprove = (rowId: number) => {
    approveMutation.mutate({ rowId }, {
      onSuccess: () => {
        toast({ title: 'Registration approved', description: 'Ticket generated and email sent.' });
        queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRegistrationStatsQueryKey() });
        if (selectedRow?.id === rowId) setSelectedRow(null);
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.error || 'Failed to approve', variant: 'destructive' });
      }
    });
  };

  const handleReject = (rowId: number) => {
    rejectMutation.mutate({ rowId }, {
      onSuccess: () => {
        toast({ title: 'Registration rejected', description: 'Rejection email sent.' });
        queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRegistrationStatsQueryKey() });
        if (selectedRow?.id === rowId) setSelectedRow(null);
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.error || 'Failed to reject', variant: 'destructive' });
      }
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'Rejected':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'Pending':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-heading font-bold text-foreground">Dashboard</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setLocation('/checkin-admin')}
            className="btn-primary w-full sm:w-auto"
          >
            <ScanLine className="w-4 h-4 mr-2" />
            Check-in
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="w-full sm:w-auto bg-card/50 backdrop-blur-sm border-border hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium">Total</p>
            </div>
            <p className="text-3xl font-bold font-heading">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.total || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-amber-500">
              <Clock className="w-4 h-4" />
              <p className="text-sm font-medium">Pending</p>
            </div>
            <p className="text-3xl font-bold font-heading text-amber-500">
              {statsLoading ? <Skeleton className="h-8 w-16 bg-amber-500/10" /> : stats?.pending || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              <p className="text-sm font-medium">Approved</p>
            </div>
            <p className="text-3xl font-bold font-heading text-green-500">
              {statsLoading ? <Skeleton className="h-8 w-16 bg-green-500/10" /> : stats?.approved || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-destructive">
              <XCircle className="w-4 h-4" />
              <p className="text-sm font-medium">Rejected</p>
            </div>
            <p className="text-3xl font-bold font-heading text-destructive">
              {statsLoading ? <Skeleton className="h-8 w-16 bg-destructive/10" /> : stats?.rejected || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-primary">
              <QrCode className="w-4 h-4" />
              <p className="text-sm font-medium">Checked-in</p>
            </div>
            <p className="text-3xl font-bold font-heading text-primary">
              {statsLoading ? <Skeleton className="h-8 w-16 bg-primary/10" /> : stats?.checkedIn || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email, phone..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background/50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-heading">Applicant</TableHead>
                <TableHead className="font-heading">Contact</TableHead>
                <TableHead className="font-heading">Demographics</TableHead>
                <TableHead className="font-heading">Status</TableHead>
                <TableHead className="font-heading text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-10 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRegistrations.length === 0 ? (
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No registrations found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrations.map((row) => (
                  <TableRow key={row.id} className="border-border/50 hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => setSelectedRow(row)}>
                    <TableCell className="align-top py-4">
                      <p className="font-medium text-foreground">{row.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-1">ID: {row.id}</p>
                      {row.checkedIn && (
                         <Badge variant="outline" className="mt-2 bg-primary/10 text-primary border-primary/20 text-[10px]">
                           Checked in
                         </Badge>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <p className="text-sm">{row.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{row.mobileNumber}</p>
                      {row.whatsappNumber !== row.mobileNumber && (
                        <p className="text-xs text-muted-foreground mt-1">WA: {row.whatsappNumber}</p>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <p className="text-sm">{row.age}y, {row.gender}</p>
                      <p className="text-xs text-muted-foreground mt-1">{row.governorate}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]" title={row.educationalStage}>
                        {row.educationalStage}
                      </p>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col items-start gap-2">
                        <StatusBadge status={row.status} />
                        {row.ticketId && (
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                            {row.ticketId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                        {row.status === 'Pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white"
                              onClick={() => handleApprove(row.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white"
                              onClick={() => handleReject(row.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSelectedRow(row)}
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="sm:max-w-2xl bg-popover/95 backdrop-blur-xl border-border">
          {selectedRow && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-8">
                  <DialogTitle className="text-2xl font-heading">Applicant Details</DialogTitle>
                  <StatusBadge status={selectedRow.status} />
                </div>
                <DialogDescription>
                  Submitted on {new Date(selectedRow.timestamp).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-6 border-y border-border/50 mt-2">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Personal Info</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                      <p className="text-sm font-medium">{selectedRow.fullName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Age</p>
                        <p className="text-sm font-medium">{selectedRow.age}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Gender</p>
                        <p className="text-sm font-medium">{selectedRow.gender}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="text-sm font-medium">{selectedRow.governorate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Education</p>
                      <p className="text-sm font-medium">{selectedRow.educationalStage}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Contact & Status</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                      <p className="text-sm font-medium">{selectedRow.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Mobile / WhatsApp</p>
                      <p className="text-sm font-medium">{selectedRow.mobileNumber}</p>
                      {selectedRow.whatsappNumber !== selectedRow.mobileNumber && (
                        <p className="text-sm font-medium text-muted-foreground mt-1">WA: {selectedRow.whatsappNumber}</p>
                      )}
                    </div>
                    {selectedRow.ticketId && (
                      <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
                        <p className="text-sm font-mono font-medium text-primary">{selectedRow.ticketId}</p>
                      </div>
                    )}
                    {selectedRow.checkedIn && (
                      <div className="mt-2 p-3 bg-green-500/5 border border-green-500/10 rounded-lg flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-green-500/80 font-medium">Checked In</p>
                          <p className="text-sm font-medium text-green-500">{new Date(selectedRow.checkedInAt!).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 flex sm:justify-between items-center w-full">
                <p className="text-xs text-muted-foreground">ID: {selectedRow.id}</p>
                {selectedRow.status === 'Pending' && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white"
                      onClick={() => handleReject(selectedRow.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white"
                      onClick={() => handleApprove(selectedRow.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      Approve
                    </Button>
                  </div>
                )}
                {selectedRow.status !== 'Pending' && (
                  <Button variant="outline" onClick={() => setSelectedRow(null)}>Close</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
