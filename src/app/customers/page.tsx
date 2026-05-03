"use client";

import React, { useState } from "react";
import { createCustomer, syncCustomer } from "@/lib/customers";
import { CustomerInput } from "@/lib/customers";
import { toast } from "sonner";
import {
  UserPlus,
  Phone,
  Mail,
  User,
  RefreshCw,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function CustomerPage() {
  const [formData, setFormData] = useState<Partial<CustomerInput>>({
    name: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreatedCustomer, setLastCreatedCustomer] = useState<{ id: string, name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Name and Phone are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const customer = await createCustomer(formData as CustomerInput);
      setLastCreatedCustomer({ id: customer.customerId, name: customer.name || "Guest" });
      toast.success("Customer created successfully");
      setFormData({ name: "", phone: "", email: "" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    if (!lastCreatedCustomer) return;
    setIsSubmitting(true);
    try {
      await syncCustomer(lastCreatedCustomer.id, {
        items: [
          { productName: "Sample Product", quantity: 1, unitPrice: 100, totalPrice: 100 }
        ],
        totalAmount: 100
      });
      toast.success("External sync triggered successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "External sync failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6 max-w-4xl mx-auto">
      {/* Premium Header */}
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-800 text-white border-0 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <CardHeader>
          <div className="flex items-center gap-2 relative z-10">
            <CardTitle className="text-white text-2xl">Customers</CardTitle>
            <Badge variant="secondary" className="bg-white text-slate-900 border-0 font-bold px-3">
              Management
            </Badge>
          </div>
          <CardDescription className="text-slate-300 relative z-10">
            Register new customers and synchronize their data with external billing systems.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Registration Form */}
        <Card className="md:col-span-3 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              Customer Registration
            </CardTitle>
            <CardDescription>Enter the customer's primary contact information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Full Name
                </label>
                <Input
                  placeholder="John Doe"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" /> Phone Number
                  </label>
                  <Input
                    placeholder="+1 234 567 890"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" /> Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-xl transition-all shadow-lg shadow-slate-200"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-5 h-5 mr-2" />
                )}
                {isSubmitting ? "Processing..." : "Create Customer Record"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Status & Sync Card */}
        <Card className="md:col-span-2 border-slate-100 shadow-sm bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Actions for the last created customer.</CardDescription>
          </CardHeader>
          <CardContent>
            {lastCreatedCustomer ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{lastCreatedCustomer.name}</p>
                      <p className="text-[11px] font-medium text-slate-400 truncate max-w-[150px]">
                        ID: {lastCreatedCustomer.id}
                      </p>
                      <Badge className="mt-2 bg-emerald-500 hover:bg-emerald-600">Created</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Available Actions</p>
                  <Button
                    onClick={handleSync}
                    disabled={isSubmitting}
                    variant="secondary"
                    className="w-full py-6 border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all rounded-2xl group"
                  >
                    <div className="flex items-center justify-between w-full px-2">
                      <div className="flex items-center">
                        <RefreshCw className={cn("w-5 h-5 mr-3 text-slate-400 group-hover:text-indigo-500", isSubmitting && "animate-spin")} />
                        <span className="text-slate-600 group-hover:text-indigo-700 font-bold">Sync Externally</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 font-medium">No recent customer created.<br />Fill out the form to begin.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
