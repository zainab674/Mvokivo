import React from 'react';
import DashboardLayout from "@/layout/DashboardLayout";
import { Shield, Lock, Eye, Trash2, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800/50 p-8 md:p-12">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-indigo-500" />
                <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
              </div>
              <p className="text-zinc-400 text-sm">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-zinc-300 leading-relaxed">
                  This Privacy Policy describes how we collect, use, and protect your personal information when you use our service.
                  We are committed to protecting your privacy and ensuring the security of your data.
                </p>
              </section>

              {/* A. What data we collect */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-indigo-500" />
                  A. What Data We Collect
                </h2>
                <p className="text-zinc-300 mb-4">
                  We collect the following types of information to provide and improve our services:
                </p>
                <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
                  <li><strong className="text-white">Name:</strong> Your full name or business name</li>
                  <li><strong className="text-white">Email:</strong> Your email address for account communication</li>
                  <li><strong className="text-white">Billing Address:</strong> Address information for billing purposes</li>
                  <li><strong className="text-white">Payment Information:</strong> Payment details are securely handled by Paddle.com as our Merchant of Record</li>
                  <li><strong className="text-white">Usage Logs:</strong> Optional usage data to improve our service (collected with your consent)</li>
                  <li><strong className="text-white">Account Information:</strong> Profile settings, preferences, and account configuration</li>
                </ul>
              </section>

              {/* B. Why we collect that data */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">B. Why We Collect That Data</h2>
                <p className="text-zinc-300 mb-4">
                  We collect and use your data for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
                  <li>To create and manage your user account</li>
                  <li>To process payments securely via Paddle.com, our Merchant of Record</li>
                  <li>To send invoices, receipts, and important account updates</li>
                  <li>To provide customer support and respond to your inquiries</li>
                  <li>To improve our service, features, and user experience</li>
                  <li>To comply with legal obligations and prevent fraud</li>
                  <li>To send you service-related notifications and updates</li>
                </ul>
              </section>

              {/* C. What Paddle collects & processes */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">C. What Paddle Collects & Processes</h2>
                <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-lg p-4 mb-4">
                  <p className="text-zinc-300 leading-relaxed">
                    <strong className="text-white">All payments are securely processed by Paddle.com as our Merchant of Record.</strong>
                  </p>
                  <p className="text-zinc-300 leading-relaxed mt-2">
                    Paddle may collect personal and financial information necessary to fulfill your order, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300 ml-4 mt-2">
                    <li>Payment card information</li>
                    <li>Billing address</li>
                    <li>Transaction history</li>
                    <li>Contact information for order fulfillment</li>
                  </ul>
                  <p className="text-zinc-300 leading-relaxed mt-2">
                    Paddle's collection and use of your information is governed by their own Privacy Policy.
                    We recommend reviewing Paddle's privacy practices at{' '}
                    <a href="https://paddle.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
                      paddle.com/privacy
                    </a>
                  </p>
                </div>
              </section>

              {/* D. What we do NOT store */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">D. What We Do NOT Store</h2>
                <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-4">
                  <p className="text-zinc-300 leading-relaxed mb-2">
                    <strong className="text-white">We do not store or process full credit card details.</strong>
                  </p>
                  <p className="text-zinc-300 leading-relaxed">
                    <strong className="text-white">All financial data is handled securely by Paddle.</strong>
                  </p>
                  <p className="text-zinc-300 leading-relaxed mt-2">
                    We never have access to your complete payment card information. All payment processing,
                    including the storage of payment credentials, is handled exclusively by Paddle.com.
                  </p>
                </div>
              </section>

              {/* E. How we protect user data */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-indigo-500" />
                  E. How We Protect User Data
                </h2>
                <p className="text-zinc-300 mb-4">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
                  <li><strong className="text-white">Encryption:</strong> All data in transit is encrypted using TLS/SSL protocols</li>
                  <li><strong className="text-white">Secure Servers:</strong> Data is stored on secure, monitored servers with regular security updates</li>
                  <li><strong className="text-white">Limited Access:</strong> Access to personal data is restricted to authorized personnel only</li>
                  <li><strong className="text-white">Regular Audits:</strong> We conduct regular security audits and assessments</li>
                  <li><strong className="text-white">Data Backup:</strong> Regular backups ensure data integrity and availability</li>
                  <li><strong className="text-white">Access Controls:</strong> Multi-factor authentication and role-based access controls</li>
                </ul>
              </section>

              {/* F. How long data is kept */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">F. How Long Data Is Kept</h2>
                <p className="text-zinc-300 leading-relaxed">
                  <strong className="text-white">We retain account-related information as long as the account is active.</strong>
                </p>
                <p className="text-zinc-300 leading-relaxed mt-2">
                  After account deletion, we may retain certain information for legal, regulatory, or business purposes for a period
                  not exceeding 7 years, as required by applicable laws. Usage logs and analytics data may be retained in anonymized
                  form for service improvement purposes.
                </p>
              </section>

              {/* G. User Rights */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-indigo-500" />
                  G. Your Rights
                </h2>
                <p className="text-zinc-300 mb-4">
                  Depending on your location and applicable data protection laws (such as GDPR), you have the following rights:
                </p>
                <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-4">
                  <li><strong className="text-white">Right to Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li><strong className="text-white">Right to Delete:</strong> Request deletion of your personal data (subject to legal requirements)</li>
                  <li><strong className="text-white">Right to Update:</strong> Correct or update inaccurate personal information</li>
                  <li><strong className="text-white">Right to Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong className="text-white">Right to Object:</strong> Object to processing of your data for certain purposes</li>
                  <li><strong className="text-white">Right to Restrict Processing:</strong> Request limitation of how we process your data</li>
                  <li><strong className="text-white">Right to Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
                </ul>
                <p className="text-zinc-300 leading-relaxed mt-4">
                  To exercise any of these rights, please contact us using the information provided in the Contact section below.
                </p>
              </section>

              {/* H. Contact Information */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-indigo-500" />
                  H. Contact Information
                </h2>
                <p className="text-zinc-300 leading-relaxed mb-4">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                  <p className="text-zinc-300">
                    <strong className="text-white">Email:</strong>{' '}
                    <a href="mailto:vokivo@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">
                      vokivo@gmail.com
                    </a>
                  </p>
                  <p className="text-zinc-300 mt-2">
                    We will respond to your inquiry within 30 days.
                  </p>
                </div>
              </section>

              {/* Changes to Privacy Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Privacy Policy</h2>
                <p className="text-zinc-300 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
                  the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this
                  Privacy Policy periodically for any changes.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}




