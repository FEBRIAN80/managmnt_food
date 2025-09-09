import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

interface Menu {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_available: boolean;
  categories?: {
    name: string;
  };
}

interface CartItem {
  menu: Menu;
  quantity: number;
  subtotal: number;
}

export function Cashier() {
  const { profile } = useAuth();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Transaction settings
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(10); // 10% tax

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const { data, error } = await supabase
        .from('menus')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error('Error fetching menus:', error);
      toast.error('Gagal mengambil data menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (menu: Menu) => {
    const existingItem = cart.find(item => item.menu.id === menu.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.menu.id === menu.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * menu.price
            }
          : item
      ));
    } else {
      setCart([...cart, {
        menu,
        quantity: 1,
        subtotal: menu.price
      }]);
    }
  };

  const updateQuantity = (menuId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.menu.id === menuId) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity === 0) {
          return null;
        }
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.menu.price
        };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (menuId: string) => {
    setCart(cart.filter(item => item.menu.id !== menuId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  };

  const generateTransactionNumber = () => {
    const date = new Date();
    const timestamp = date.getTime();
    return `TRX${timestamp}`;
  };

  interface TransactionData {
    id: string;
    transaction_number: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    payment_method: string;
    cashier_id: string | null;
    created_at: string;
  }

  const generateReceipt = (transactionData: TransactionData) => {
    const doc = new jsPDF();
    const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

    // Header
    doc.setFontSize(18);
    doc.text('RESTORAN APP', 20, 20);
    doc.setFontSize(12);
    doc.text('Jl. Contoh No. 123, Jakarta', 20, 30);
    doc.text('Telp: (021) 1234567', 20, 40);
    doc.text('========================================', 20, 50);
    
    // Transaction details
    doc.text(`No. Transaksi: ${transactionData.transaction_number}`, 20, 60);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 70);
    doc.text(`Kasir: ${profile?.full_name}`, 20, 80);
    doc.text('========================================', 20, 90);
    
    // Items
    let yPosition = 100;
    doc.text('ITEM', 20, yPosition);
    doc.text('QTY', 120, yPosition);
    doc.text('HARGA', 150, yPosition);
    doc.text('SUBTOTAL', 180, yPosition);
    yPosition += 10;
    doc.text('----------------------------------------', 20, yPosition);
    yPosition += 10;

    cart.forEach((item) => {
      doc.setFontSize(10);
      doc.text(item.menu.name, 20, yPosition);
      doc.text(item.quantity.toString(), 120, yPosition);
      doc.text(`Rp ${item.menu.price.toLocaleString()}`, 150, yPosition);
      doc.text(`Rp ${item.subtotal.toLocaleString()}`, 180, yPosition);
      yPosition += 10;
    });

    // Totals
    doc.text('========================================', 20, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(`Subtotal: Rp ${subtotal.toLocaleString()}`, 20, yPosition);
    yPosition += 10;
    if (discountAmount > 0) {
      doc.text(`Diskon (${discount}%): -Rp ${discountAmount.toLocaleString()}`, 20, yPosition);
      yPosition += 10;
    }
    doc.text(`Pajak (${taxRate}%): Rp ${taxAmount.toLocaleString()}`, 20, yPosition);
    yPosition += 10;
    doc.setFontSize(14);
    doc.text(`TOTAL: Rp ${total.toLocaleString()}`, 20, yPosition);
    
    // Footer
    yPosition += 20;
    doc.setFontSize(10);
    doc.text('Terima kasih atas kunjungan Anda!', 20, yPosition);
    
    // Save PDF
    doc.save(`receipt-${transactionData.transaction_number}.pdf`);
  };

  const processTransaction = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    setProcessing(true);
    try {
      const { subtotal, discountAmount, taxAmount, total } = calculateTotals();
      const transactionNumber = generateTransactionNumber();

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: total,
          payment_method: 'cash',
          cashier_id: profile?.id,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        menu_id: item.menu.id,
        quantity: item.quantity,
        unit_price: item.menu.price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Generate receipt
      generateReceipt(transaction);

      toast.success('Transaksi berhasil!');
      setCart([]);
      setDiscount(0);
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Gagal memproses transaksi');
    } finally {
      setProcessing(false);
    }
  };

  const filteredMenus = menus.filter(menu =>
    menu.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Menu Section */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Cari menu..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => addToCart(menu)}
                >
                  <h3 className="font-medium text-gray-900">{menu.name}</h3>
                  {menu.description && (
                    <p className="text-sm text-gray-600 mt-1">{menu.description}</p>
                  )}
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-lg font-bold text-blue-600">
                      Rp {menu.price.toLocaleString()}
                    </span>
                    {menu.categories && (
                      <span className="text-xs text-gray-500">
                        {menu.categories.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Keranjang</h2>
        </div>

        <div className="p-6 space-y-4 max-h-64 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center">Keranjang kosong</p>
          ) : (
            cart.map((item) => (
              <div key={item.menu.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.menu.name}</h4>
                  <p className="text-sm text-gray-600">
                    Rp {item.menu.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.menu.id, -1)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menu.id, 1)}
                    className="p-1 text-gray-500 hover:text-green-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.menu.id)}
                    className="p-1 text-gray-500 hover:text-red-600 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            {/* Discount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diskon (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon ({discount}%):</span>
                  <span>-Rp {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Pajak ({taxRate}%):</span>
                <span>Rp {taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>Rp {total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={processTransaction}
              disabled={processing}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              {processing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </div>
              ) : (
                <>
                  <Receipt className="h-5 w-5 mr-2" />
                  Bayar & Cetak
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}