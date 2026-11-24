import { useState } from 'react';
import type { AdminNavKey } from '../../types/dashboard';
import type { OnboardingState } from '../../types/onboarding';

interface AdminDashboardViewProps {
  activeNav: AdminNavKey;
  onboardingState: OnboardingState;
}

export function AdminDashboardView({ activeNav, onboardingState }: AdminDashboardViewProps) {
  const [appStatus, setAppStatus] = useState<'Under Review' | 'Approved'>('Under Review');

  const sectionLabel: Record<AdminNavKey, string> = {
    dashboard: 'Dashboard',
    participants: 'Participants',
    applications: 'Applications',
    policies: 'Policies',
    'audit-log': 'Audit Log',
    purposes: 'Purposes',
    capacity: 'Capacity',
    settings: 'Settings',
  };

  const orgName =
    onboardingState.organization.legalName || 'ABC Mobility Technologies Pvt. Ltd.';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">
          Admin &gt; {sectionLabel[activeNav]}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-black leading-tight">
              {sectionLabel[activeNav]}
            </h1>
            <p className="mt-1 text-[16px] sm:text-[18px] text-[#808080]">
              IMDX network governance, onboarding approvals, and ecosystem monitoring.
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards matching Figma Admin_Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Total Datasets', value: '10', boxBg: 'bg-[#fff1e2]', dot: 'bg-[#f59e0b]' },
          { label: 'Published Dataset', value: '05', boxBg: 'bg-[#e6ecff]', dot: 'bg-[#3553ab]' },
          {
            label: 'Active Subscriptions',
            value: '10',
            boxBg: 'bg-[#e9fffa] border border-[#f1f1f1]',
            dot: 'bg-[#32c4a6]',
          },
          { label: 'Pending Approvals', value: appStatus === 'Approved' ? '09' : '10', boxBg: 'bg-[#fffbe6]', dot: 'bg-[#eab308]' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#f1f1f1] rounded-[11px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)] px-3.5 py-3 flex items-center gap-3.5"
          >
            <div
              className={`h-[53px] w-[51px] rounded-[7px] shrink-0 flex items-center justify-center ${kpi.boxBg}`}
            >
              <span className={`size-3 rounded-full ${kpi.dot}`} />
            </div>
            <div>
              <p className="text-[15px] sm:text-[16px] text-[#808080]">{kpi.label}</p>
              <p className="mt-0.5 text-[24px] font-semibold text-[#0f0f0f]">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Applications queue card */}
      <div className="bg-white border border-[#f1f1f1] rounded-[11px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)] p-6">
        <h2 className="text-[18px] font-semibold text-[#0f0f0f] mb-4">
          Participant Onboarding Applications
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-[rgba(187,209,226,0.39)] text-[15px] text-[#0f0f0f]">
                <th className="py-3 px-4 font-normal">Application #</th>
                <th className="py-3 px-4 font-normal">Organization</th>
                <th className="py-3 px-4 font-normal">Deployment</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1f1] text-[15px] text-[#565555]">
              <tr>
                <td className="py-4 px-4 font-['Roboto_Mono',monospace] text-[13px] text-[#0f0f0f]">
                  {onboardingState.applicationNumber}
                </td>
                <td className="py-4 px-4 font-medium text-[#0f0f0f]">{orgName}</td>
                <td className="py-4 px-4">Hosted By IMDX</td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-0.5 text-[13px] font-medium ${
                      appStatus === 'Approved'
                        ? 'bg-[#dcffe5] text-[#059669]'
                        : 'bg-[#ffeedc] text-[#d97706]'
                    }`}
                  >
                    {appStatus}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  {appStatus === 'Under Review' ? (
                    <button
                      type="button"
                      onClick={() => setAppStatus('Approved')}
                      className="h-[34px] px-4 rounded-full bg-[#32c4a6] hover:bg-[#2ab195] text-white text-[13px] font-semibold cursor-pointer"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className="text-[13px] text-[#059669] font-medium">Provisioned</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
