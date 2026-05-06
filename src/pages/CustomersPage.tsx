
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
    <section className="mx-auto max-w-[1200px] space-y-8">
      <div className="flex flex-col gap-5 border-b border-zinc-200 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />
            Customer Terminal
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">Customers</h1>
          <p className="mt-2 text-base font-medium text-zinc-500">
            Register customers and synchronize records with external billing systems.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-xl px-4 py-3">
          Management
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-zinc-500" />
              Customer Registration
            </CardTitle>
            <CardDescription>Enter the customer's primary contact information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <User className="h-4 w-4 text-zinc-400" /> Full Name
                </label>
                <Input
                  placeholder="John Doe"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                    <Phone className="h-4 w-4 text-zinc-400" /> Phone Number
                  </label>
                  <Input
                    placeholder="+1 234 567 890"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                    <Mail className="h-4 w-4 text-zinc-400" /> Email Address
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
                className="h-12 w-full rounded-2xl"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
                {isSubmitting ? "Processing..." : "Create Customer Record"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Actions for the last created customer.</CardDescription>
          </CardHeader>
          <CardContent>
            {lastCreatedCustomer ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">{lastCreatedCustomer.name}</p>
                      <p className="max-w-[150px] truncate text-[11px] font-medium text-zinc-500">
                        ID: {lastCreatedCustomer.id}
                      </p>
                      <Badge variant="success" className="mt-2">Created</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Available Actions</p>
                  <Button
                    onClick={handleSync}
                    disabled={isSubmitting}
                    variant="secondary"
                    className="group h-14 w-full rounded-2xl border-dashed"
                  >
                    <div className="flex w-full items-center justify-between px-2">
                      <div className="flex items-center">
                        <RefreshCw className={cn("mr-3 h-5 w-5 text-zinc-400 group-hover:text-zinc-950", isSubmitting && "animate-spin")} />
                        <span className="font-semibold text-zinc-700 group-hover:text-zinc-950">Sync Externally</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-zinc-950" />
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 py-14 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                  <User className="h-8 w-8 text-zinc-300" />
                </div>
                <p className="text-sm font-medium text-zinc-400">No recent customer created.<br />Fill out the form to begin.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
