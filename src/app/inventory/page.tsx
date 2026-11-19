'use client';

import React, { useState } from 'react';
import { useBusinessStore } from '@/lib/store';
import { InventoryItem } from '@/types';
import { formatINR, formatDate } from '@/lib/formatters';
import {
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const { inventory, addInventoryItem, updateInventoryItem } = useBusinessStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('SFX Machines');
  const [totalQty, setTotalQty] = useState<number>(4);
  const [availableQty, setAvailableQty] = useState<number>(4);
  const [unit, setUnit] = useState('units');
  const [purchaseCost, setPurchaseCost] = useState<number>(18000);
  const [notes, setNotes] = useState('');

  const filteredInventory = inventory.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.item_name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('Item name is required');
      return;
    }
    const success = await addInventoryItem({
      item_name: itemName.trim(),
      category,
      total_quantity: Number(totalQty) || 1,
      available_quantity: Number(availableQty) || 1,
      unit,
      purchase_cost: Number(purchaseCost) || 0,
      notes,
    });
    if (success) {
      toast.success('Equipment item added to inventory!');
      setShowAddModal(false);
      setItemName('');
      setNotes('');
    } else {
      toast.error('Failed to add inventory item');
    }
  };

  const handleDispatch = async (item: InventoryItem, qty: number) => {
    if (item.available_quantity < qty) {
      toast.error('Not enough available units to dispatch');
      return;
    }
    const updated = {
      ...item,
      available_quantity: item.available_quantity - qty,
    };
    await updateInventoryItem(updated);
    toast.success(`Dispatched ${qty} unit(s) of ${item.item_name} for event setup`);
  };

  const handleReturn = async (item: InventoryItem, qty: number) => {
    if (item.available_quantity + qty > item.total_quantity) {
      toast.error('Cannot return more units than total owned inventory');
      return;
    }
    const updated = {
      ...item,
      available_quantity: item.available_quantity + qty,
    };
    await updateInventoryItem(updated);
    toast.success(`Returned ${qty} unit(s) of ${item.item_name} back to warehouse`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            SFX Equipment & Inventory
          </h1>
          <p className="text-xs text-neutral-400">
            Sparculars, Controllers, Receivers, Fanwheels, TMC rigs & Flame Throwers
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 to-gold-400 text-black shadow-gold"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Equipment Item</span>
        </button>
      </div>

      {/* Reusable Asset Rule Alert */}
      <div className="p-3.5 rounded-xl bg-surface-card border border-gold-500/30 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <div className="text-neutral-300">
          <strong className="text-white">Equipment vs Consumables:</strong> These are reusable capital assets. Their full purchase cost is not charged as an operational expense to individual events. Only the consumable powders, cartridges and haulage are event expenses.
        </div>
      </div>

      {/* Search */}
      <div className="p-3 sm:p-4 rounded-2xl bg-surface-card border border-surface-border">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SFX equipment by machine name or category..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.map((item) => {
          const inUse = item.total_quantity - item.available_quantity;
          const isLow = item.available_quantity === 0;

          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-surface border border-surface-border text-gold-300">
                    {item.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isLow
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {isLow ? 'All Deployed' : `${item.available_quantity} Available`}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white">{item.item_name}</h3>
                {item.notes && <p className="text-[11px] text-neutral-400 mt-1">{item.notes}</p>}
              </div>

              {/* Quantities bar */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-surface-elevated/70 rounded-xl text-xs text-center border border-surface-border">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Total</span>
                  <span className="font-bold text-white">
                    {item.total_quantity} {item.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">On Stage</span>
                  <span className="font-bold text-royalOrange">
                    {inUse} {item.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Asset Value</span>
                  <span className="font-bold text-gold-300">{formatINR(item.purchase_cost)}</span>
                </div>
              </div>

              {/* Dispatch & Return Quick Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleDispatch(item, 1)}
                  disabled={item.available_quantity <= 0}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-surface hover:bg-surface-elevated border border-surface-border text-neutral-200 disabled:opacity-40"
                >
                  - Deploy 1
                </button>
                <button
                  onClick={() => handleReturn(item, 1)}
                  disabled={item.available_quantity >= item.total_quantity}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-surface hover:bg-surface-elevated border border-surface-border text-gold-300 disabled:opacity-40"
                >
                  + Return 1
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md bg-surface-elevated border border-surface-border rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold text-white font-serif">Add Equipment Asset</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Equipment / Machine Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Sparcular Titanium Projector"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                  >
                    <option value="SFX Machines">SFX Machines</option>
                    <option value="Controllers">Controllers</option>
                    <option value="Receivers">Receivers</option>
                    <option value="Special Effects">Special Effects</option>
                    <option value="DMX Equipment">DMX Equipment</option>
                    <option value="Cables & Rigs">Cables & Rigs</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalQty}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      setTotalQty(val);
                      setAvailableQty(val);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Notes / Specs</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="DMX channel address, wireless pairing band, flight case ID"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-surface text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gold-500 text-black shadow-gold"
              >
                Save Equipment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
