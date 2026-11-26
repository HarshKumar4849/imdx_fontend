import { useState } from 'react';
import type { DatasetStatus, MyDatasetItem } from '../../types/dashboard';
import { ModalPortal } from '../ModalPortal';

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
      version: 'v1.0',
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
    <ModalPortal>
      <div
        className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-dataset-title"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
      <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[460px] rounded-[14px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="imdx-kicker">IMDX / DATA REGISTRY</p>
            <h2 id="register-dataset-title" className="mt-0.5 text-[19px] text-[#102529]">
              Register Dataset
            </h2>
            <p className="mt-0.5 text-[13px] text-[#59666d]">
              Publish a new mobility dataset to your IMDX Workspace registry.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#808080] hover:text-[#0f0f0f] text-[20px] leading-none px-1.5 py-0.5 cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label htmlFor="ds-name" className="block text-[13px] font-medium text-[#0f0f0f] mb-1">
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
              className="w-full h-[38px] rounded-[9px] border border-[#c5dbd8] bg-white px-3 text-[13.5px] focus:outline-none focus:border-[#008fa7] focus:ring-4 focus:ring-[#45c0b2]/15"
            />
            {error && <p className="mt-1 text-[12px] text-[#dc2626]">{error}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="ds-category" className="block text-[13px] font-medium text-[#0f0f0f] mb-1">
                Category
              </label>
              <select
                id="ds-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-[38px] rounded-[9px] border border-[#c5dbd8] px-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[#008fa7]"
              >
                <option value="Public transport">Public transport</option>
                <option value="Traffic">Traffic</option>
                <option value="EV Charging">EV Charging</option>
                <option value="Micromobility">Micromobility</option>
              </select>
            </div>

            <div>
              <label htmlFor="ds-coverage" className="block text-[13px] font-medium text-[#0f0f0f] mb-1">
                Coverage
              </label>
              <input
                id="ds-coverage"
                type="text"
                value={coverage}
                onChange={(e) => setCoverage(e.target.value)}
                className="w-full h-[38px] rounded-[9px] border border-[#c5dbd8] bg-white px-3 text-[13.5px] focus:outline-none focus:border-[#008fa7]"
              />
            </div>

            <div>
              <label htmlFor="ds-freq" className="block text-[13px] font-medium text-[#0f0f0f] mb-1">
                Update frequency
              </label>
              <select
                id="ds-freq"
                value={updateFrequency}
                onChange={(e) => setUpdateFrequency(e.target.value)}
                className="w-full h-[38px] rounded-[9px] border border-[#c1c1c1] px-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[#002456]"
              >
                <option value="Every 1 min">Every 1 min</option>
                <option value="Every 5 min">Every 5 min</option>
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            <div>
              <label htmlFor="ds-status" className="block text-[13px] font-medium text-[#0f0f0f] mb-1">
                Initial Status
              </label>
              <select
                id="ds-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as DatasetStatus)}
                className="w-full h-[38px] rounded-[9px] border border-[#c1c1c1] px-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[#002456]"
              >
                <option value="Awaiting Approval">Awaiting Approval</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[36px] px-4 rounded-[45px] border border-[#c1c1c1] bg-[#fcfcfc] text-[13.5px] font-semibold text-[#0f0f0f] hover:bg-[#f2f2f2] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[36px] px-5 rounded-[45px] imdx-btn-primary text-[13.5px] font-semibold cursor-pointer"
            >
              Register Dataset
            </button>
          </div>
        </form>
      </div>
      </div>
    </ModalPortal>
  );
}
