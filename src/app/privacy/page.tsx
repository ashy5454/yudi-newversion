"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Welcome to Yudi. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our service. Please read this policy carefully to understand our practices
              regarding your personal data.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              By using Yudi, you agree to the collection and use of information in accordance with this policy. If you
              do not agree with our policies and practices, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Nature of Service</h2>
            <div className="bg-card border border-border rounded-lg p-6 mb-4">
              <p className="text-foreground/90 leading-relaxed mb-2">
                <strong>Yudi is a Specialized Personal Companion Utility</strong> designed specifically for emotional and
                creative support. Yudi is <strong>NOT a general-purpose AI system</strong> and operates within a
                narrowly defined scope focused on personal companionship, emotional wellness, and creative assistance.
              </p>
              <p className="text-foreground/90 leading-relaxed">
                This specialized utility classification ensures compliance with applicable regulations and platform
                requirements, including Meta's 2026 framework for specialized AI utilities.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Data We Collect</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We collect the following types of information to provide and improve our service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90 mb-4">
              <li>
                <strong>Phone Numbers:</strong> When you use Yudi via WhatsApp, we collect your phone number to
                facilitate communication and service delivery.
              </li>
              <li>
                <strong>Email Addresses:</strong> When you access Yudi through our web platform, we collect your email
                address for account creation, authentication, and service notifications.
              </li>
              <li>
                <strong>Chat Transcripts:</strong> We store your conversation history with Yudi to maintain context,
                improve your experience, and enhance the quality of our service.
              </li>
              <li>
                <strong>Usage Data:</strong> We may collect information about how you interact with our service,
                including timestamps, feature usage, and technical data such as device information and IP addresses.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Model Training Disclosure</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Third-Party Model Training</h3>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-foreground/90 leading-relaxed mb-2">
                  <strong>We have opted out of global training with Google Gemini.</strong> Your personal data,
                  conversations, and interactions with Yudi will <strong>NEVER</strong> be used to train Google's public
                  AI models or any third-party AI systems.
                </p>
                <p className="text-foreground/90 leading-relaxed">
                  We use Google Gemini's API services in a privacy-preserving manner, with all training opt-outs
                  properly configured to ensure your data remains private and is not used for model improvement by
                  third-party providers.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 text-foreground">First-Party Model Training</h3>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-foreground/90 leading-relaxed mb-2">
                  Yudi may use <strong>anonymized and de-identified</strong> chat data for internal model improvements
                  to enhance persona realism and service quality. This means:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground/90 mt-2">
                  <li>All personally identifiable information (phone numbers, emails, names) is removed before any training use</li>
                  <li>Data is aggregated and anonymized using industry-standard techniques</li>
                  <li>Training data cannot be traced back to individual users</li>
                  <li>This process helps improve Yudi's ability to provide more realistic and contextually appropriate responses</li>
                </ul>
              </div>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Opt-Out of First-Party Training</h3>
              <p className="text-foreground/90 leading-relaxed mb-3">
                You have the right to opt-out of first-party training at any time. To opt-out:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>
                  <strong>Via WhatsApp:</strong> Reply with <code className="bg-muted px-2 py-1 rounded text-sm">STOP_TRAIN</code> to any Yudi conversation
                </li>
                <li>
                  <strong>Via Web:</strong> Contact us at <a href="mailto:team@yudi.co.in" className="text-primary hover:underline">team@yudi.co.in</a> with the subject "Opt-Out of Training"
                </li>
              </ul>
              <p className="text-foreground/90 leading-relaxed mt-3">
                Once you opt-out, your data will not be used for any future model training, though previously anonymized data may remain in training datasets.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Your Rights Under DPDPA 2023</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              As a user in India, you have specific rights under the Digital Personal Data Protection Act, 2023
              (DPDPA). We are committed to honoring these rights:
            </p>

            <div className="space-y-4 mb-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Right to Access</h3>
                <p className="text-foreground/90 leading-relaxed mb-2">
                  You have the right to request access to all personal data we hold about you, including:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                  <li>Your account information (email, phone number)</li>
                  <li>Your chat transcripts and conversation history</li>
                  <li>Usage data and analytics associated with your account</li>
                  <li>Any other personal information we have collected</li>
                </ul>
                <p className="text-foreground/90 leading-relaxed mt-3">
                  <strong>To exercise this right:</strong> Send an email to{" "}
                  <a href="mailto:team@yudi.co.in" className="text-primary hover:underline">
                    team@yudi.co.in
                  </a>{" "}
                  with the subject "Data Access Request" and include your registered email or phone number. We will
                  respond within 30 days with a complete copy of your data in a machine-readable format.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Right to Erasure (Deletion)</h3>
                <p className="text-foreground/90 leading-relaxed mb-2">
                  You have the right to request the deletion of your personal data. Upon receiving a valid deletion
                  request, we will:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                  <li>Permanently delete your account and all associated data</li>
                  <li>Remove your chat transcripts and conversation history</li>
                  <li>Delete your contact information (email, phone number)</li>
                  <li>Remove your data from active systems within 30 days</li>
                </ul>
                <p className="text-foreground/90 leading-relaxed mt-3">
                  <strong>To exercise this right:</strong> Send an email to{" "}
                  <a href="mailto:team@yudi.co.in" className="text-primary hover:underline">
                    team@yudi.co.in
                  </a>{" "}
                  with the subject "Data Deletion Request" and include your registered email or phone number. We will
                  confirm deletion within 7 days and complete the process within 30 days.
                </p>
                <p className="text-foreground/90 leading-relaxed mt-2 text-sm">
                  <strong>Note:</strong> Some data may be retained for legal compliance purposes (e.g., transaction
                  records) as required by law, but will not be used for any other purpose.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Age Restriction</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-foreground/90 leading-relaxed mb-2">
                <strong>Yudi is intended for users who are 18 years of age or older.</strong> We do not knowingly
                collect personal information from individuals under the age of 18.
              </p>
              <p className="text-foreground/90 leading-relaxed">
                If you are under 18, please do not use Yudi or provide any personal information to us. If we become
                aware that we have collected personal information from a user under 18, we will take steps to delete
                that information immediately. If you believe we have collected information from someone under 18, please
                contact us at{" "}
                <a href="mailto:team@yudi.co.in" className="text-primary hover:underline">
                  team@yudi.co.in
                </a>
                .
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Data Security</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal data against
              unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and assessments</li>
              <li>Limited access to personal data on a need-to-know basis</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Data Retention</h2>
            <p className="text-foreground/90 leading-relaxed">
              We retain your personal data only for as long as necessary to provide our services and fulfill the
              purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by
              law. When you delete your account or request data deletion, we will remove your data in accordance with
              our deletion procedures.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Changes to This Privacy Policy</h2>
            <p className="text-foreground/90 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other
              operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new
              Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy
              Policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
              please contact us:
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-foreground/90 leading-relaxed">
                <strong>Email:</strong>{" "}
                <a href="mailto:team@yudi.co.in" className="text-primary hover:underline">
                  team@yudi.co.in
                </a>
              </p>
              <p className="text-foreground/90 leading-relaxed mt-2">
                <strong>Website:</strong>{" "}
                <a href="https://yudi.co.in" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  yudi.co.in
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Yudi. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

