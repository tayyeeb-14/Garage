import axios from 'axios';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { inventoryService, InventoryItem, PART_CATEGORIES } from '../services/inventoryService';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface PartFormProps {
  initialPart?: Partial<InventoryItem>;
  onSave?: (part: InventoryItem) => void;
  onCancel?: () => void;
}

const PartForm = ({ initialPart, onSave, onCancel }: PartFormProps) => {
  const { token } = useAuth();
  const [itemName, setItemName] = useState(initialPart?.itemName ?? '');
  const [shortDescription, setShortDescription] = useState(initialPart?.shortDescription ?? initialPart?.description ?? '');
  const [fullDescription, setFullDescription] = useState(initialPart?.fullDescription ?? '');
  const [category, setCategory] = useState(initialPart?.category ?? '');
  const [brand, setBrand] = useState(initialPart?.brand ?? '');
  const [sku, setSku] = useState(initialPart?.sku ?? '');
  const [compatibleVehicles, setCompatibleVehicles] = useState(initialPart?.compatibleVehicles?.join(', ') ?? '');
  const [sellingPrice, setSellingPrice] = useState(initialPart?.sellingPrice ?? 0);
  const [originalPrice, setOriginalPrice] = useState(initialPart?.originalPrice ?? 0);
  const [discountPercent, setDiscountPercent] = useState(initialPart?.discountPercent ?? 0);
  const [quantity, setQuantity] = useState(initialPart?.quantity ?? 0);
  const [minimumStock, setMinimumStock] = useState(initialPart?.minimumStock ?? 5);
  const [unit, setUnit] = useState(initialPart?.unit ?? 'piece');
  const [weight, setWeight] = useState(initialPart?.weight ?? 0);
  const [isActive, setIsActive] = useState(initialPart?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initialPart?.isFeatured ?? false);
  const [thumbnailPreview, setThumbnailPreview] = useState(initialPart?.image ?? '');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialPart?.galleryImages ?? []);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateImageFile = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WebP images are allowed.';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Each image must be 5MB or smaller.';
    }
    return null;
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setRemoveThumbnail(false);
    if (thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setError(null);
    setGalleryFiles((current) => [...current, ...files]);
    setGalleryPreviews((current) => [...current, ...files.map((file) => URL.createObjectURL(file))]);
  };

  const removeGalleryPreview = (index: number) => {
    const preview = galleryPreviews[index];
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setGalleryPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setGalleryFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const validateForm = () => {
    if (!itemName.trim() || itemName.trim().length < 2) {
      return 'Part name must be at least 2 characters.';
    }
    if (!category.trim()) {
      return 'Category is required.';
    }
    if (!sku.trim()) {
      return 'SKU is required.';
    }
    if (sellingPrice < 0) {
      return 'Selling price cannot be negative.';
    }
    if (sellingPrice <= 0) {
      return 'Selling price must be greater than zero.';
    }
    if (originalPrice < 0) {
      return 'Original price cannot be negative.';
    }
    if (quantity < 0 || !Number.isInteger(quantity)) {
      return 'Stock quantity must be a whole number of zero or more.';
    }
    if (discountPercent < 0 || discountPercent > 100) {
      return 'Discount must be between 0 and 100.';
    }
    if (shortDescription.length > 500) {
      return 'Short description must be 500 characters or fewer.';
    }
    if (fullDescription.length > 5000) {
      return 'Full description must be 5000 characters or fewer.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('itemName', itemName.trim());
      formData.append('shortDescription', shortDescription.trim());
      formData.append('fullDescription', fullDescription.trim());
      formData.append('description', shortDescription.trim());
      formData.append('category', category.trim());
      formData.append('brand', brand.trim());
      formData.append('sku', sku.trim());
      formData.append('compatibleVehicles', compatibleVehicles);
      formData.append('sellingPrice', String(sellingPrice));
      formData.append('originalPrice', String(originalPrice));
      formData.append('discountPercent', String(discountPercent));
      formData.append('quantity', String(quantity));
      formData.append('minimumStock', String(minimumStock));
      formData.append('unit', unit.trim());
      formData.append('weight', String(weight));
      formData.append('isActive', String(isActive));
      formData.append('isFeatured', String(isFeatured));

      if (removeThumbnail) {
        formData.append('removeThumbnail', 'true');
      }

      if (thumbnailFile) {
        formData.append('thumbnailImageFile', thumbnailFile);
      }

      galleryFiles.forEach((file) => formData.append('galleryImageFiles', file));

      const saved = initialPart?._id
        ? await inventoryService.update(token, initialPart._id, formData)
        : await inventoryService.create(token, formData);

      onSave?.(saved);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Unable to save part');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to save part');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} style={formCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem' }}>{initialPart?._id ? 'Edit Part' : 'Add Part'}</h2>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Manage spare part details, pricing, stock, and visibility.</p>
        </div>
        <button type="button" onClick={onCancel} disabled={loading} style={secondaryButtonStyle}>
          Cancel
        </button>
      </div>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <input type="text" placeholder="Part Name *" value={itemName} onChange={(e) => setItemName(e.target.value)} required style={inputStyle} />
          <input type="text" placeholder="SKU *" value={sku} onChange={(e) => setSku(e.target.value)} required style={inputStyle} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} required style={inputStyle}>
            <option value="">Select Category *</option>
            {PART_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="text" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} style={inputStyle} />
        </div>

        <textarea placeholder="Short Description" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={500} style={{ ...inputStyle, minHeight: '80px' }} />
        <textarea placeholder="Full Description" value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} maxLength={5000} style={{ ...inputStyle, minHeight: '120px' }} />
        <input type="text" placeholder="Compatible Vehicle (comma-separated)" value={compatibleVehicles} onChange={(e) => setCompatibleVehicles(e.target.value)} style={inputStyle} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <input type="number" placeholder="Selling Price *" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} required min={0} step="0.01" style={inputStyle} />
          <input type="number" placeholder="Original Price" value={originalPrice} onChange={(e) => setOriginalPrice(Number(e.target.value))} min={0} step="0.01" style={inputStyle} />
          <input type="number" placeholder="Discount %" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} min={0} max={100} style={inputStyle} />
          <input type="number" placeholder="Stock Quantity *" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required min={0} step={1} style={inputStyle} />
          <input type="number" placeholder="Low Stock Threshold" value={minimumStock} onChange={(e) => setMinimumStock(Number(e.target.value))} min={0} step={1} style={inputStyle} />
          <input type="text" placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} />
          <input type="number" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(Number(e.target.value))} min={0} step="0.01" style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={fieldLabelStyle}>Thumbnail Image</div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbnailChange} />
            {thumbnailPreview ? (
              <div style={{ marginTop: '0.75rem', position: 'relative', display: 'inline-block' }}>
                <img src={thumbnailPreview} alt="Thumbnail preview" style={thumbnailPreviewStyle} />
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailFile(null);
                    setThumbnailPreview('');
                    setRemoveThumbnail(true);
                  }}
                  style={removeImageButtonStyle}
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>
          <div>
            <div style={fieldLabelStyle}>Gallery Images</div>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGalleryChange} />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {galleryPreviews.map((preview, index) => (
                <div key={`${preview}-${index}`} style={{ position: 'relative' }}>
                  <img src={preview} alt="Gallery preview" style={galleryPreviewStyle} />
                  <button type="button" onClick={() => removeGalleryPreview(index)} style={removeGalleryButtonStyle}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} style={primaryButtonStyle}>
          {loading ? 'Saving...' : initialPart?._id ? 'Update Part' : 'Create Part'}
        </button>
      </div>
    </form>
  );
};

const formCardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '1.5rem',
  boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
  border: '1px solid #e2e8f0',
  marginBottom: '1.5rem',
};

const inputStyle: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  width: '100%',
};

const fieldLabelStyle: React.CSSProperties = {
  marginBottom: '0.5rem',
  color: '#334155',
  fontWeight: 600,
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: '#334155',
  fontWeight: 600,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  borderRadius: 12,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.6rem 0.9rem',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

const errorBannerStyle: React.CSSProperties = {
  color: '#dc2626',
  marginBottom: '1rem',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 12,
  padding: '0.75rem 1rem',
};

const thumbnailPreviewStyle: React.CSSProperties = {
  width: 120,
  height: 120,
  objectFit: 'cover',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
};

const galleryPreviewStyle: React.CSSProperties = {
  width: 84,
  height: 84,
  objectFit: 'cover',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
};

const removeImageButtonStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  padding: '0.35rem 0.6rem',
  borderRadius: 8,
  border: '1px solid #fecaca',
  background: '#fff1f2',
  color: '#dc2626',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 12,
};

const removeGalleryButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 4,
  right: 4,
  width: 22,
  height: 22,
  borderRadius: 999,
  border: 'none',
  background: 'rgba(15, 23, 42, 0.75)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
};

export default PartForm;
