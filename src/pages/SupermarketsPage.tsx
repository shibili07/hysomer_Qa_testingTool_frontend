import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Key,
  LayoutList,
  Loader2,
  PencilLine,
  Plus,
  Store,
  Trash2
} from "lucide-react";
import { listSupermarkets, createSupermarket, editSupermarket, removeSupermarket, Supermarket } from "@/lib/supermarkets";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SupermarketFormState = {
  organization_id: string;
  supermarket_name: string;
  api_key: string;
};

const emptyForm: SupermarketFormState = {
  organization_id: "",
  supermarket_name: "",
  api_key: ""
};

export default function SupermarketsPage() {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [form, setForm] = useState<SupermarketFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const submitLabel = useMemo(() => (editingId ? "Save changes" : "Register Supermarket"), [editingId]);
  const totalPages = Math.max(1, Math.ceil(supermarkets.length / pageSize));
  const paginatedSupermarkets = useMemo(
    () => supermarkets.slice((page - 1) * pageSize, page * pageSize),
    [supermarkets, page, pageSize]
  );

  const refreshSupermarkets = async () => {
    const data = await listSupermarkets();
    setSupermarkets(data);
  };

  useEffect(() => {
    setLoading(true);
    refreshSupermarkets()
      .catch((error: unknown) => {
        console.error(error);
        toast.error("Failed to load supermarkets.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.supermarket_name || !form.organization_id || !form.api_key) {
      toast.error("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await editSupermarket(editingId, form);
        toast.success("Supermarket updated.");
      } else {
        await createSupermarket(form);
        toast.success("Supermarket registered.");
      }
      resetForm();
      await refreshSupermarkets();
    } catch (error: any) {
      console.error("Supermarket submission error:", error);
      toast.error(error?.message || "Action failed. Check API connection.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (sm: Supermarket) => {
    setEditingId(sm.id || sm._id || null);
    setForm({
      organization_id: sm.organization_id,
      supermarket_name: sm.supermarket_name,
      api_key: sm.api_key
    });
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Delete this supermarket?");
    if (!ok) return;
    setLoading(true);
    try {
      await removeSupermarket(id);
      toast.success("Supermarket deleted.");
      await refreshSupermarkets();
    } catch (error) {
      console.error(error);
      toast.error("Delete failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[1200px] space-y-8">
      <div className="flex flex-col gap-5 border-b border-zinc-200 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />
            Infrastructure Terminal
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">Supermarkets</h1>
          <p className="mt-2 text-base font-medium text-zinc-500">
            Manage supermarket branches, organization IDs, and API authentication keys.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-xl px-4 py-2 font-semibold">
          Network Management
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-indigo-500" />
              {editingId ? "Edit Supermarket" : "Register Branch"}
            </CardTitle>
            <CardDescription>
              {editingId 
                ? "Update the branch credentials below." 
                : "Add a new supermarket branch to the QA testing network."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" /> Organization ID
                </label>
                <Input
                  placeholder="e.g. ORG-12345"
                  value={form.organization_id}
                  onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Store className="h-3.5 w-3.5" /> Supermarket Name
                </label>
                <Input
                  placeholder="e.g. City Central Market"
                  value={form.supermarket_name}
                  onChange={(e) => setForm({ ...form, supermarket_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Key className="h-3.5 w-3.5" /> API Key
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="submit" className="flex-1 rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {submitLabel}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" className="rounded-xl" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="h-5 w-5 text-indigo-500" />
              Registered Branches
            </CardTitle>
            <CardDescription>All active supermarkets in your testing ecosystem.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                    <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-wider">Org ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">Name</TableHead>
                    <TableHead className="w-[150px] text-[10px] font-bold uppercase tracking-wider">API Key</TableHead>
                    <TableHead className="w-[100px] text-right text-[10px] font-bold uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSupermarkets.map((sm) => (
                    <TableRow key={sm.id || sm._id}>
                      <TableCell className="font-mono text-xs text-zinc-600">{sm.organization_id}</TableCell>
                      <TableCell className="font-semibold text-zinc-900">{sm.supermarket_name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">
                          {sm.api_key.substring(0, 4)}••••{sm.api_key.substring(sm.api_key.length - 4)}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="secondary" 
                            className="h-8 w-8 p-0 rounded-lg" 
                            onClick={() => startEdit(sm)}
                            title="Edit"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="h-8 w-8 p-0 rounded-lg bg-rose-50 text-rose-600 border-none hover:bg-rose-100" 
                            onClick={() => onDelete((sm.id || sm._id)!)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {supermarkets.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-zinc-400">
                        No supermarkets registered yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-zinc-100 p-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={supermarkets.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size: number) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
