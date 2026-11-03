import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAdmin } from "../components/admin/AdminContext";
import { Empty, ErrorNote, PageTitle } from "../components/admin/AdminUi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { formatGHS } from "../data/products";
import { PRODUCT_SELECT, type ProductRow } from "../lib/catalog";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

const CATEGORIES = ["Tees", "Hoodies", "Jackets", "Bottoms", "Accessories"];
const BADGES = ["", "NEW", "TRENDING", "BEST SELLER", "LIMITED", "ESSENTIAL"];
const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

type SizeRow = { label: string; stock: number };

function useProductsQuery() {
  const { supabase } = useAdmin();
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as ProductRow[]).map((p) => ({
        ...p,
        product_sizes: [...(p.product_sizes ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
  });
}

function AdminProducts() {
  const products = useProductsQuery();
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);

  return (
    <div>
      <PageTitle
        title="Products"
        description="Change prices and stock, hide items, or add new products. Changes show on the store within a minute."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus size={15} /> Add product
          </Button>
        }
      />
      <ErrorNote error={products.error} />

      {products.isLoading ? (
        <Empty>Loading products…</Empty>
      ) : (products.data ?? []).length === 0 ? (
        <Empty>No products yet. Run supabase/seed.sql or add one.</Empty>
      ) : (
        <div className="space-y-3">
          {products.data!.map((p) => (
            <ProductRowCard key={p.id} product={p} onEdit={() => setEditing(p)} />
          ))}
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {editing !== null && (
            <ProductEditor
              product={editing === "new" ? null : editing}
              existingIds={(products.data ?? []).map((p) => p.id)}
              onDone={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** One product with inline stock editing and a visibility toggle */
function ProductRowCard({ product, onEdit }: { product: ProductRow; onEdit: () => void }) {
  const { supabase } = useAdmin();
  const queryClient = useQueryClient();
  const [stock, setStock] = useState<Record<string, string>>({});

  const dirty = Object.keys(stock).length > 0;

  const saveStock = useMutation({
    mutationFn: async () => {
      for (const [label, value] of Object.entries(stock)) {
        const n = Math.max(0, Math.floor(Number(value) || 0));
        const { error } = await supabase
          .from("product_sizes")
          .update({ stock: n })
          .eq("product_id", product.id)
          .eq("label", label);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setStock({});
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (isActive: boolean) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: isActive })
        .eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const totalStock = (product.product_sizes ?? []).reduce((n, s) => n + s.stock, 0);

  return (
    <div
      className={`rounded-lg border bg-white p-3 sm:p-4 ${product.is_active ? "" : "opacity-60"}`}
    >
      <div className="flex gap-3">
        <img
          src={product.images?.front}
          alt=""
          className="h-20 w-20 shrink-0 rounded bg-neutral-100 object-contain"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{product.name}</p>
              <p className="text-sm text-neutral-500">
                {product.colorway} · {formatGHS(Number(product.price))}
                {product.compare_at_price && (
                  <span className="ml-1 line-through">
                    {formatGHS(Number(product.compare_at_price))}
                  </span>
                )}
                {product.badge && (
                  <span className="ml-2 rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {product.badge}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-neutral-600">
                <Switch
                  checked={product.is_active}
                  onCheckedChange={(v) => toggleActive.mutate(v)}
                  aria-label="Visible on store"
                />
                {product.is_active ? "Visible" : "Hidden"}
              </label>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil size={14} /> Edit
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            {(product.product_sizes ?? []).map((s) => {
              const value = stock[s.label] ?? String(s.stock);
              const n = Number(value);
              return (
                <label key={s.label} className="flex flex-col items-center gap-1 text-xs">
                  <span className="font-medium text-neutral-600">{s.label}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => setStock({ ...stock, [s.label]: e.target.value })}
                    className={`h-9 w-14 rounded-md border text-center tabular-nums ${
                      n === 0 ? "border-red-300 bg-red-50" : n <= 3 ? "border-amber-300 bg-amber-50" : ""
                    }`}
                    aria-label={`Stock for size ${s.label}`}
                  />
                </label>
              );
            })}
            <span className="pb-2 text-xs text-neutral-500">{totalStock} in stock</span>
            {dirty && (
              <div className="flex gap-2 pb-0.5">
                <Button size="sm" onClick={() => saveStock.mutate()} disabled={saveStock.isPending}>
                  {saveStock.isPending ? "Saving…" : "Save stock"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setStock({})}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
          {(saveStock.error || toggleActive.error) && (
            <p className="mt-2 text-sm text-red-600">
              {((saveStock.error || toggleActive.error) as Error).message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

async function uploadImage(supabase: SupabaseClient, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { supabase } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border bg-neutral-50">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={20} className="text-neutral-400" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-neutral-50">
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setError(null);
                try {
                  onChange(await uploadImage(supabase, file));
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          {value && (
            <button
              type="button"
              className="text-xs text-neutral-500 hover:underline"
              onClick={() => onChange("")}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ProductEditor({
  product,
  existingIds,
  onDone,
}: {
  product: ProductRow | null;
  existingIds: string[];
  onDone: () => void;
}) {
  const { supabase } = useAdmin();
  const queryClient = useQueryClient();
  const isNew = product === null;

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    colorway: product?.colorway ?? "",
    category: product?.category ?? "Tees",
    collection: product?.collection ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    compareAtPrice: product?.compare_at_price ? String(product.compare_at_price) : "",
    badge: product?.badge ?? "",
    front: product?.images?.front ?? "",
    back: product?.images?.back ?? "",
    gallery: product?.images?.gallery ?? [],
    fit: product?.details?.fit ?? "",
    fabric: product?.details?.fabric ?? "",
    care: (product?.details?.care ?? []).join("\n"),
    scripture: product?.story?.scripture ?? "",
    storyTitle: product?.story?.title ?? "",
    storyBody: product?.story?.body ?? "",
    sortOrder: String(product?.sort_order ?? existingIds.length),
    isActive: product?.is_active ?? true,
  });
  const [sizes, setSizes] = useState<SizeRow[]>(
    product
      ? (product.product_sizes ?? []).map((s) => ({ label: s.label, stock: s.stock }))
      : DEFAULT_SIZES.map((label) => ({ label, stock: 0 })),
  );
  const [newSize, setNewSize] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const slug = slugify(form.slug || `${form.name} ${form.colorway}`);
      if (!form.name.trim()) throw new Error("Name is required");
      if (!slug) throw new Error("Slug is required");
      if (!form.front) throw new Error("Upload a front image");
      const price = Number(form.price);
      if (!(price > 0)) throw new Error("Enter a price above 0");
      const compare = form.compareAtPrice ? Number(form.compareAtPrice) : null;
      if (compare !== null && !(compare > price)) {
        throw new Error("“Compare at” price must be higher than the price (or leave it empty)");
      }
      const id = product?.id ?? slug;
      if (isNew && existingIds.includes(id)) throw new Error("A product with this slug already exists");

      const care = form.care
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean);
      const row = {
        id,
        slug,
        name: form.name.trim(),
        colorway: form.colorway.trim(),
        category: form.category,
        collection: form.collection.trim() || null,
        collection_slug: form.collection.trim() ? slugify(form.collection) : null,
        description: form.description.trim() || null,
        price,
        compare_at_price: compare,
        badge: form.badge || null,
        images: {
          front: form.front,
          ...(form.back ? { back: form.back } : {}),
          ...(form.gallery.length ? { gallery: form.gallery } : {}),
        },
        details:
          form.fit || form.fabric || care.length
            ? {
                ...(form.description ? { description: form.description.trim() } : {}),
                ...(form.fit ? { fit: form.fit.trim() } : {}),
                ...(form.fabric ? { fabric: form.fabric.trim() } : {}),
                ...(care.length ? { care } : {}),
              }
            : null,
        story:
          form.storyTitle && form.storyBody
            ? {
                title: form.storyTitle.trim(),
                body: form.storyBody.trim(),
                ...(form.scripture ? { scripture: form.scripture.trim() } : {}),
              }
            : null,
        sort_order: Math.floor(Number(form.sortOrder) || 0),
        is_active: form.isActive,
        ...(isNew ? { size_chart: null, related_slugs: [] } : {}),
      };

      const { error } = isNew
        ? await supabase.from("products").insert(row)
        : await supabase.from("products").update(row).eq("id", product.id);
      if (error) throw error;

      // Sizes: upsert the list, remove any that were deleted
      const cleaned = sizes.filter((s) => s.label.trim());
      if (cleaned.length) {
        const { error: sizeError } = await supabase.from("product_sizes").upsert(
          cleaned.map((s, i) => ({
            product_id: id,
            label: s.label.trim().toUpperCase(),
            stock: Math.max(0, Math.floor(s.stock || 0)),
            sort_order: i,
          })),
        );
        if (sizeError) throw sizeError;
      }
      const removed = (product?.product_sizes ?? [])
        .map((s) => s.label)
        .filter((label) => !cleaned.some((s) => s.label.trim().toUpperCase() === label));
      if (removed.length) {
        const { error: delError } = await supabase
          .from("product_sizes")
          .delete()
          .eq("product_id", id)
          .in("label", removed);
        if (delError) throw delError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onDone();
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").delete().eq("id", product!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onDone();
    },
  });

  const field = (
    key: keyof typeof form,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pf-${key}`}>{label}</Label>
      <Input
        id={`pf-${key}`}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
    </div>
  );

  return (
    <>
      <SheetHeader className="text-left">
        <SheetTitle>{isNew ? "Add product" : `Edit ${product.name}`}</SheetTitle>
      </SheetHeader>

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <section className="space-y-3">
          {field("name", "Name *", { required: true, placeholder: "The Most Valuable Fish Tee" })}
          <div className="grid gap-3 sm:grid-cols-2">
            {field("colorway", "Colour", { placeholder: "Vintage Black" })}
            <div className="space-y-1.5">
              <Label htmlFor="pf-category">Category</Label>
              <select
                id="pf-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="h-9 w-full rounded-md border bg-white px-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {field("slug", "URL slug", {
            placeholder: slugify(`${form.name} ${form.colorway}`) || "auto from name",
            disabled: !isNew,
          })}
          {field("collection", "Collection", { placeholder: "e.g. Thorny Crown" })}
          <div className="space-y-1.5">
            <Label htmlFor="pf-description">Description</Label>
            <Textarea
              id="pf-description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {field("price", "Price (GH₵) *", { type: "number", min: 0, step: "0.01", required: true })}
          {field("compareAtPrice", "Compare at (GH₵)", {
            type: "number",
            min: 0,
            step: "0.01",
            placeholder: "Shows as sale",
          })}
          <div className="space-y-1.5">
            <Label htmlFor="pf-badge">Badge</Label>
            <select
              id="pf-badge"
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
              className="h-9 w-full rounded-md border bg-white px-2 text-sm"
            >
              {BADGES.map((b) => (
                <option key={b} value={b}>
                  {b || "None"}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-neutral-500 sm:col-span-3">
            The product with the TRENDING badge is featured on the homepage.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Images</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageField label="Front *" value={form.front} onChange={(v) => set("front", v)} />
            <ImageField label="Back" value={form.back} onChange={(v) => set("back", v)} />
          </div>
          <div className="space-y-1.5">
            <Label>Extra photos</Label>
            <div className="flex flex-wrap gap-2">
              {form.gallery.map((url, i) => (
                <div key={url + i} className="relative">
                  <img src={url} alt="" className="h-16 w-16 rounded border bg-neutral-50 object-contain" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => set("gallery", form.gallery.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-neutral-900 p-0.5 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <GalleryAdd onAdd={(url) => set("gallery", [...form.gallery, url])} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Sizes & stock</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s, i) => (
              <div key={i} className="flex items-center gap-1 rounded-md border p-1">
                <span className="w-9 text-center text-xs font-semibold">{s.label}</span>
                <input
                  type="number"
                  min={0}
                  value={s.stock}
                  onChange={(e) =>
                    setSizes(sizes.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)))
                  }
                  className="h-8 w-14 rounded border text-center text-sm tabular-nums"
                  aria-label={`Stock for ${s.label}`}
                />
                <button
                  type="button"
                  aria-label={`Remove size ${s.label}`}
                  onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
                  className="p-1 text-neutral-400 hover:text-neutral-900"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <Input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Size"
                className="h-9 w-20"
                maxLength={6}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const label = newSize.trim().toUpperCase();
                  if (label && !sizes.some((s) => s.label === label)) {
                    setSizes([...sizes, { label, stock: 0 }]);
                  }
                  setNewSize("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </section>

        <details className="rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-semibold">Details & story (optional)</summary>
          <div className="mt-3 space-y-3">
            {field("fit", "Fit", { placeholder: "Oversized boxy cut." })}
            {field("fabric", "Fabric", { placeholder: "100% combed cotton (280 GSM)." })}
            <div className="space-y-1.5">
              <Label htmlFor="pf-care">Care (one per line)</Label>
              <Textarea id="pf-care" rows={3} value={form.care} onChange={(e) => set("care", e.target.value)} />
            </div>
            {field("scripture", "Scripture", { placeholder: "Matthew 17:27" })}
            {field("storyTitle", "Story title")}
            <div className="space-y-1.5">
              <Label htmlFor="pf-storyBody">Story</Label>
              <Textarea
                id="pf-storyBody"
                rows={4}
                value={form.storyBody}
                onChange={(e) => set("storyBody", e.target.value)}
              />
            </div>
          </div>
        </details>

        <section className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
            Visible on store
          </label>
          <div className="flex items-center gap-2 text-sm">
            <Label htmlFor="pf-sortOrder">Position</Label>
            <Input
              id="pf-sortOrder"
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
              className="h-9 w-20"
            />
          </div>
        </section>

        {save.error && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : isNew ? "Create product" : "Save changes"}
            </Button>
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          </div>
          {!isNew &&
            (confirmDelete ? (
              <div className="flex items-center gap-2 text-sm">
                <span>Delete permanently?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove.mutate()}
                  disabled={remove.isPending}
                >
                  Yes, delete
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  No
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} /> Delete
              </Button>
            ))}
        </div>
        {!isNew && (
          <p className="text-xs text-neutral-500">
            Tip: to stop selling an item, switch off “Visible on store” instead of deleting it. Past
            orders keep their details either way.
          </p>
        )}
        {remove.error && <p className="text-sm text-red-600">{(remove.error as Error).message}</p>}
      </form>
    </>
  );
}

function GalleryAdd({ onAdd }: { onAdd: (url: string) => void }) {
  const { supabase } = useAdmin();
  const [busy, setBusy] = useState(false);
  return (
    <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded border border-dashed text-neutral-400 hover:bg-neutral-50">
      {busy ? <span className="text-[10px]">…</span> : <Plus size={18} />}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            onAdd(await uploadImage(supabase, file));
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
    </label>
  );
}
