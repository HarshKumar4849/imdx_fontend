import { useState } from 'react';
import { CATALOG_OFFERS } from '../../data/dashboardData';
import type { OnboardingState } from '../../types/onboarding';

interface SubPageBaseProps {
  subscribedOfferIds: string[];
  onToggleSubscribe: (id: string) => void;
  onGoToCatalog: () => void;
}

export function SubscriptionsPage({
  subscribedOfferIds,
  onToggleSubscribe,
  onGoToCatalog,
}: SubPageBaseProps) {
  const subscribed = CATALOG_OFFERS.filter((o) => subscribedOfferIds.includes(o.id));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">
          Workspace &gt; <span className="font-medium text-[#403939]">Subscription</span>
        </p>
        <h1 className="mt-2 text-[28px] sm:text-[32px] font-bold text-black leading-tight">
          Subscription
        </h1>
        <p className="mt-1 text-[16px] sm:text-[18px] text-[#808080]">
          Active dataset subscriptions and data-access agreements.
        </p>
      </div>

      <div className="bg-white border border-[#c7c4c4] rounded-[11px] p-6">
        {subscribed.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[18px] text-[#808080]">No active subscriptions yet.</p>
            <button
              type="button"
              onClick={onGoToCatalog}
              className="mt-4 h-[40px] px-6 rounded-[45px] bg-[#002456] text-white text-[15px] font-semibold cursor-pointer"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f1f1]">
            {subscribed.map((offer) => (
              <div
                key={offer.id}
                className="py-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[17px] font-semibold text-[#0f0f0f]">{offer.title}</h2>
                    <span className="rounded-full bg-[#e8e7e7] px-3 py-0.5 text-[13px] text-[#0f0f0f]">
                      {offer.protocol}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] text-[#808080]">
                    {offer.publisher} · {offer.licence} · {offer.updateFrequency}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleSubscribe(offer.id)}
                  className="h-[36px] px-4 rounded-full border border-[#c1c1c1] text-[14px] text-[#dc2626] hover:bg-[#fef2f2] cursor-pointer"
                >
                  Unsubscribe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TransfersPage() {
  const transfers = [
    {
      id: 'TX-9041',
      dataset: 'Pune Urban Traffic Data',
      direction: 'Inbound',
      volume: '148.2 MB',
      status: 'Completed',
      timestamp: 'Today, 22:15 IST',
    },
    {
      id: 'TX-9040',
      dataset: 'PMPL Gps Tracking',
      direction: 'Outbound',
      volume: '62.4 MB',
      status: 'Completed',
      timestamp: 'Today, 21:50 IST',
    },
    {
      id: 'TX-9039',
      dataset: 'City EV Charging Availability',
      direction: 'Inbound',
      volume: '19.8 MB',
      status: 'Streaming',
      timestamp: 'Live',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">Workspace &gt; Transfer</p>
        <h1 className="mt-2 text-[28px] sm:text-[32px] font-bold text-black leading-tight">
          Transfer
        </h1>
        <p className="mt-1 text-[16px] sm:text-[18px] text-[#808080]">
          Monitor inbound and outbound EDC connector data transfers.
        </p>
      </div>

      <div className="bg-white border border-[#c7c4c4] rounded-[11px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-[rgba(187,209,226,0.39)] text-[15px] text-[#0f0f0f]">
                <th className="py-3.5 px-5 font-normal">Transfer ID</th>
                <th className="py-3.5 px-4 font-normal">Dataset</th>
                <th className="py-3.5 px-4 font-normal">Direction</th>
                <th className="py-3.5 px-4 font-normal">Volume</th>
                <th className="py-3.5 px-4 font-normal">Timestamp</th>
                <th className="py-3.5 px-5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1f1] text-[15px] text-[#565555]">
              {transfers.map((tx) => (
                <tr key={tx.id}>
                  <td className="py-4 px-5 font-['Roboto_Mono',monospace] text-[13px] text-[#0f0f0f]">
                    {tx.id}
                  </td>
                  <td className="py-4 px-4 font-medium text-[#0f0f0f]">{tx.dataset}</td>
                  <td className="py-4 px-4">{tx.direction}</td>
                  <td className="py-4 px-4">{tx.volume}</td>
                  <td className="py-4 px-4">{tx.timestamp}</td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-0.5 text-[13px] font-medium ${
                        tx.status === 'Completed'
                          ? 'bg-[#dcffe5] text-[#059669]'
                          : 'bg-[#e6ecff] text-[#3553ab]'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ComputePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">Workspace &gt; Compute</p>
        <h1 className="mt-2 text-[28px] sm:text-[32px] font-bold text-black leading-tight">
          Compute
        </h1>
        <p className="mt-1 text-[16px] sm:text-[18px] text-[#808080]">
          Managed workspace compute runtime and connector nodes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Hosting Mode', value: 'Hosted By IMDX', sub: 'Region: ap-south-1 (Mumbai)' },
          { label: 'Connector Uptime', value: '99.98%', sub: 'Healthy · 2 active workers' },
          { label: 'Memory Utilization', value: '42%', sub: '3.4 GB / 8 GB allocated' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-[#c7c4c4] rounded-[11px] p-6">
            <p className="text-[15px] text-[#808080]">{card.label}</p>
            <p className="mt-2 text-[22px] font-bold text-[#0f0f0f]">{card.value}</p>
            <p className="mt-1 text-[14px] text-[#565555]">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">Workspace &gt; Billing</p>
        <h1 className="mt-2 text-[28px] sm:text-[32px] font-bold text-black leading-tight">
          Billing
        </h1>
        <p className="mt-1 text-[16px] sm:text-[18px] text-[#808080]">
          Workspace plan, usage metering, and recent invoices.
        </p>
      </div>

      <div className="bg-white border border-[#c7c4c4] rounded-[11px] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[15px] text-[#808080]">Current Plan</p>
          <p className="mt-1 text-[22px] font-bold text-[#0f0f0f]">
            IMDX Hosted Organization Tier
          </p>
          <p className="mt-1 text-[15px] text-[#565555]">
            Next billing cycle: 1st of next month · Zero overdue invoices
          </p>
        </div>
        <span className="rounded-full bg-[#dcffe5] text-[#059669] px-4 py-1.5 text-[14px] font-medium">
          Active
        </span>
      </div>
    </div>
  );
}

interface SettingsPageProps {
  onboardingState: OnboardingState;
}

export function SettingsPage({ onboardingState }: SettingsPageProps) {
  const [consentAutoApprove, setConsentAutoApprove] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const orgName =
    onboardingState.organization.legalName || 'ABC Mobility Technologies Pvt. Ltd.';
  const repEmail =
    onboardingState.representative.email ||
    onboardingState.registration.workEmail ||
    'sde1@tecmotivsolutions.com';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">Workspace &gt; Settings</p>
        <h1 className="mt-2 text-[28px] sm:text-[32px] font-bold text-black leading-tight">
          Settings
        </h1>
        <p className="mt-1 text-[16px] sm:text-[18px] text-[#808080]">
          Your profile and data-consent preferences.
        </p>
      </div>

      <div className="bg-white border border-[#c7c4c4] rounded-[11px] p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[14px] text-[#808080]">Organization Name</p>
            <p className="mt-1 text-[17px] font-semibold text-[#0f0f0f]">{orgName}</p>
          </div>
          <div>
            <p className="text-[14px] text-[#808080]">Primary Work Email</p>
            <p className="mt-1 text-[17px] font-semibold text-[#0f0f0f]">{repEmail}</p>
          </div>
          <div>
            <p className="text-[14px] text-[#808080]">Application Reference</p>
            <p className="mt-1 text-[17px] font-semibold text-[#0f0f0f]">
              {onboardingState.applicationNumber}
            </p>
          </div>
          <div>
            <p className="text-[14px] text-[#808080]">Deployment Mode</p>
            <p className="mt-1 text-[17px] font-semibold text-[#0f0f0f]">Hosted By IMDX</p>
          </div>
        </div>

        <hr className="border-[#e2e8f0]" />

        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-[16px] font-medium text-[#0f0f0f]">
                Automatic Data-Consent Verification
              </p>
              <p className="text-[14px] text-[#808080]">
                Allow verified IMDX network participants to request ODbL datasets automatically.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentAutoApprove}
              onChange={(e) => setConsentAutoApprove(e.target.checked)}
              className="size-6 accent-[#32c4a6] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-[16px] font-medium text-[#0f0f0f]">
                Email Notifications for Approvals &amp; Transfers
              </p>
              <p className="text-[14px] text-[#808080]">
                Receive alerts when dataset approvals or subscription requests arrive.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="size-6 accent-[#32c4a6] cursor-pointer"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-4">
          {savedToast && (
            <span className="text-[14px] font-medium text-[#059669]">Preferences saved.</span>
          )}
          <button
            type="button"
            onClick={() => {
              setSavedToast(true);
              window.setTimeout(() => setSavedToast(false), 2500);
            }}
            className="h-[42px] px-6 rounded-[45px] bg-[#32c4a6] hover:bg-[#2ab195] text-white text-[15px] font-semibold cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
