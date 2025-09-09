import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  Menu,
  Truck,
  ShoppingCart,
  BarChart3,
  Users,
  LogOut,
  ChefHat,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

export function Sidebar() {
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const adminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Inventori', path: '/inventory' },
    { icon: Menu, label: 'Menu', path: '/menu' },
    { icon: Truck, label: 'Supplier', path: '/suppliers' },
    { icon: ShoppingCart, label: 'Transaksi', path: '/transactions' },
    { icon: BarChart3, label: 'Laporan', path: '/reports' },
    { icon: Users, label: 'Pengguna', path: '/users' },
  ];

  const cashierMenuItems = [
    { icon: ShoppingCart, label: 'Kasir', path: '/cashier' },
    { icon: BarChart3, label: 'Laporan Saya', path: '/my-reports' },
  ];

  const menuItems = isAdmin ? adminMenuItems : cashierMenuItems;

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <ChefHat className="h-8 w-8 text-blue-600 mr-3" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">Restoran App</h1>
          <p className="text-sm text-gray-500">Manajemen Restoran</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
            <p className="text-xs text-blue-600 capitalize">{profile?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
              isActive(path)
                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-5 w-5 mr-3" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={signOut}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-colors duration-150"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Keluar
        </button>
      </div>
    </div>
  );
}