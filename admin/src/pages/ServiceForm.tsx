import axios from 'axios';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { SERVICE_CATEGORIES, serviceService, ServiceFaqItem, ServiceItem } from '../services/serviceService';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ServiceFormProps {
  initialService?: Partial<ServiceItem>;
  onSave?: (service: ServiceItem) => void;
  onCancel?: () => void;
}

const ServiceForm = ({ initialService, onSave, onCancel }: ServiceFormProps) => {
  const { token } = useAuth();
  const [name, setName] = useState(initialService?.name ?? '');
  const [shortDescription, setShortDescription] = useState(initialService?.shortDescription ?? initialService?.description ?? '');
  const [fullDescription, setFullDescription] = useState(initialService?.fullDescription ?? '');
  const [category, setCategory] = useState(initialService?.category ?? '');
  const [price, setPrice] = useState(initialService?.price ?? 0);
  const [originalPrice, setOriginalPrice] = useState(initialService?.originalPrice ?? 0);
  const [discountPercent, setDiscountPercent] = useState(initialService?.discountPercent ?? 0);
  const [estimatedDuration, setEstimatedDuration] = useState(initialService?.estimatedDuration ?? 30);
  const [rating, setRating] = useState(initialService?.rating ?? 0);
  const [includesText, setIncludesText] = useState(initialService?.includes?.join('\n') ?? '');
  const [compatibleVehicles, setCompatibleVehicles] = useState(initialService?.compatibleVehicles?.join(', ') ?? '');
  const [faqItems, setFaqItems] = useState<ServiceFaqItem[]>(initialService?.faq?.length ? initialService.faq : [{ question: '', answer: '' }]);
  const [relatedServiceIds, setRelatedServiceIds] = useState<string[]>(
    initialService?.relatedServices?.map((item) => (typeof item === 'string' ? item : item._id)) ?? [],
  );
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [isActive, setIsActive] = useState(initialService?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initialService?.isFeatured ?? false);
  const [thumbnailPreview, setThumbnailPreview] = useState(initialService?.thumbnailImage ?? '');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialService?.galleryImages ?? []);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void serviceService.list(token, { limit: 100, status: 'active' }).then((payload) => {
      setAvailableServices((payload?.items ?? []).filter((item) => item._id !== initialService?._id));
    }).catch(() => setAvailableServices([]));
  }, [token, initialService?._id]);

  const validateImageFile = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG, and WebP images are allowed.';
    if (file.size > MAX_IMAGE_SIZE) return 'Each image must be 5MB or smaller.';
    return null;
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) { setError(validationError); return; }
    setError(null);
    setRemoveThumbnail(false);
    if (thumbnailPreview.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) { setError(validationError); return; }
    }
    setError(null);
    setGalleryFiles((current) => [...current, ...files]);
    setGalleryPreviews((current) => [...current, ...files.map((file) => URL.createObjectURL(file))]);
  };

  const removeGalleryPreview = (index: number) => {
    const preview = galleryPreviews[index];
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setGalleryPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setGalleryFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const validateForm = () => {
    if (!name.trim() || name.trim().length < 2) return 'Service name must be at least 2 characters.';
    if (!category.trim()) return 'Category is required.';
    if (price <= 0) return 'Price must be greater than zero.';
    if (originalPrice < 0 || discountPercent < 0 || discountPercent > 100) return 'Invalid pricing values.';
    if (estimatedDuration < 15) return 'Duration must be at least 15 minutes.';
    if (rating < 0 || rating > 5) return 'Rating must be between 0 and 5.';
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('shortDescription', shortDescription.trim());
      formData.append('fullDescription', fullDescription.trim());
      formData.append('description', shortDescription.trim());
      formData.append('category', category.trim());
      formData.append('price', String(price));
      formData.append('originalPrice', String(originalPrice));
      formData.append('discountPercent', String(discountPercent));
      formData.append('estimatedDuration', String(estimatedDuration));
      formData.append('rating', String(rating));
      formData.append('includes', JSON.stringify(includesText.split('\n').map((item) => item.trim()).filter(Boolean)));
      formData.append('compatibleVehicles', compatibleVehicles);
      formData.append('faq', JSON.stringify(faqItems.filter((item) => item.question.trim() && item.answer.trim())));
      formData.append('relatedServices', JSON.stringify(relatedServiceIds));
      formData.append('isActive', String(isActive));
      formData.append('isFeatured', String(isFeatured));
      if (removeThumbnail) formData.append('removeThumbnail', 'true');
      if (thumbnailFile) formData.append('thumbnailImageFile', thumbnailFile);
      galleryFiles.forEach((file) => formData.append('galleryImageFiles', file));

      const saved = initialService?._id
        ? await serviceService.update(token, initialService._id, formData)
        : await serviceService.create(token, formData);
      onSave?.(saved);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Unable to save service');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to save service');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} style={formCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem' }}>{initialService?._id ? 'Edit Service' : 'Add Service'}</h2>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Manage pricing, content, media, and visibility.</p>
        </div>
        <button type="button" onClick={onCancel} disabled={loading} style={secondaryButtonStyle}>Cancel</button>
      </div>
      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <input type="text" placeholder="Service Name *" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} required style={inputStyle}>
            <option value="">Select Category *</option>
            {SERVICE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="number" placeholder="Price *" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} step="0.01" style={inputStyle} />
          <input type="number" placeholder="Original Price" value={originalPrice} onChange={(e) => setOriginalPrice(Number(e.target.value))} min={0} step="0.01" style={inputStyle} />
          <input type="number" placeholder="Discount %" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} min={0} max={100} style={inputStyle} />
          <input type="number" placeholder="Duration (minutes) *" value={estimatedDuration} onChange={(e) => setEstimatedDuration(Number(e.target.value))} min={15} style={inputStyle} />
          <input type="number" placeholder="Rating (0-5)" value={rating} onChange={(e) => setRating(Number(e.target.value))} min={0} max={5} step="0.1" style={inputStyle} />
        </div>

        <textarea placeholder="Short Description" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={500} style={{ ...inputStyle, minHeight: 80 }} />
        <textarea placeholder="Full Description" value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} maxLength={5000} style={{ ...inputStyle, minHeight: 120 }} />
        <textarea placeholder="What's Included (one item per line)" value={includesText} onChange={(e) => setIncludesText(e.target.value)} style={{ ...inputStyle, minHeight: 100 }} />
        <input type="text" placeholder="Compatible Vehicles (comma-separated)" value={compatibleVehicles} onChange={(e) => setCompatibleVehicles(e.target.value)} style={inputStyle} />

        <div>
          <div style={fieldLabelStyle}>FAQ</div>
          {faqItems.map((item, index) => (
            <div key={`faq-${index}`} style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input type="text" placeholder="Question" value={item.question} onChange={(e) => setFaqItems((current) => current.map((faq, i) => i === index ? { ...faq, question: e.target.value } : faq))} style={inputStyle} />
              <textarea placeholder="Answer" value={item.answer} onChange={(e) => setFaqItems((current) => current.map((faq, i) => i === index ? { ...faq, answer: e.target.value } : faq))} style={{ ...inputStyle, minHeight: 70 }} />
            </div>
          ))}
          <button type="button" onClick={() => setFaqItems((current) => [...current, { question: '', answer: '' }])} style={secondaryButtonStyle}>Add FAQ</button>
        </div>

        {availableServices.length ? (
          <div>
            <div style={fieldLabelStyle}>Related Services</div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {availableServices.map((service) => (
                <label key={service._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={relatedServiceIds.includes(service._id)}
                    onChange={(e) => {
                      setRelatedServiceIds((current) => e.target.checked
                        ? [...current, service._id]
                        : current.filter((id) => id !== service._id));
                    }}
                  />
                  {service.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <label style={checkboxLabelStyle}><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
          <label style={checkboxLabelStyle}><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured</label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={fieldLabelStyle}>Thumbnail Image</div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbnailChange} />
            {thumbnailPreview ? (
              <div style={{ marginTop: '0.75rem' }}>
                <img src={thumbnailPreview} alt="Thumbnail preview" style={thumbnailPreviewStyle} />
                <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); setRemoveThumbnail(true); }} style={removeImageButtonStyle}>Remove</button>
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
          {loading ? 'Saving...' : initialService?._id ? 'Update Service' : 'Create Service'}
        </button>
      </div>
    </form>
  );
};

const formCardStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0', marginBottom: '1.5rem' };
const inputStyle: React.CSSProperties = { padding: '0.75rem', borderRadius: 12, border: '1px solid #cbd5e1', width: '100%' };
const fieldLabelStyle: React.CSSProperties = { marginBottom: '0.5rem', color: '#334155', fontWeight: 600 };
const checkboxLabelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontWeight: 600 };
const primaryButtonStyle: React.CSSProperties = { padding: '0.85rem 1rem', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { padding: '0.6rem 0.9rem', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const errorBannerStyle: React.CSSProperties = { color: '#dc2626', marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '0.75rem 1rem' };
const thumbnailPreviewStyle: React.CSSProperties = { width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' };
const galleryPreviewStyle: React.CSSProperties = { width: 84, height: 84, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' };
const removeImageButtonStyle: React.CSSProperties = { marginTop: '0.5rem', padding: '0.35rem 0.6rem', borderRadius: 8, border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: 12 };
const removeGalleryButtonStyle: React.CSSProperties = { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 999, border: 'none', background: 'rgba(15, 23, 42, 0.75)', color: '#fff', cursor: 'pointer', fontWeight: 700 };

export default ServiceForm;
