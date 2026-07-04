import { ChangeEvent, FormEvent, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { serviceService, ServiceItem } from '../services/serviceService';

interface ServiceFormProps {
  initialService?: Partial<ServiceItem>;
  onSave?: (service: ServiceItem) => void;
  onCancel?: () => void;
}

const ServiceForm = ({ initialService, onSave, onCancel }: ServiceFormProps) => {
  const { token } = useAuth();
  const [name, setName] = useState(initialService?.name ?? '');
  const [description, setDescription] = useState(initialService?.description ?? '');
  const [price, setPrice] = useState(initialService?.price ?? 0);
  const [estimatedDuration, setEstimatedDuration] = useState(initialService?.estimatedDuration ?? 30);
  const [category, setCategory] = useState(typeof initialService?.category === 'string' ? initialService.category : String(initialService?.category ?? '') );
  const [isActive, setIsActive] = useState(initialService?.isActive ?? true);
  const [thumbnailPreview, setThumbnailPreview] = useState(initialService?.thumbnailImage ?? '');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialService?.galleryImages ?? []);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    setGalleryFiles((current) => [...current, ...files]);
    setGalleryPreviews((current) => [...current, ...files.map((file) => URL.createObjectURL(file))]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (!name.trim() || !category.trim()) {
      setError('Name and category are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', String(price));
      formData.append('estimatedDuration', String(estimatedDuration));
      formData.append('category', category.trim());
      formData.append('isActive', String(isActive));

      if (thumbnailFile) {
        formData.append('thumbnailImageFile', thumbnailFile);
      }

      if (galleryFiles.length) {
        galleryFiles.forEach((file) => formData.append('galleryImageFiles', file));
      }

      const service = initialService?._id
        ? await serviceService.update(token, initialService._id, formData)
        : await serviceService.create(token, formData);

      onSave?.(service);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save service');
    } finally {
      setLoading(false);
    }
  };

  const currentAction = initialService?._id ? 'Update Service' : 'Create Service';

  return (
    <form noValidate onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>{currentAction}</h2>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Save images, pricing, category, and visibility for the service.</p>
        </div>
        <button type="button" onClick={onCancel} style={{ padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>

      {error && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          name="name"
          placeholder="Service Name *"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <input
            type="text"
            name="category"
            placeholder="Category *"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
            style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}
          />
          <input
            type="number"
            placeholder="Price *"
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
            required
            min={0}
            step="0.01"
            style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <input
            type="number"
            placeholder="Estimated Time (minutes)"
            value={estimatedDuration}
            onChange={(event) => setEstimatedDuration(Number(event.target.value))}
            min={15}
            style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            Thumbnail image
            <input type="file" accept="image/*" onChange={handleThumbnailChange} />
          </label>
          {thumbnailPreview ? <img src={thumbnailPreview} alt="Thumbnail preview" style={{ width: '160px', borderRadius: '12px', objectFit: 'cover' }} /> : null}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            Gallery images
            <input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
          </label>
          {galleryPreviews.length > 0 ? (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {galleryPreviews.map((preview, index) => (
                <div key={`${preview}-${index}`} style={{ position: 'relative' }}>
                  <img src={preview} alt={`Gallery preview ${index + 1}`} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '12px' }} />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' }}>
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          Active
        </label>
      </div>

      <button type="submit" disabled={loading} style={{ padding: '0.95rem 1rem', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Saving...' : currentAction}
      </button>
    </form>
  );
};

export default ServiceForm;
