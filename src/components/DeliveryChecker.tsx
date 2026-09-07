import { useState, useEffect } from 'react';
import { Package, Truck, Clock, MapPin, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation, DeliveryInfo } from '@/contexts/LocationContext';
import { cn } from '@/lib/utils';

interface DeliveryCheckerProps {
  className?: string;
  compact?: boolean;
}

export const DeliveryChecker = ({ className, compact = false }: DeliveryCheckerProps) => {
  const { location, checkDelivery, setShowManualSelector } = useLocation();
  const [pincode, setPincode] = useState(location?.pincode || '');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Auto-check when location changes
  useEffect(() => {
    if (location?.pincode) {
      setPincode(location.pincode);
      handleCheck(location.pincode);
    }
  }, [location?.pincode]);

  const handleCheck = async (pincodeToCheck?: string) => {
    const code = pincodeToCheck || pincode;
    if (code.length !== 6) return;

    setIsChecking(true);
    const info = await checkDelivery(code);
    setDeliveryInfo(info);
    setHasChecked(true);
    setIsChecking(false);
  };

  const handlePincodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setPincode(numericValue);
    setHasChecked(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pincode.length === 6) {
      handleCheck();
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-2 flex-1">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 w-24 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCheck()}
            disabled={pincode.length !== 6 || isChecking}
            className="h-8"
          >
            {isChecking ? "..." : "Check"}
          </Button>
        </div>
        {hasChecked && deliveryInfo && (
          <span className={cn(
            "text-xs font-medium",
            deliveryInfo.isDeliverable ? "text-primary" : "text-destructive"
          )}>
            {deliveryInfo.isDeliverable ? `${deliveryInfo.deliveryDays} days` : "Not available"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Delivery to {pincode || 'your area'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManualSelector(true)}
          className="text-xs text-primary"
        >
          <MapPin className="h-3 w-3 mr-1" />
          Change
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="Enter pincode"
          value={pincode}
          onChange={(e) => handlePincodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          onClick={() => handleCheck()}
          disabled={pincode.length !== 6 || isChecking}
        >
          {isChecking ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            "Check"
          )}
        </Button>
      </div>

      {hasChecked && deliveryInfo && (
        <div className={cn(
          "rounded-md p-3",
          deliveryInfo.isDeliverable ? "bg-primary/10" : "bg-destructive/10"
        )}>
          {deliveryInfo.isDeliverable ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Check className="h-4 w-4" />
                <span className="font-medium">Available for delivery</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  <span>Estimated: {deliveryInfo.deliveryDays}-{deliveryInfo.deliveryDays + 2} business days</span>
                </div>
                {deliveryInfo.expressAvailable && (
                  <div className="flex items-center gap-1 text-primary">
                    <Clock className="h-4 w-4" />
                    <span>Express available</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Delivery not available</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sorry, we currently don't deliver to this area. Try a different pincode or visit our stores.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/stores">Find Stores</a>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
