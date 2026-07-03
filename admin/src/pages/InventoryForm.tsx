import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { inventoryService, InventoryItem } from '../services/inventoryService';

interface InventoryFormProps {
  item?: InventoryItem;
  onSave?: (item: InventoryItem) => void;
  onCancel?: () => void;
}

const InventoryForm = ({ item, onSave, onCancel }: InventoryFormProps) => {
  const { token } = useAuth();
  const [form, setForm] = useState({
    itemName: item?.itemName ?? '',
    sku: item?.sku ?? '',
    barcode: item?.barcode ?? '',
    category: item?.category ?? '',
    brand: item?.brand ?? '',
    compatibleVehicles: item?.compatibleVehicles?.join(', ') ?? '',
    supplierName: item?.supplierName ?? '',
    supplierPhone: item?.supplierPhone ?? '',
    purchasePrice: item?.purchasePrice ?? 0,
    sellingPrice: item?.sellingPrice ?? 0,
    quantity: item?.quantity ?? 0,
    minimumStock: item?.minimumStock ?? 0,
    maximumStock: item?.maximumStock ?? 0,
    unit: item?.unit ?? '',
    rackLocation: item?.rackLocation ?? '',
    image: item?.image ?? '',
    description: item?.description ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(item?.image ?? null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreview(result);
        setForm((prev) => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...form,
        compatibleVehicles: form.compatibleVehicles.split(',').map((v) => v.trim()).filter(Boolean),
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity),
        minimumStock: Number(form.minimumStock),
        maximumStock: Number(form.maximumStock),
      };

      let saved;
      if (item?._id) {
        saved = await inventoryService.update(token, item._id, payload);
      } else {
        saved = await inventoryService.create(token, payload);
      }

      onSave?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '800px' }}>
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <input type="text" placeholder="Item Name *" value={form.itemName} onChange={(e) => setForm((prev) => ({ ...prev, itemName: e.target.value }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
        <input type="text" placeholder="SKU *" value={form.sku} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
        <input type="text" placeholder="Barcode (Optional)" value={form.barcode} onChange={(e) => setForm((prev) => ({ ...prev, barcode: e.target.value }))} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <input type="text" placeholder="Category *" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
        <input type="text" placeholder="Brand *" value={form.brand} onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
        <input type="text" placeholder="Unit *" value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <input type="number" placeholder="Purchase Price *" value={form.purchasePrice} onChange={(e) => setForm((prev) => ({ ...prev, purchasePrice: e.target.value as unknown as number }))} required step="0.01" style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
        <input type="number" placeholder="Selling Price *" value={form.sellingPrice} onChange={(e) => setForm((prev) => ({ ...prev, sellingPrice: e.target.value as unknown as number }))} required step="0.01" style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
        <input type="number" placeholder="Current Quantity *" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value as unknown as number }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <input type="number" placeholder="Minimum Stock *" value={form.minimumStock} onChange={(e) => setForm((prev) => ({ ...prev, minimumStock: e.target.value as unknown as number }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
        <input type="number" placeholder="Maximum Stock *" value={form.maximumStock} onChange={(e) => setForm((prev) => ({ ...prev, maximumStock: e.target.value as unknown as number }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
        <input type="text" placeholder="Rack Location *" value={form.rackLocation} onChange={(e) => setForm((prev) => ({ ...prev, rackLocation: e.target.value }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <input type="text" placeholder="Supplier Name *" value={form.supplierName} onChange={(e) => setForm((prev) => ({ ...prev, supplierName: e.target.value }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
        <input type="tel" placeholder="Supplier Phone *" value={form.supplierPhone} onChange={(e) => setForm((prev) => ({ ...prev, supplierPhone: e.target.value }))} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
      </div>

      <input type="text" placeholder="Compatible Vehicles (comma-separated)" value={form.compatibleVehicles} onChange={(e) => setForm((prev) => ({ ...prev, compatibleVehicles: e.target.value }))} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }} />

      <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit' }} />

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <input type="file" accept="image/*" onChange={handleImageChange} style={{ flex: 1 }} />
        {preview && <img src={preview} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Saving...' : item?.inventoryId ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;
