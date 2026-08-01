import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { categoryService, CategoryItem } from '../services/categoryService';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

const CategoriesPage = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', type: 'both' as 'services' | 'inventory' | 'both', isActive: true });
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const listPayload = await categoryService.list(token, { page, limit: 10, search: search.trim() || undefined });
      setCategories(listPayload?.items ?? []);
      setTotalPages(listPayload?.totalPages ?? 1);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Unable to load categories');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load categories');
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setActionLoading(true);
      if (editingCategory) {
        await categoryService.update(token, editingCategory._id, formData);
        setToast('Category updated successfully');
      } else {
        await categoryService.create(token, formData);
        setToast('Category created successfully');
      }
      setFormData({ name: '', description: '', type: 'both', isActive: true });
      setEditingCategory(null);
      setShowForm(false);
      await loadCategories();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Unable to save category' : 'Unable to save category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description ?? '', type: category.type ?? 'both', isActive: category.isActive ?? true });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;
    try {
      setActionLoading(true);
      await categoryService.delete(token, deleteTarget._id);
      setToast('Category deleted successfully');
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Unable to delete category' : 'Unable to delete category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormCancel = () => {
    setFormData({ name: '', description: '', type: 'both', isActive: true });
    setEditingCategory(null);
    setShowForm(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>Categories</h1>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Manage service and inventory categories.</p>
          </div>
          <button onClick={() => { setFormData({ name: '', description: '', type: 'both', isActive: true }); setEditingCategory(null); setShowForm(true); }} style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>Add Category</button>
        </header>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" style={{ flex: 1, minWidth: '260px', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
        </div>

        {error && <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>{error}</div>}
        {toast && <div style={{ marginBottom: '1rem', padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px' }}>{toast}</div>}

        {loading ? (
          <div style={{ color: '#64748b' }}>Loading categories...</div>
        ) : categories.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}><EmptyState message="No categories found." /></div>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {categories.map((category) => (
              <div key={category._id} style={{ background: '#fff', borderRadius: '16px', padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{category.name}</div>
                    <div style={{ color: '#64748b', marginTop: '0.25rem' }}>{category.description ?? 'No description'}</div>
                    <div style={{ color: '#64748b', marginTop: '0.25rem' }}>Type: <strong>{category.type ?? 'both'}</strong> • Items: <strong>{category.itemCount ?? 0}</strong></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', background: category.isActive ? '#dcfce7' : '#f5f5f5', color: category.isActive ? '#166534' : '#666', fontSize: '0.85rem', fontWeight: 500 }}>{category.isActive ? 'Active' : 'Inactive'}</span>
                    <button onClick={() => handleEdit(category)} style={{ padding: '0.5rem 1rem', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => setDeleteTarget(category)} style={{ padding: '0.5rem 1rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.5rem 1rem', background: page === 1 ? '#e2e8f0' : '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Page <strong>{page}</strong> of <strong>{totalPages}</strong></div>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.5rem 1rem', background: page === totalPages ? '#e2e8f0' : '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
        )}

        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>{editingCategory ? 'Edit' : 'Add'} Category</h2>
              <form onSubmit={handleFormSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 500 }}>Name *</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 500 }}>Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', minHeight: '100px' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 500 }}>Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'services' | 'inventory' | 'both' })} style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}>
                    <option value="both">Both Services & Inventory</option>
                    <option value="services">Services Only</option>
                    <option value="inventory">Inventory Only</option>
                  </select>
                </div>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                  <label style={{ color: '#0f172a', fontWeight: 500 }}>Active</label>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={handleFormCancel} style={{ padding: '0.6rem 1.2rem', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: actionLoading ? 0.7 : 1 }}>{actionLoading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete Category"
          message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
          confirmLabel={actionLoading ? 'Deleting...' : 'Delete'}
          cancelLabel="Cancel"
          danger
          loading={actionLoading}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </div>
  );
};

export default CategoriesPage;
