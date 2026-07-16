import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterAttendee, useRegistrationStatus } from '@/lib/api-client-react';
import { Check, AlertCircle, Calendar, MapPin, Ticket, IdCard, Lock, Users } from 'lucide-react';

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
  nationalIdUrl: z.string().url('Please enter a valid URL for National ID').optional().or(z.literal('')),
  birthCertificateUrl: z.string().url('Please enter a valid URL for Birth Certificate').optional().or(z.literal('')),
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
}).refine(data => {
  if (!data.nationalIdUrl && !data.birthCertificateUrl) {
    return false;
  }
  return true;
}, {
  message: "Please provide at least one document URL",
  path: ["nationalIdUrl"],
});

function Footer() {
  return (
    <footer className="w-full mt-12 pt-8 border-t border-border/40 text-center text-muted-foreground text-sm max-w-3xl">
      <p className="mb-3 font-semibold text-foreground">
        Need help? Contact us
      </p>
      <div className="flex flex-wrap justify-center gap-6">
        <a
          href="https://wa.me/201099951278"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#25D366] hover:opacity-80 transition-opacity font-semibold"
        >
          <svg className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          +201099951278
        </a>
        <a
          href="mailto:grvteam20@gmail.com"
          className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity font-semibold"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          grvteam20@gmail.com
        </a>
      </div>
      <p className="mt-6 text-xs text-muted-foreground/60">
        © 2026 GRV × CIC. All rights reserved.
      </p>
    </footer>
  );
}

// ── Main Registration Page ───────────────────────────────────────────────────

export default function RegistrationPage() {
  const [isSuccess, setIsSuccess] = useState(false);

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
      nationalIdUrl: '',
      birthCertificateUrl: '',
    },
  });

  const registerMutation = useRegisterAttendee();
  const watchEducationalStage = form.watch('educationalStageDropdown');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const finalEducationalStage = values.educationalStageDropdown === 'Other'
      ? values.educationalStageOther || 'Other'
      : values.educationalStageDropdown;

    registerMutation.mutate({
      data: {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        mobileNumber: values.mobileNumber.trim(),
        whatsappNumber: values.whatsappNumber.trim(),
        gender: values.gender,
        age: values.age,
        governorate: values.governorate,
        educationalStage: finalEducationalStage,
        consentMediaUsage: true,
        // Extra fields the backend validates (not in the generated schema type)
        ...({
          nationalIdFileUrl: values.nationalIdUrl?.trim() || '',
          birthPaperFileUrl: values.birthCertificateUrl?.trim() || '',
        } as object),
      } as Parameters<typeof registerMutation.mutate>[0]['data']
    }, {
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 py-20 relative z-10">
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
        <Footer />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 py-20 relative z-10">
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
                form.reset();
              }}
            >
              Submit Another Registration
            </Button>
          </CardContent>
        </Card>
        <Footer />
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
                        Provide URLs to your <strong>National ID</strong> or <strong>Birth Certificate</strong> documents (or both).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationalIdUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>National ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/my-id.jpg"
                              className="bg-input/50"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Please upload your National ID to Google Drive, make sure the sharing permission is set to <strong>"Anyone with the link can view"</strong>, then paste the shared link here.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthCertificateUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Certificate URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/birth-cert.jpg"
                              className="bg-input/50"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Please upload your Birth Certificate to Google Drive, make sure the sharing permission is set to <strong>"Anyone with the link can view"</strong>, then paste the shared link here.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
        <Footer />
      </div>
    </div>
  );
}
