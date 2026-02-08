import { useState } from 'react';
import { 
  Gift, 
  DollarSign, 
  Heart, 
  Star, 
  Sparkles, 
  Crown,
  Flame,
  Zap,
  Diamond,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

// Gift/donation tiers
const giftItems = [
  { id: 'heart', name: 'Heart', icon: Heart, price: 1, color: 'text-red-500' },
  { id: 'star', name: 'Star', icon: Star, price: 5, color: 'text-yellow-400' },
  { id: 'sparkle', name: 'Sparkle', icon: Sparkles, price: 10, color: 'text-purple-400' },
  { id: 'flame', name: 'Flame', icon: Flame, price: 25, color: 'text-orange-500' },
  { id: 'zap', name: 'Lightning', icon: Zap, price: 50, color: 'text-blue-400' },
  { id: 'diamond', name: 'Diamond', icon: Diamond, price: 100, color: 'text-cyan-400' },
  { id: 'crown', name: 'Crown', icon: Crown, price: 250, color: 'text-amber-400' },
  { id: 'trophy', name: 'Trophy', icon: Trophy, price: 500, color: 'text-yellow-500' },
];

const donationPresets = [5, 10, 25, 50, 100, 500];

// Mock recent donations
const recentDonations = [
  { id: '1', username: 'supporter123', amount: 50, message: 'Love your streams! Keep it up!', timestamp: '2 mins ago' },
  { id: '2', username: 'bigfan', amount: 100, message: 'Amazing content as always!', timestamp: '5 mins ago' },
  { id: '3', username: 'viewer42', amount: 25, message: '', timestamp: '12 mins ago' },
  { id: '4', username: 'anonymous', amount: 10, message: 'Great stream!', timestamp: '20 mins ago' },
];

// Mock top donors
const topDonors = [
  { username: 'megafan', total: 2500, rank: 1 },
  { username: 'superfan', total: 1800, rank: 2 },
  { username: 'supporter123', total: 1200, rank: 3 },
  { username: 'viewer99', total: 850, rank: 4 },
  { username: 'donator', total: 600, rank: 5 },
];

export default function GiftsPage() {
  const { user } = useAuth();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'gifts' | 'donate'>('gifts');

  const handleSendGift = (giftId: string) => {
    if (!user) return;
    // In production, this would integrate with a payment system
    console.log('Sending gift:', giftId);
  };

  const handleDonate = (amount: number) => {
    if (!user) return;
    // In production, this would integrate with a payment system
    console.log('Donating:', amount, 'Message:', donationMessage);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <Gift className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold text-foreground">Support Streamers</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Show your appreciation to your favorite streamers with gifts and donations. 
              Every contribution helps creators continue making amazing content!
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center gap-2 mb-8">
            <Button
              variant={activeTab === 'gifts' ? 'default' : 'secondary'}
              onClick={() => setActiveTab('gifts')}
              className="px-6"
            >
              <Gift className="w-4 h-4 mr-2" />
              Virtual Gifts
            </Button>
            <Button
              variant={activeTab === 'donate' ? 'default' : 'secondary'}
              onClick={() => setActiveTab('donate')}
              className="px-6"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Donations
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gifts Tab */}
              {activeTab === 'gifts' && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Virtual Gifts
                  </h2>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {giftItems.map((gift) => {
                      const IconComponent = gift.icon;
                      return (
                        <button
                          key={gift.id}
                          onClick={() => setSelectedGift(gift.id)}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                            selectedGift === gift.id
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-border bg-secondary/50 hover:border-muted-foreground'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <IconComponent className={`w-10 h-10 ${gift.color}`} />
                            <span className="font-medium text-foreground">{gift.name}</span>
                            <span className="text-sm text-muted-foreground">${gift.price}</span>
                          </div>
                          {selectedGift === gift.id && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white">✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {user ? (
                    <Button
                      className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
                      disabled={!selectedGift}
                      onClick={() => selectedGift && handleSendGift(selectedGift)}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Send Gift
                    </Button>
                  ) : (
                    <Link to="/auth" className="block mt-6">
                      <Button variant="secondary" className="w-full">
                        Sign in to send gifts
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Donations Tab */}
              {activeTab === 'donate' && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-500" />
                    Send a Donation
                  </h2>

                  {/* Preset Amounts */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                    {donationPresets.map((amount) => (
                      <Button
                        key={amount}
                        variant="secondary"
                        onClick={() => setCustomAmount(amount.toString())}
                        className={`${
                          customAmount === amount.toString()
                            ? 'ring-2 ring-yellow-500 bg-yellow-500/10'
                            : ''
                        }`}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="mb-6">
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Or enter custom amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="pl-9 bg-secondary border-border"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Add a message (optional)
                    </label>
                    <Input
                      placeholder="Write something nice..."
                      value={donationMessage}
                      onChange={(e) => setDonationMessage(e.target.value)}
                      className="bg-secondary border-border"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {donationMessage.length}/200 characters
                    </p>
                  </div>

                  {user ? (
                    <Button
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                      disabled={!customAmount || parseFloat(customAmount) <= 0}
                      onClick={() => handleDonate(parseFloat(customAmount))}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Donate ${customAmount || '0'}
                    </Button>
                  ) : (
                    <Link to="/auth" className="block">
                      <Button variant="secondary" className="w-full">
                        Sign in to donate
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Recent Donations */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Recent Donations
                </h3>
                <div className="space-y-4">
                  {recentDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {donation.username}
                          </span>
                          <span className="text-yellow-500 font-semibold">
                            ${donation.amount}
                          </span>
                        </div>
                        {donation.message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {donation.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {donation.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Top Donors */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Supporters
                </h3>
                <div className="space-y-3">
                  {topDonors.map((donor) => (
                    <div
                      key={donor.username}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        donor.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                        donor.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                        donor.rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                        'bg-accent text-muted-foreground'
                      }`}>
                        #{donor.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {donor.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${donor.total.toLocaleString()} total
                        </p>
                      </div>
                      {donor.rank <= 3 && (
                        <Crown className={`w-5 h-5 ${
                          donor.rank === 1 ? 'text-yellow-500' :
                          donor.rank === 2 ? 'text-gray-400' :
                          'text-amber-600'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  How it works
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Choose a gift or enter a donation amount
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Add an optional message for the streamer
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Your support appears live on stream
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    100% goes directly to the creator
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
