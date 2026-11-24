import { useState } from 'react';
import type { DatasetStatus, MyDatasetItem } from '../../types/dashboard';

interface RegisterDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dataset: MyDatasetItem) => void;
}

export function RegisterDatasetModal({ isOpen, onClose, onCreate }: RegisterDatasetModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Public transport');
  const [coverage, setCoverage] = useState('Pune');
  const [updateFrequency, setUpdateFrequency] = useState('Every 5 min');
  const [status, setStatus] = useState<DatasetStatus>('Awaiting Approval');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a dataset name.');
      return;
    }
    onCreate({
      id: `ds-${Date.now()}`,
      name: name.trim(),
      category: category.trim() || 'Mobility',
      coverage: coverage.trim() || 'India',
      updateFrequency: updateFrequency.trim() || 'Daily',
      quality: '95%',
      status,
    });
    setName('');
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-dataset-title"
    >
      <div className="w-full max-w-[540px] rounded-[16px] bg-white border border-[#c1c1c1] p-6 sm:p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="register-dataset-title" className="text-[22px] font-bold text-[#0f0f0f]">
              Register Dataset
            </h2>
            <p className="mt-1 text-[15px] text-[#808080]">
              Publish a new mobility dataset to your IMDX Workspace registry.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#808080] hover:text-[#0f0f0f] text-[22px] leading-none px-2 py-1 cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="ds-name" className="block text-[15px] font-medium text-[#0f0f0f] mb-1.5">
              Dataset Name <span className="text-[#dc2626]">*</span>
            </label>
            <input
              id="ds-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Pune Bus Telemetry Feed"
              className="w-full h-[46px] rounded-[10px] border border-[#c1c1c1] px-3.5 text-[15px] focus:outline-none focus:border-[#002456]"
            />
            {error && <p className="mt-1 text-[13px] text-[#dc2626]">{error}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ds-category" className="block text-[15px] font-medium text-[#0f0f0f] mb-1.5">
                Category
              </label>
              <select
                id="ds-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-[46px] rounded-[10px] border border-[#c1c1c1] px-3 text-[15px] bg-white focus:outline-none focus:border-[#002456]"
              >
                <option value="Public transport">Public transport</option>
                <option value="Traffic">Traffic</option>
                <option value="EV Charging">EV Charging</option>
                <option value="Micromobility">Micromobility</option>
              </select>
            </div>

            <div>
              <label htmlFor="ds-coverage" className="block text-[15px] font-medium text-[#0f0f0f] mb-1.5">
                Coverage
              </label>
              <input
                id="ds-coverage"
                type="text"
                value={coverage}
                onChange={(e) => setCoverage(e.target.value)}
                className="w-full h-[46px] rounded-[10px] border border-[#c1c1c1] px-3.5 text-[15px] focus:outline-none focus:border-[#002456]"
              />
            </div>

            <div>
              <label htmlFor="ds-freq" className="block text-[15px] font-medium text-[#0f0f0f] mb-1.5">
                Update frequency
              </label>
              <select
                id="ds-freq"
                value={updateFrequency}
                onChange={(e) => setUpdateFrequency(e.target.value)}
                className="w-full h-[46px] rounded-[10px] border border-[#c1c1c1] px-3 text-[15px] bg-white focus:outline-none focus:border-[#002456]"
              >
                <option value="Every 1 min">Every 1 min</option>
                <option value="Every 5 min">Every 5 min</option>
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            <div>
              <label htmlFor="ds-status" className="block text-[15px] font-medium text-[#0f0f0f] mb-1.5">
                Initial Status
              </label>
              <select
                id="ds-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as DatasetStatus)}
                className="w-full h-[46px] rounded-[10px] border border-[#c1c1c1] px-3 text-[15px] bg-white focus:outline-none focus:border-[#002456]"
              >
                <option value="Awaiting Approval">Awaiting Approval</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[42px] px-5 rounded-[45px] border border-[#c1c1c1] bg-[#fcfcfc] text-[15px] font-semibold text-[#0f0f0f] hover:bg-[#f2f2f2] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[42px] px-6 rounded-[45px] bg-[#002456] hover:bg-[#00337a] text-[15px] font-semibold text-white cursor-pointer"
            >
              Register Dataset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
