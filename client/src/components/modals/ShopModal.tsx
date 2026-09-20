import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { useUserStore } from '../../store/useUserStore';
import { fetchShopCatalog, buyItem } from '../../services/api';
import { sendPlayerUpdate } from '../../services/socket';
import { soundManager } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { CosmeticItem } from 'fair-shared';
import { ShoppingBag, Check, Sparkles } from 'lucide-react';

export const ShopModal: React.FC = () => {
  const { points, inventory, equipped, setPoints, setInventory, equipItem, unequipItem } = useUserStore();
  const [catalog, setCatalog] = useState<CosmeticItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchShopCatalog()
      .then((res) => {
        setCatalog(res.items);
        if (res.items.length > 0) setSelectedItem(res.items[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isOwned = (itemId: string) => {
    return inventory.some((inv) => inv.itemId === itemId);
  };

  const isEquipped = (item: CosmeticItem) => {
    return equipped[item.type] === item.id;
  };

  const handleToggleEquip = (item: CosmeticItem) => {
    soundManager.playPop();
    if (isEquipped(item)) {
      unequipItem(item.type);
      sendPlayerUpdate({
        ...equipped,
        [item.type]: undefined,
      });
    } else {
      equipItem(item.type, item.id);
      sendPlayerUpdate({
        ...equipped,
        [item.type]: item.id,
      });
    }
  };

  const handlePurchase = async (item: CosmeticItem) => {
    setBuyingId(item.id);
    setNotice(null);
    try {
      const res = await buyItem(item.id);
      if (res.success) {
        soundManager.playCoins();
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#F59E0B', '#FDFBF7', '#10B981'],
        });

        if (res.remainingPoints !== undefined) {
          setPoints(res.remainingPoints);
        }
        if (res.item) {
          const updatedInv = [...inventory, { id: 'temp-' + Date.now(), userId: '', itemId: item.id, item: res.item, acquiredAt: new Date().toISOString() }];
          setInventory(updatedInv);
          // Auto-equip on purchase
          equipItem(item.type, item.id);
          sendPlayerUpdate({
            ...equipped,
            [item.type]: item.id,
          });
        }
        setNotice(res.message);
      } else {
        soundManager.playPop();
        setNotice(res.message);
      }
    } catch (err) {
      console.error(err);
      setNotice('Network error while purchasing.');
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <ModalWrapper title="Kerala Souvenir Shop" malayalamTitle="കരകൗശല വിപണി" icon="🛍️" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Wallet Balance Bar */}
        <div className="flex items-center justify-between bg-amber-950/40 p-3 rounded-xl border border-amber-500/20">
          <span className="text-stone-300 text-sm">Your Fair Balance:</span>
          <div className="flex items-center gap-1.5 font-bold text-lg text-amber-300">
            <Sparkles size={18} />
            <span>{points} pts</span>
          </div>
        </div>

        {notice && (
          <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-center text-sm text-amber-200">
            {notice}
          </div>
        )}

        {/* Shop Items Grid */}
        {loading ? (
          <div className="text-center py-8 text-stone-400">Loading festive collection...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {catalog.map((item) => {
              const owned = isOwned(item.id);
              const equippedNow = isEquipped(item);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedItem?.id === item.id
                      ? 'bg-amber-950/50 border-amber-400 shadow-lg scale-[1.02]'
                      : 'bg-stone-900/60 border-stone-700/60 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    {/* Item Visual Color Ring */}
                    <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl shadow-inner mb-3 border-2 border-amber-400/40" style={{ backgroundColor: item.previewColor + '33' }}>
                      {item.type === 'outfit' ? '👘' : item.type === 'instrument' ? '🥁' : '👑'}
                    </div>

                    <h3 className="font-bold text-amber-100 text-center text-sm">{item.name}</h3>
                    <p className="text-[11px] text-amber-400/80 text-center font-malayalam mb-2">{item.malayalamName}</p>
                    <p className="text-xs text-stone-400 text-center line-clamp-2">{item.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800">
                    {owned ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEquip(item);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          equippedNow
                            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                        }`}
                      >
                        <Check size={14} />
                        {equippedNow ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(item);
                        }}
                        disabled={buyingId === item.id || points < item.price}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          points >= item.price
                            ? 'kerala-btn text-white'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag size={14} />
                        {buyingId === item.id ? 'Purchasing...' : `Buy (${item.price} pts)`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-stone-400">
          All cosmetics are unlocked with Fair Points earned through rides, daily food cards, and community activities.
        </p>
      </div>
    </ModalWrapper>
  );
};
