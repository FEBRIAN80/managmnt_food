import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

interface DashboardStats {
  todaySales: number;
  totalTransactions: number;
  lowStockItems: number;
  totalIngredients: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    totalTransactions: 0,
    lowStockItems: 0,
    totalIngredients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's sales
      const { data: todayTransactions } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('created_at', today + ' 00:00:00')
        .lte('created_at', today + ' 23:59:59');

      const todaySales = todayTransactions?.reduce(
        (sum, t) => sum + Number(t.total_amount),
        0
      ) || 0;

      // Get total transactions today
      const totalTransactions = todayTransactions?.length || 0;

      // Get low stock items
      const { data: ingredients } = await supabase
        .from('ingredients')
        .select('current_stock, min_stock');

      const lowStockItems = ingredients?.filter(
        (item) => item.current_stock <= item.min_stock
      ).length || 0;

      const totalIngredients = ingredients?.length || 0;

      setStats({
        todaySales,
        totalTransactions,
        lowStockItems,
        totalIngredients,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    bgColor 
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Selamat datang, {profile?.full_name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Penjualan Hari Ini"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        
        <StatCard
          title="Transaksi Hari Ini"
          value={stats.totalTransactions.toString()}
          icon={ShoppingCart}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        
        <StatCard
          title="Stok Menipis"
          value={stats.lowStockItems.toString()}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        
        <StatCard
          title="Total Bahan Baku"
          value={stats.totalIngredients.toString()}
          icon={Package}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="h-5 w-5 text-blue-600 mr-2" />
            Tambah Stok
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ShoppingCart className="h-5 w-5 text-green-600 mr-2" />
            Transaksi Baru
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
            Lihat Laporan
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockItems > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">
                Peringatan Stok Menipis
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Ada {stats.lowStockItems} bahan baku yang stoknya menipis. 
                Segera lakukan restock untuk menghindari kehabisan stok.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}