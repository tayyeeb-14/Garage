import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { bannerService, BannerItem } from '../services/bannerService';

const BannerManagementPage = () => {
  const { token } = useAuth();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [ctaText, setCtaText] = useState('Learn more');
  const [ctaAction, setCtaAction] = useState<'service' | 'parts' | 'external'>('external');
  const [targetId, setTargetId] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const loadBanners = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const payload = await bannerService.list(token);
      setBanners(payload ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBanners();
  }, [token]);

  const filteredBanners = useMemo(() => {
    const query = search.toLowerCase();
    return banners.filter((banner) => banner.title.toLowerCase().includes(query) || (banner.subtitle ?? '').toLowerCase().includes(query));
  }, [banners, search]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subtitle', subtitle);
      formData.append('displayOrder', displayOrder);
      formData.append('ctaText', ctaText);
      formData.append('ctaAction', ctaAction);
      formData.append('targetId', targetId);
      formData.append('targetUrl', targetUrl);
      formData.append('isActive', String(isActive));
      if (startDate) formData.append('startDate', startDate);
      if (endDate) formData.append('endDate', endDate);
      if (imageFile) formData.append('imageFile', imageFile);

      const created = await bannerService.create(token, formData);
      setBanners((current) => [created, ...current]);
      setTitle('');
      setSubtitle('');
      setDisplayOrder('0');
      setCtaText('Learn more');
      setCtaAction('external');
      setTargetId('');
      setTargetUrl('');
      setStartDate('');
      setEndDate('');
      setIsActive(true);
      setImageFile(null);
      setPreviewUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create banner');
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!token) return;
    if (!window.confirm('Delete this banner?')) return;

    try {
      await bannerService.delete(token, bannerId);
      setBanners((current) => current.filter((item) => item._id !== bannerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete banner');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gap: '1.25rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>Banner Management</h1>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Create, preview, and control promotional banners.</p>
          </div>
          <div style={{ color: '#2563eb', fontWeight: 700 }}>{banners.length} banners</div>
        </header>

        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '18px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Title</label>
              <input required value={title} onChange={(event) => setTitle(event.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Subtitle</label>
              <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Display order</label>
              <input type="number" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>CTA text</label>
              <input value={ctaText} onChange={(event) => setCtaText(event.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>CTA action</label>
              <select value={ctaAction} onChange={(event) => setCtaAction(event.target.value as 'service' | 'parts' | 'external')} style={inputStyle}>
                <option value="service">Service</option>
                <option value="parts">Parts</option>
                <option value="external">External URL</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Target ID / URL</label>
              <input value={ctaAction === 'external' ? targetUrl : targetId} onChange={(event) => (ctaAction === 'external' ? setTargetUrl(event.target.value) : setTargetId(event.target.value))} style={inputStyle} placeholder={ctaAction === 'external' ? 'https://example.com' : 'Service or part ID'} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Start date</label>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>End date</label>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'minmax(220px, 1fr) 220px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Banner image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <label style={{ fontWeight: 600 }}>Active</label>
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            </div>
          </div>
          {previewUrl ? <img src={previewUrl} alt="Banner preview" style={{ marginTop: '1rem', width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '16px' }} /> : null}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="submit" style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save banner</button>
            <button type="button" onClick={() => { setTitle(''); setSubtitle(''); setDisplayOrder('0'); setCtaText('Learn more'); setCtaAction('external'); setTargetId(''); setTargetUrl(''); setStartDate(''); setEndDate(''); setIsActive(true); setImageFile(null); setPreviewUrl(''); }} style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Reset</button>
          </div>
          {error ? <div style={{ marginTop: '0.75rem', color: '#dc2626' }}>{error}</div> : null}
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search banners" style={{ flex: 1, minWidth: '220px', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
        </div>

        {loading ? (
          <div style={{ color: '#64748b' }}>Loading banners...</div>
        ) : filteredBanners.length === 0 ? (
          <div style={{ color: '#64748b' }}>No banners yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredBanners.map((banner) => (
              <div key={banner._id} style={{ background: '#fff', borderRadius: '16px', padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.title} style={{ width: '140px', height: '80px', objectFit: 'cover', borderRadius: '12px' }} /> : <div style={{ width: '140px', height: '80px', borderRadius: '12px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No image</div>}
                    <div>
                      <h3 style={{ margin: 0, color: '#0f172a' }}>{banner.title}</h3>
                      <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>{banner.subtitle ?? 'No subtitle'}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <span style={{ padding: '0.3rem 0.6rem', borderRadius: '999px', background: '#eff6ff', color: '#2563eb', fontSize: '0.8rem' }}>Order {banner.displayOrder ?? 0}</span>
                        <span style={{ padding: '0.3rem 0.6rem', borderRadius: '999px', background: '#f1f5f9', color: '#334155', fontSize: '0.8rem' }}>{banner.isActive ? 'Active' : 'Inactive'}</span>
                        <span style={{ padding: '0.3rem 0.6rem', borderRadius: '999px', background: '#fef3c7', color: '#92400e', fontSize: '0.8rem' }}>{banner.ctaAction ?? 'external'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button type="button" onClick={() => void handleDelete(banner._id)} style={{ padding: '0.65rem 0.9rem', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' };

export default BannerManagementPage;
