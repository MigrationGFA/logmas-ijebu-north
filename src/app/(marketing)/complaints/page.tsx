"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PageShell, PageHero } from "@/components/page-shell";
import { MessageSquare, LogIn } from "lucide-react";

// export const metadata = {
//     title: "Complaints & Support  -  Ijebu North East LGA",
//     description: "Raise a concern with the council and we'll route it to the right department and follow up.",
//     openGraph: {
//         title: "Complaints & Support  -  Ijebu North East LGA",
//         description: "Submit a complaint to the council.",
//     },
// };

export default function ComplaintsPage() {
    const [ref, setRef] = useState<string | null>(null);
    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const id = `CMP-${Date.now().toString().slice(-6)}`;
        setRef(id);
        toast.success(`Complaint ${id} submitted. We'll respond within 48 hours.`);
        e.currentTarget.reset();
    };

    return (
        <PageShell>
            <PageHero
                eyebrow="Complaints & Support"
                title="We're listening"
                subtitle="Every submission is logged, assigned to a department and tracked through to resolution."
            />
            <section className="container mx-auto px-4 py-14 grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-6 bg-gradient-card border-border/40">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Full name</Label>
                                <Input required className="mt-1.5" />
                            </div>
                            <div>
                                <Label>Phone / Email</Label>
                                <Input required className="mt-1.5" />
                            </div>
                        </div>
                        <div>
                            <Label>Category</Label>
                            <Select defaultValue="service">
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="service">Service Delivery</SelectItem>
                                    <SelectItem value="revenue">Revenue / Levy</SelectItem>
                                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                    <SelectItem value="staff">Staff Conduct</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Subject</Label>
                            <Input required className="mt-1.5" />
                        </div>
                        <div>
                            <Label>Describe your complaint</Label>
                            <Textarea rows={5} required className="mt-1.5" />
                        </div>
                        <Button type="submit" className="bg-gradient-hero shadow-elegant">
                            <MessageSquare className="h-4 w-4 mr-1.5" /> Submit complaint
                        </Button>
                        {ref && (
                            <p className="text-sm text-success">
                                Reference: {ref}. Track responses in your IJEJU NORTHEAST PORTAL dashboard.
                            </p>
                        )}
                    </form>
                </Card>
                <Card className="p-6 bg-gradient-hero text-primary-foreground border-0">
                    <h3 className="font-bold">Already registered?</h3>
                    <p className="mt-2 text-sm opacity-90">
                        Sign in to the PORTAL to submit, track and chat with the assigned officer directly.
                    </p>
                    <Button asChild className="mt-5 bg-gold text-gold-foreground hover:bg-gold/90">
                        <Link href="/login">
                            <LogIn className="h-4 w-4 mr-1.5" /> Sign in
                        </Link>
                    </Button>
                    <div className="mt-6 text-xs opacity-80 space-y-1">
                        <div>
                            Average response: <b>under 48 hours</b>
                        </div>
                        <div>
                            Resolution SLA: <b>7 working days</b>
                        </div>
                        <div>Escalation: Office of the Chairman</div>
                    </div>
                </Card>
            </section>
        </PageShell>
    );
}

