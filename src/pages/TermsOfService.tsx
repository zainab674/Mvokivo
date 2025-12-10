import React from 'react';
import DashboardLayout from "@/layout/DashboardLayout";
import { FileText, Scale, AlertTriangle, CreditCard, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
                <FileText className="w-8 h-8 text-indigo-500" />
                <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
              </div>
              <p className="text-zinc-400 text-sm">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-zinc-300 leading-relaxed">
                  These Terms of Service ("Terms") govern your access to and use of our service. By accessing or using our service,
                  you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the service.
                </p>
                <p className="text-zinc-300 leading-relaxed mt-4">
                  <strong className="text-white">Company Information:</strong> These Terms of Service are provided by omnificode 
                  (the "Company", "we", "us", or "our"). Our service is operated under the brand name Vokivo.
                </p>
              </section>

              {/* 1. Acceptance of Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-indigo-500" />
                  1. Acceptance of Terms
                </h2>
                <p className="text-zinc-300 leading-relaxed">
                  By creating an account, accessing, or using our service, you acknowledge that you have read, understood, and agree
                  to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not use our service.
                </p>
              </section>

              {/* 2. Licensing Rules */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Licensing Rules for Software</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">2.1 License Grant</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable,
                      revocable license to access and use our service for your personal or business purposes.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">2.2 License Restrictions</h3>
                    <p className="text-zinc-300 leading-relaxed mb-2">You may not:</p>
                    <ul className="list-disc list-inside space-y-1 text-zinc-300 ml-4">
                      <li>Copy, modify, or create derivative works of the software</li>
                      <li>Reverse engineer, decompile, or disassemble the software</li>
                      <li>Remove or alter any proprietary notices or labels</li>
                      <li>Rent, lease, or sublicense the software to third parties</li>
                      <li>Use the software for any illegal or unauthorized purpose</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">2.3 Intellectual Property</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      All rights, title, and interest in and to the service, including all intellectual property rights,
                      remain with us and our licensors. These Terms do not grant you any rights to use our trademarks,
                      service marks, or logos.
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. Usage Restrictions */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  3. Usage Restrictions
                </h2>
                <p className="text-zinc-300 mb-4">You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
                  <li>Use the service in any way that violates applicable laws or regulations</li>
                  <li>Interfere with or disrupt the service or servers connected to the service</li>
                  <li>Attempt to gain unauthorized access to any portion of the service</li>
                  <li>Transmit any viruses, malware, or other harmful code</li>
                  <li>Use the service to send spam, unsolicited messages, or harass others</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation</li>
                  <li>Collect or harvest information about other users without their consent</li>
                  <li>Use automated systems to access the service without authorization</li>
                </ul>
              </section>

              {/* 4. Subscription Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-indigo-500" />
                  4. Subscription Terms
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">4.1 Subscription Plans</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      We offer various subscription plans with different features and pricing. Subscription fees are billed
                      in advance on a recurring basis (monthly or annually) as selected by you.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">4.2 Payment Processing</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      All payments are processed securely by Paddle.com, our Merchant of Record. Paddle will appear on your
                      billing statement. By subscribing, you authorize Paddle to charge your payment method for the subscription fee.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">4.3 Price Changes</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      We reserve the right to modify subscription prices at any time. Price changes will be communicated to you
                      at least 30 days in advance. If you do not agree to the new price, you may cancel your subscription before
                      the change takes effect.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">4.4 Automatic Renewal</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      Subscriptions automatically renew at the end of each billing period unless cancelled. You will be charged
                      the then-current subscription fee for the renewal period.
                    </p>
                  </div>
                </div>
              </section>

              {/* 5. Cancellation Rules */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <X className="w-6 h-6 text-red-500" />
                  5. Cancellation Rules
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">5.1 Cancellation by You</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      You may cancel your subscription at any time through your account settings. Cancellation will take effect
                      at the end of your current billing period. You will continue to have access to the service until the end
                      of the paid period.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">5.2 Cancellation by Us</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      We reserve the right to suspend or terminate your subscription and access to the service at any time,
                      with or without cause, including but not limited to violation of these Terms, non-payment, or fraudulent activity.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">5.3 Effect of Cancellation</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      Upon cancellation, your access to the service will continue until the end of the current billing period.
                      No refunds will be issued for the unused portion of the billing period, except as required by law or as
                      specified in our Refund Policy.
                    </p>
                  </div>
                </div>
              </section>

              {/* 6. Billing Explanations */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Billing Explanations</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">6.1 Billing Cycle</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      Subscription fees are charged in advance for the billing period you selected (monthly or annually).
                      The billing cycle begins on the date you subscribe and renews automatically on the same date each period.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">6.2 Failed Payments</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      If a payment fails, we will attempt to charge your payment method again. If payment continues to fail,
                      we may suspend or terminate your subscription. You are responsible for ensuring your payment information is current.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">6.3 Taxes</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      All fees are exclusive of applicable taxes. You are responsible for paying any taxes, duties, or fees
                      imposed by your jurisdiction.
                    </p>
                  </div>
                </div>
              </section>

              {/* 7. Account Responsibilities */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Account Responsibilities</h2>
                <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                  <li>You must provide accurate and complete information when creating an account</li>
                  <li>You must be at least 18 years old to use the service</li>
                </ul>
              </section>

              {/* 8. Service Availability */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Service Availability</h2>
                <p className="text-zinc-300 leading-relaxed">
                  We strive to provide reliable service but do not guarantee uninterrupted or error-free operation. The service
                  may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We are not
                  liable for any loss or damage resulting from service interruptions.
                </p>
              </section>

              {/* 9. Legal Disclaimers */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Legal Disclaimers</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">9.1 Disclaimer of Warranties</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                      INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">9.2 Limitation of Liability</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                      CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY,
                      OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">9.3 Indemnification</h3>
                    <p className="text-zinc-300 leading-relaxed">
                      You agree to indemnify and hold us harmless from any claims, damages, losses, liabilities, and expenses
                      (including legal fees) arising out of your use of the service or violation of these Terms.
                    </p>
                  </div>
                </div>
              </section>

              {/* 10. Modifications to Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. Modifications to Terms</h2>
                <p className="text-zinc-300 leading-relaxed">
                  We reserve the right to modify these Terms at any time. Material changes will be communicated to you via email
                  or through the service. Your continued use of the service after changes become effective constitutes acceptance
                  of the modified Terms.
                </p>
              </section>

              {/* 11. Governing Law */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law</h2>
                <p className="text-zinc-300 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard
                  to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive
                  jurisdiction of the courts in [Your Jurisdiction].
                </p>
              </section>

              {/* 12. Contact Information */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
                <p className="text-zinc-300 leading-relaxed mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 space-y-2">
                  <p className="text-zinc-300">
                    <strong className="text-white">Company Name:</strong> omnificode
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">Email:</strong>{' '}
                    <a href="mailto:vokivo@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">
                      vokivo@gmail.com
                    </a>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}





