import React from 'react';
import DashboardLayout from "@/layout/DashboardLayout";
import { RefreshCw, X, CheckCircle, Mail, CreditCard, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RefundPolicy() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

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
                  All transactions and refunds are processed by Paddle.com, our Merchant of Record. As the seller, Paddle shall be entitled to 
                  cancel a Transaction and grant the Buyer a refund of the full price paid in accordance with this policy.
                </p>
              </section>

              {/* Refund Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Refund Policy
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">One-Off Transactions</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      For one-off transactions, Paddle may grant a refund of the full price paid if the Buyer requests a refund within 
                      fourteen (14) days of the date of the transaction and Paddle determines, in its sole discretion, that a refund is appropriate.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Subscription Services</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      For subscription services, Paddle may grant a refund of the full price paid if the Buyer requests a refund within 
                      fourteen (14) days from the date on which the subscription was last renewed and Paddle determines, in its sole discretion, 
                      that a refund is appropriate.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Other Circumstances</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      Paddle may also grant a refund if Paddle reasonably believes that the Transaction was made in error or fraudulently, 
                      if Paddle reasonably believes the Transaction may become subject to a Chargeback, or if required by any applicable law, 
                      regulation, payment method provider or Payment Scheme Rules.
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-lg p-4 mt-4">
                  <p className="text-zinc-300">
                    <strong className="text-white">Important:</strong> All refund decisions are made by Paddle in its sole discretion. 
                    This policy is subject to Paddle's Master Services Agreement and applicable laws and regulations.
                  </p>
                </div>
              </section>

              {/* How to request a refund */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-indigo-500" />
                  How to Request a Refund
                </h2>
                <p className="text-zinc-300 mb-4">
                  To request a refund, please contact our support team or Paddle directly:
                </p>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 mb-4 space-y-3">
                  <div>
                    <p className="text-zinc-300 mb-2">
                      <strong className="text-white">Contact Us:</strong>
                    </p>
                    <p className="text-zinc-300">
                      <strong className="text-white">Email:</strong>{' '}
                      <a href="mailto:vokivo@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">
                        vokivo@gmail.com
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-300 mb-2">
                      <strong className="text-white">Contact Paddle:</strong>
                    </p>
                    <p className="text-zinc-300">
                      You may also contact Paddle directly at{' '}
                      <a href="https://paddle.com/support" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
                        paddle.com/support
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-300">
                      <strong className="text-white">Required Information:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-zinc-300 ml-4 mt-2">
                      <li>Order number or invoice ID</li>
                      <li>Email address associated with the account</li>
                      <li>Date of purchase or subscription renewal</li>
                    </ul>
                  </div>
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
                <p className="text-zinc-300 leading-relaxed mb-4">
                  Once a refund is approved by Paddle, it will be processed to the original payment method used for the purchase. 
                  Refunds typically appear in your account within 5-10 business days, depending on your financial institution.
                </p>
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





