import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  supplier_id: string | null;
  suppliers?: {
    name: string;
  };
}

export function Inventory() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    min_stock: '',
    cost_per_unit: '',
  });

  const [stockData, setStockData] = useState({
    type: 'in' as 'in' | 'out',
    quantity: '',
    reason: '',
  });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          suppliers (
            name
          )
        `)
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast.error('Gagal mengambil data bahan baku');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('ingredients')
        .insert({
          name: formData.name,
          unit: formData.unit,
          min_stock: parseFloat(formData.min_stock),
          cost_per_unit: parseFloat(formData.cost_per_unit),
          current_stock: 0,
        });

      if (error) throw error;

      toast.success('Bahan baku berhasil ditambahkan');
      setFormData({ name: '', unit: '', min_stock: '', cost_per_unit: '' });
      setShowAddForm(false);
      fetchIngredients();
    } catch (error) {
      console.error('Error adding ingredient:', error);
      toast.error('Gagal menambahkan bahan baku');
    }
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIngredient) return;

    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          ingredient_id: selectedIngredient.id,
          type: stockData.type,
          quantity: parseFloat(stockData.quantity),
          reason: stockData.reason,
          reference_type: 'manual',
        });

      if (error) throw error;

      toast.success(
        stockData.type === 'in' 
          ? 'Stok berhasil ditambahkan' 
          : 'Stok berhasil dikurangi'
      );
      
      setStockData({ type: 'in', quantity: '', reason: '' });
      setShowStockModal(false);
      setSelectedIngredient(null);
      fetchIngredients();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Gagal mengupdate stok');
    }
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (current: number, min: number) => {
    if (current <= min) return { text: 'Menipis', color: 'text-red-600 bg-red-100' };
    if (current <= min * 1.5) return { text: 'Perhatian', color: 'text-orange-600 bg-orange-100' };
    return { text: 'Aman', color: 'text-green-600 bg-green-100' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventori</h1>
          <p className="mt-2 text-gray-600">Kelola stok bahan baku restoran</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Bahan
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Cari bahan baku..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Ingredients Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Bahan Baku</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Bahan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Saat Ini
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Minimum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIngredients.map((ingredient) => {
                const status = getStockStatus(ingredient.current_stock, ingredient.min_stock);
                return (
                  <tr key={ingredient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ingredient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Satuan: {ingredient.unit}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ingredient.current_stock} {ingredient.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ingredient.min_stock} {ingredient.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {ingredient.cost_per_unit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedIngredient(ingredient);
                          setStockData({ ...stockData, type: 'in' });
                          setShowStockModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 flex items-center"
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Masuk
                      </button>
                      <button
                        onClick={() => {
                          setSelectedIngredient(ingredient);
                          setStockData({ ...stockData, type: 'out' });
                          setShowStockModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <TrendingDown className="h-4 w-4 mr-1" />
                        Keluar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Tambah Bahan Baku</h3>
            <form onSubmit={handleAddIngredient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama Bahan</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Satuan</label>
                <input
                  type="text"
                  required
                  placeholder="kg, liter, pcs, dll"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stok Minimum</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Harga per Unit</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {showStockModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {stockData.type === 'in' ? 'Tambah Stok' : 'Kurangi Stok'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Bahan: <strong>{selectedIngredient.name}</strong><br />
              Stok saat ini: <strong>{selectedIngredient.current_stock} {selectedIngredient.unit}</strong>
            </p>
            <form onSubmit={handleStockMovement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={stockData.quantity}
                  onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Alasan perubahan stok..."
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={stockData.reason}
                  onChange={(e) => setStockData({ ...stockData, reason: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className={`flex-1 py-2 px-4 rounded-md text-white transition-colors ${
                    stockData.type === 'in' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {stockData.type === 'in' ? 'Tambah Stok' : 'Kurangi Stok'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false);
                    setSelectedIngredient(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}