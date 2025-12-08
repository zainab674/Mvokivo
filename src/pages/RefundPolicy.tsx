import React from 'react';
import DashboardLayout from "@/layout/DashboardLayout";
import { RefreshCw, X, CheckCircle, Mail, CreditCard } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800/50 p-8 md:p-12">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="w-8 h-8 text-indigo-500" />
                <h1 className="text-3xl font-bold text-white">Refund Policy</h1>
              </div>
              <p className="text-zinc-400 text-sm">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-zinc-300 leading-relaxed">
                  This Refund Policy outlines the terms and conditions under which refunds may be issued for purchases made through our service.
                  All transactions and refunds are processed by Paddle.com, our Merchant of Record.
                </p>
              </section>

              {/* A. When refunds are allowed */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  A. When Refunds Are Allowed
                </h2>
                <p className="text-zinc-300 mb-4">
                  We will issue refunds in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
                  <li><strong className="text-white">Double Charges:</strong> If you were charged twice for the same product or service</li>
                  <li><strong className="text-white">Technical Issues:</strong> If you experience technical problems that prevent you from using the service, and we are unable to resolve them within 48 hours</li>
                  <li><strong className="text-white">Failed Service Delivery:</strong> If the service fails to deliver as described and we cannot provide a suitable alternative</li>
                  <li><strong className="text-white">Within Refund Window:</strong> Refund requests made within 14 days of the original purchase date</li>
                  <li><strong className="text-white">Unauthorized Charges:</strong> If a charge was made without your authorization</li>
                  <li><strong className="text-white">Service Cancellation:</strong> If you cancel your subscription before the billing period begins</li>
                </ul>
                <div className="bg-green-950/30 border border-green-800/50 rounded-lg p-4 mt-4">
                  <p className="text-zinc-300">
                    <strong className="text-white">Refund Window:</strong> Refund requests must be submitted within 14 days of the original purchase date.
                  </p>
                </div>
              </section>

              {/* B. When refunds are NOT allowed */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <X className="w-6 h-6 text-red-500" />
                  B. When Refunds Are NOT Allowed
                </h2>
                <p className="text-zinc-300 mb-4">
                  Refunds will not be issued in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
                  <li><strong className="text-white">After Subscription Period:</strong> After the subscription period has been used or expired</li>
                  <li><strong className="text-white">Change of Mind:</strong> If you simply changed your mind about the purchase</li>
                  <li><strong className="text-white">Wrong Item Purchased:</strong> If you purchased the wrong item due to your own error (we may offer account credit at our discretion)</li>
                  <li><strong className="text-white">Beyond Refund Window:</strong> Refund requests made more than 14 days after the original purchase</li>
                  <li><strong className="text-white">Violation of Terms:</strong> If your account was terminated due to violation of our Terms of Service</li>
                  <li><strong className="text-white">Used Services:</strong> If you have already used a significant portion of the service or consumed the product</li>
                </ul>
              </section>

              {/* C. Special cases for subscriptions */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-indigo-500" />
                  C. Special Cases for Subscriptions
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Renewal Charges</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      If you forgot to cancel your subscription and were charged for a renewal, you may be eligible for a refund
                      if you contact us within 7 days of the renewal charge. After 7 days, refunds for renewal charges are at our discretion.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Prorated Refunds</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      <strong className="text-white">Prorated refunds are not available.</strong> Refunds for subscriptions are issued
                      on a full-period basis only. If you cancel mid-period, you will retain access until the end of the current billing period,
                      but no refund will be issued for the unused portion.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Cancel Anytime</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end
                      of your current billing period. You will continue to have access to the service until the end of the paid period.
                    </p>
                  </div>
                </div>
              </section>

              {/* D. How to request a refund */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-indigo-500" />
                  D. How to Request a Refund
                </h2>
                <p className="text-zinc-300 mb-4">
                  To request a refund, please contact our support team with the following information:
                </p>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 mb-4">
                  <p className="text-zinc-300 mb-2">
                    <strong className="text-white">Email:</strong>{' '}
                    <a href="mailto:vokivo@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">
                      vokivo@gmail.com
                    </a>
                  </p>
                  <p className="text-zinc-300 mb-2">
                    <strong className="text-white">Response Time:</strong> We will respond to refund requests within 5 business days.
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">Required Information:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300 ml-4 mt-2">
                    <li>Order number or invoice ID</li>
                    <li>Email address associated with the account</li>
                    <li>Reason for refund request</li>
                    <li>Date of purchase</li>
                    <li>Any relevant screenshots or documentation</li>
                  </ul>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  <strong className="text-white">Example Refund Request:</strong>
                </p>
                <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4 mt-2">
                  <p className="text-zinc-400 text-sm italic">
                    "To request a refund, contact support at vokivo@gmail.com with your order number,
                    email address, and reason for the refund request. We will process your request within 5 business days."
                  </p>
                </div>
              </section>

              {/* E. Paddle handles refunds */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">E. Paddle Handles Refunds</h2>
                <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-lg p-4">
                  <p className="text-zinc-300 leading-relaxed mb-2">
                    <strong className="text-white">All transactions and refunds are handled by Paddle.com, our Merchant of Record.</strong>
                  </p>
                  <p className="text-zinc-300 leading-relaxed">
                    <strong className="text-white">Paddle will appear on your billing statement.</strong>
                  </p>
                  <p className="text-zinc-300 leading-relaxed mt-2">
                    When a refund is approved, Paddle.com will process the refund to the original payment method used for the purchase.
                    Refunds typically appear in your account within 5-10 business days, depending on your financial institution.
                  </p>
                  <p className="text-zinc-300 leading-relaxed mt-2">
                    For questions about refund processing or billing statements, you may also contact Paddle directly at{' '}
                    <a href="https://paddle.com/support" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
                      paddle.com/support
                    </a>
                  </p>
                </div>
              </section>

              {/* Processing Time */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Refund Processing Time</h2>
                <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
                  <li><strong className="text-white">Review Time:</strong> Refund requests are reviewed within 5 business days</li>
                  <li><strong className="text-white">Processing Time:</strong> Once approved, refunds are processed by Paddle within 2-3 business days</li>
                  <li><strong className="text-white">Credit Time:</strong> Refunds appear in your account within 5-10 business days, depending on your financial institution</li>
                </ul>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
                <p className="text-zinc-300 leading-relaxed mb-4">
                  If you have any questions about this Refund Policy, please contact us:
                </p>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                  <p className="text-zinc-300">
                    <strong className="text-white">Email:</strong>{' '}
                    <a href="mailto:vokivo@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">
                      vokivo@gmail.com
                    </a>
                  </p>
                </div>
              </section>

              {/* Changes to Refund Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Refund Policy</h2>
                <p className="text-zinc-300 leading-relaxed">
                  We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting
                  on this page. We encourage you to review this policy periodically. Material changes will be communicated via email
                  to registered users.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}



