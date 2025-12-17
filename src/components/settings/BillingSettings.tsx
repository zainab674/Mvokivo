import { useState, useEffect } from 'react';
import { PaymentMethodsCard } from "./billing/PaymentMethodsCard";
import { InvoiceHistoryCard } from "./billing/InvoiceHistoryCard";
import { MainHeading, BodyText } from "@/components/ui/typography";
import { useAuth } from '@/contexts/SupportAccessAuthContext';
import { Loader2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending";
}

export function BillingSettings() {
  const { user, getAccessToken } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getAccessToken();

        // Fetch payment methods
        const pmResponse = await fetch('/api/v1/billing/payment-methods', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (pmResponse.ok) {
          const { paymentMethods: data } = await pmResponse.json();
          setPaymentMethods(data?.map((pm: any) => ({
            id: pm.id,
            type: pm.card_brand?.toLowerCase() || 'card',
            last4: pm.card_last4 || '',
            expMonth: pm.card_exp_month || 0,
            expYear: pm.card_exp_year || 0,
            isDefault: pm.is_default || false
          })) || []);
        }

        // Fetch invoices
        const invResponse = await fetch('/api/v1/billing/invoices', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (invResponse.ok) {
          const { invoices: data } = await invResponse.json();
          setInvoices(data || []);
        }

      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extralight tracking-tight text-foreground">Billing & Payment Methods</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Manage your payment information and view transaction history
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extralight tracking-tight text-foreground">Billing & Payment Methods</h2>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          Manage your payment information and view transaction history
        </p>
      </div>

      <div className="space-y-6">
        <PaymentMethodsCard paymentMethods={paymentMethods} />
        <InvoiceHistoryCard invoices={invoices} />
      </div>
    </div>
  );
}
