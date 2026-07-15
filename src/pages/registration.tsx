import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterAttendeeWithFiles, useRegistrationStatus } from '@/lib/api-client-react';
import { Check, AlertCircle, Calendar, MapPin, Ticket, Upload, FileText, X, IdCard, Lock, Users } from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GOVERNORATES = [
  'Cairo', 'Alexandria', 'Giza', 'Qalyubia', 'Port Said', 'Suez', 'Dakahlia', 'Sharqia', 
  'Gharbia', 'Monufia', 'Beheira', 'Ismailia', 'Faiyum', 'Beni Suef', 'Minya', 'Asyut', 
  'Sohag', 'Qena', 'Aswan', 'Luxor', 'Red Sea', 'New Valley', 'Matrouh', 'North Sinai', 
  'South Sinai', 'Kafr El Sheikh', 'Damietta'
];

const EDUCATIONAL_STAGES = [
  'High School', 'University', 'Postgraduate', 'Working Professional', 'Other'
];

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png';
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  mobileNumber: z.string().min(10, 'Valid mobile number is required'),
  whatsappNumber: z.string().min(10, 'Valid WhatsApp number is required'),
  gender: z.enum(['Male', 'Female']),
  age: z.coerce.number().min(1).max(120),
  governorate: z.string().min(1, 'Please select a governorate'),
  educationalStageDropdown: z.string().min(1, 'Please select your educational stage'),
  educationalStageOther: z.string().optional(),
  consentMediaUsage: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the media usage terms' })
  }),
}).refine(data => {
  if (data.educationalStageDropdown === 'Other' && (!data.educationalStageOther || data.educationalStageOther.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please specify your educational stage",
  path: ["educationalStageOther"],
});

// ── File Upload Zone Component ───────────────────────────────────────────────

interface FileUploadZoneProps {
  label: string;
  hint: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  icon?: React.ReactNode;
}

function FileUploadZone({ label, hint, file, onFileChange, icon }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && ACCEPTED_MIME.includes(dropped.type)) {
      onFileChange(dropped);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) onFileChange(selected);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
  };

  const getFileIcon = (f: File) => {
    if (f.type === 'application/pdf') return '📄';
    return '🖼️';
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-200
          ${file
            ? 'border-primary/40 bg-primary/5 cursor-default'
            : isDragging
              ? 'border-primary bg-primary/10 scale-[1.01] cursor-copy'
              : 'border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileInput}
          className="hidden"
        />

        {file ? (
          /* ── Selected state ── */
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-xl flex-shrink-0">
              {getFileIcon(file)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="w-7 h-7 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* ── Empty / drag state ── */
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
              {icon ?? <Upload className="w-5 h-5 text-primary" />}
            </div>
            <p className="text-sm font-medium text-foreground">
              Drag & drop or <span className="text-primary underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Registration Page ───────────────────────────────────────────────────

export default function RegistrationPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [birthPaperFile, setBirthPaperFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: regStatus, isLoading: statusLoading } = useRegistrationStatus({
    query: { staleTime: 30_000, refetchInterval: 60_000 },
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      whatsappNumber: '',
      gender: undefined as unknown as 'Male' | 'Female',
      age: undefined as unknown as number,
      governorate: '',
      educationalStageDropdown: '',
      educationalStageOther: '',
    },
  });

  const registerMutation = useRegisterAttendeeWithFiles();
  const watchEducationalStage = form.watch('educationalStageDropdown');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Validate: at least one document must be uploaded
    if (!nationalIdFile && !birthPaperFile) {
      setFileError('Please upload at least one identity document (National ID or Birth Paper).');
      // Scroll to the documents section
      document.getElementById('identity-documents-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFileError(null);

    const finalEducationalStage = values.educationalStageDropdown === 'Other' 
      ? values.educationalStageOther || 'Other' 
      : values.educationalStageDropdown;

    const formData = new FormData();
    formData.append('fullName', values.fullName.trim());
    formData.append('email', values.email.trim());
    formData.append('mobileNumber', values.mobileNumber.trim());
    formData.append('whatsappNumber', values.whatsappNumber.trim());
    formData.append('gender', values.gender);
    formData.append('age', String(values.age));
    formData.append('governorate', values.governorate);
    formData.append('educationalStage', finalEducationalStage);
    formData.append('consentMediaUsage', 'true');
    if (nationalIdFile) formData.append('nationalIdFile', nationalIdFile);
    if (birthPaperFile) formData.append('birthPaperFile', birthPaperFile);

    registerMutation.mutate({ formData }, {
      onSuccess: () => {
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  // ── Registration closed / loading screens ──
  if (statusLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Checking registration status…</p>
        </div>
      </div>
    );
  }

  if (regStatus && !regStatus.open) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 py-20 relative z-10">
        <Card className="glass-card max-w-lg w-full text-center overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-destructive to-red-400" />
          <CardContent className="pt-12 pb-10 px-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-destructive/15 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-3xl font-heading text-gradient mb-4">Registration Closed</h2>
            <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
              We've reached our maximum capacity of <strong className="text-foreground">{regStatus.limit}</strong> participants.
              Registration is now closed.
            </p>
            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-5 py-3 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span><strong className="text-foreground">{regStatus.total}</strong> / {regStatus.limit} spots filled</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 py-20 relative z-10">
        <Card className="glass-card max-w-lg w-full text-center overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-brand-soft" />
          <CardContent className="pt-12 pb-10 px-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-heading text-gradient mb-4">Registration Received</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Your registration has been received and is under review. You'll receive your ticket by email once approved.
            </p>
            <Button 
              className="btn-secondary w-full"
              onClick={() => {
                setIsSuccess(false);
                setNationalIdFile(null);
                setBirthPaperFile(null);
                setFileError(null);
                form.reset();
              }}
            >
              Submit Another Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative z-10 py-16 px-4 md:px-8 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <span className="eyebrow mb-4">Official Application</span>
          <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6 text-gradient tracking-tight">
            GRV Offline Event 2026
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8 font-medium">
            Registration form for the first offline event organized by GRV in collaboration with Canadian International College (CIC).
          </p>

          {/* ── Spots remaining pill ── */}
          {regStatus && regStatus.open && (
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-5 py-2 rounded-full text-sm font-semibold mb-6 animate-in fade-in duration-500">
              <Users className="w-4 h-4" />
              <span>{regStatus.remaining} spot{regStatus.remaining !== 1 ? 's' : ''} remaining out of {regStatus.limit}</span>
            </div>
          )}
          
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium mb-8">
            <div className="flex items-center gap-2 bg-card/50 border border-border px-4 py-2 rounded-full backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>30 July 2026</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 border border-border px-4 py-2 rounded-full backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Canadian International College</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 border border-border px-4 py-2 rounded-full backdrop-blur-sm">
              <Ticket className="w-4 h-4 text-primary" />
              <span>Approval Required</span>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 md:p-6 text-left shadow-inner">
            <p className="mb-2 text-foreground/90">
              <strong className="text-primary">Important:</strong> Please fill out the form carefully. Your registration will be reviewed, and once approved, your official ticket will be sent to your email.
            </p>
            <p className="text-muted-foreground text-sm">
              Completing this form does not guarantee attendance.
            </p>
          </div>
        </div>

        <Card className="glass-card overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150">
          <CardContent className="p-6 md:p-10">
            {registerMutation.isError && (
              <Alert variant="destructive" className="mb-8 bg-destructive/10 border-destructive/20 text-destructive-foreground">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>
                  {(registerMutation.error as any)?.data?.error || "A network or server error occurred. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className="bg-input/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" className="bg-input/50" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Please make sure your email address is correct, as your ticket will be sent to it.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+20 100 000 0000" className="bg-input/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+20 100 000 0000" className="bg-input/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-input/50">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="25" className="bg-input/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="governorate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Governorate</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-input/50">
                              <SelectValue placeholder="Select governorate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GOVERNORATES.map(gov => (
                              <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="educationalStageDropdown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Educational Stage</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-input/50">
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EDUCATIONAL_STAGES.map(stage => (
                                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchEducationalStage === 'Other' && (
                      <FormField
                        control={form.control}
                        name="educationalStageOther"
                        render={({ field }) => (
                          <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <FormLabel>Please Specify</FormLabel>
                            <FormControl>
                              <Input placeholder="Specify your stage" className="bg-input/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* ── Identity Documents Section ── */}
                <div
                  id="identity-documents-section"
                  className="pt-6 border-t border-border space-y-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <IdCard className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Identity Documents</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Upload your <strong>National ID</strong> or <strong>Birth Certificate</strong> (or both).
                        Accepted formats: PDF, JPG, PNG — max 10 MB each.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadZone
                      label="National ID / Driver's License"
                      hint="PDF, JPG or PNG · max 10 MB"
                      file={nationalIdFile}
                      onFileChange={(f) => { setNationalIdFile(f); if (f) setFileError(null); }}
                      icon={<IdCard className="w-5 h-5 text-primary" />}
                    />
                    <FileUploadZone
                      label="Birth Certificate"
                      hint="PDF, JPG or PNG · max 10 MB"
                      file={birthPaperFile}
                      onFileChange={(f) => { setBirthPaperFile(f); if (f) setFileError(null); }}
                      icon={<FileText className="w-5 h-5 text-primary" />}
                    />
                  </div>

                  {fileError && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>

                {/* ── Media Consent ── */}
                <div className="pt-2 border-t border-border">
                  <FormField
                    control={form.control}
                    name="consentMediaUsage"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium text-foreground cursor-pointer">
                            Media Consent
                          </FormLabel>
                          <FormDescription className="text-sm">
                            I agree that photos and videos taken during the event may be used for media purposes.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  {form.formState.errors.consentMediaUsage && (
                    <p className="text-sm font-medium text-destructive mt-2 pl-7">
                      {form.formState.errors.consentMediaUsage.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="btn-primary w-full h-14 text-lg mt-8"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
