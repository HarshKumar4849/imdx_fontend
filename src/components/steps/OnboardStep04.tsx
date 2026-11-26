import { useEffect, useRef, useState } from 'react';
import deleteIcon from '../../assets/delete-icon.svg';
import fileIcon from '../../assets/file-icon.svg';
import retryIcon from '../../assets/retry-icon.svg';
import uploadDocBack from '../../assets/upload-doc-back.svg';
import uploadDocFront from '../../assets/upload-doc-front.svg';
import type { DocumentSlotKey, DocumentSlotState } from '../../types/onboarding';
import { imdxApi } from '../../services/imdxApi';
import { StepActions } from '../StepActions';

interface OnboardStep04Props {
  applicationNumber: string;
  documents: Record<DocumentSlotKey, DocumentSlotState>;
  onChange: (
    updater: (
      prev: Record<DocumentSlotKey, DocumentSlotState>,
    ) => Record<DocumentSlotKey, DocumentSlotState>,
  ) => void;
  onBack: () => void;
  onNext: () => void;
}

const SLOT_ORDER: DocumentSlotKey[] = [
  'incorporationCertificate',
  'pan',
  'gstCertificate',
  'authorizationLetter',
];

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function isValidFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function OnboardStep04({
  applicationNumber,
  documents,
  onChange,
  onBack,
  onNext,
}: OnboardStep04Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<Record<string, number>>({});
  const [targetSlot, setTargetSlot] = useState<DocumentSlotKey | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach((timerId) => window.clearInterval(timerId));
    };
  }, []);

  const clearSlotTimer = (key: DocumentSlotKey) => {
    if (timersRef.current[key]) {
      window.clearInterval(timersRef.current[key]);
      delete timersRef.current[key];
    }
  };

  const startFileUpload = (slotKey: DocumentSlotKey, file: File) => {
    clearSlotTimer(slotKey);
    setFormError('');

    if (!isValidFile(file)) {
      onChange((prev) => ({
        ...prev,
        [slotKey]: {
          ...prev[slotKey],
          fileName: file.name,
          fileSizeLabel: formatFileSize(file.size),
          progress: 40,
          status: 'failed',
          errorMessage: 'Invalid file format. Upload PDF, PNG, or JPG.',
        },
      }));
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      onChange((prev) => ({
        ...prev,
        [slotKey]: {
          ...prev[slotKey],
          fileName: file.name,
          fileSizeLabel: formatFileSize(file.size),
          progress: 40,
          status: 'failed',
          errorMessage: 'File exceeds 10 MB limit.',
        },
      }));
      return;
    }

    const sizeLabel = formatFileSize(file.size);
    void imdxApi.uploadDocument(applicationNumber, slotKey, file);
    onChange((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        fileName: file.name,
        fileSizeLabel: sizeLabel,
        progress: 25,
        status: 'uploading',
        errorMessage: undefined,
      },
    }));

    timersRef.current[slotKey] = window.setInterval(() => {
      onChange((prev) => {
        const current = prev[slotKey];
        if (!current || current.status !== 'uploading') {
          clearSlotTimer(slotKey);
          return prev;
        }
        const nextProgress = Math.min(100, current.progress + 25);
        const done = nextProgress >= 100;
        if (done) {
          clearSlotTimer(slotKey);
        }
        return {
          ...prev,
          [slotKey]: {
            ...current,
            progress: nextProgress,
            status: done ? 'uploaded' : 'uploading',
          },
        };
      });
    }, 180);
  };

  const handleFilesSelected = (fileList: FileList | null, explicitSlot?: DocumentSlotKey | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    if (explicitSlot) {
      startFileUpload(explicitSlot, files[0]);
      setTargetSlot(null);
      return;
    }

    const emptySlots = SLOT_ORDER.filter((key) => documents[key].status === 'empty');
    files.forEach((file, idx) => {
      const slotKey = emptySlots[idx] ?? SLOT_ORDER[idx % SLOT_ORDER.length];
      if (slotKey) {
        startFileUpload(slotKey, file);
      }
    });
  };

  const handleRemoveSlot = (slotKey: DocumentSlotKey) => {
    clearSlotTimer(slotKey);
    onChange((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        fileName: undefined,
        fileSizeLabel: undefined,
        progress: 0,
        status: 'empty',
        errorMessage: undefined,
      },
    }));
  };

  const handleRetrySlot = (slotKey: DocumentSlotKey) => {
    setTargetSlot(slotKey);
    fileInputRef.current?.click();
  };

  const handleBrowseClick = (slotKey: DocumentSlotKey | null = null) => {
    setTargetSlot(slotKey);
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = SLOT_ORDER.filter((key) => documents[key].status !== 'uploaded');
    if (missing.length > 0) {
      setFormError(
        `Please upload all required verification documents (${missing
          .map((k) => documents[k].title)
          .join(', ')}).`,
      );
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <p className="imdx-kicker">IMDX / STEP 04</p>
        <h2 className="mt-0.5 text-[19px] sm:text-[21px] text-[#102529] leading-tight">
          Document Verification
        </h2>
        <p className="mt-1 text-[13px] sm:text-[14px] text-[#59666d]">
          Upload PDF, PNG or JPG files (max. 10 MB each).
        </p>
      </div>

      <div className="imdx-card rounded-[14px] p-5 sm:p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple={!targetSlot}
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files, targetSlot);
            e.target.value = '';
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-center">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFilesSelected(e.dataTransfer.files, null);
            }}
            className="flex flex-col items-center justify-center py-2 lg:pr-6 lg:border-r lg:border-[#0f766e]/15"
          >
            <button
              type="button"
              onClick={() => handleBrowseClick(null)}
              className={`relative flex items-center justify-center w-[132px] h-[124px] rounded-[16px] border-2 border-dashed transition-all cursor-pointer ${
                isDragging
                  ? 'bg-[#e5faf6] border-[#00a5c3] scale-[1.02]'
                  : 'bg-[#f4fbfa] border-[#9ec7c2] hover:border-[#00a5c3]'
              }`}
              aria-label="Drop or select verification files"
            >
              <div className="relative w-[50px] h-[48px]">
                <img
                  src={uploadDocBack}
                  alt=""
                  width={39}
                  height={43}
                  className="absolute right-0 top-0 pointer-events-none"
                />
                <img
                  src={uploadDocFront}
                  alt=""
                  width={45}
                  height={47}
                  className="absolute left-0 bottom-0 pointer-events-none"
                />
              </div>
            </button>

            <p className="mt-3 text-[14px] font-semibold text-[#192a2c]">Drag files here</p>
            <p className="mt-0.5 text-[12.5px] text-[#59666d]">Or</p>
            <button
              type="button"
              onClick={() => handleBrowseClick(null)}
              className="mt-2 h-[36px] px-6 rounded-[45px] imdx-btn-primary text-[13.5px] font-semibold cursor-pointer"
            >
              Browse
            </button>
          </div>

          {/* Document slots */}
          <div className="space-y-2.5">
            {SLOT_ORDER.map((key) => {
              const doc = documents[key];
              const isEmpty = doc.status === 'empty';
              const isUploaded = doc.status === 'uploaded';
              const isFailed = doc.status === 'failed';

              if (isEmpty) {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleBrowseClick(key)}
                    className="w-full text-left bg-gradient-to-r from-[#effcf9]/95 via-[#eff8fe]/95 to-[#edf4ff]/95 hover:from-[#dffaf3] hover:to-[#e2eeff] border border-[#b4d7de] hover:border-[#00a5c3] rounded-[10px] px-4 py-3 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-semibold text-[#102529]">
                          {doc.title}
                          {doc.required && <span className="text-[#dc2626] ml-1">*</span>}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-[#59666d]">{doc.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#e5faf6] border border-[#00a5c3]/25 px-3 py-0.5 text-[12px] font-semibold text-[#002456]">
                        Upload
                      </span>
                    </div>
                  </button>
                );
              }

              return (
                <div
                  key={key}
                  className="w-full bg-gradient-to-r from-[#f0fcf9] via-[#eff8fe] to-[#edf4ff] border border-[#a8d2dc] rounded-[8.5px] px-4 sm:px-5 py-3.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-[53px] h-[48px] rounded-[8.3px] bg-[#ededed] shrink-0">
                      <img src={fileIcon} alt="" width={20} height={21} className="shrink-0" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="text-[14px] font-medium text-[#0f0f0f] truncate">
                            {doc.title} — {doc.fileName} ({doc.fileSizeLabel})
                          </span>
                          {doc.status === 'uploading' && (
                            <span className="text-[12px] font-medium text-[#3d3c3c]">
                              Uploading...
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isUploaded && (
                            <span className="text-[12px] font-medium text-[#23b321]">
                              Successfully Uploaded
                            </span>
                          )}
                          {isFailed && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-medium text-[#dc2626]">
                                {doc.errorMessage ?? 'Upload Failed'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRetrySlot(key)}
                                className="p-1 hover:opacity-80 cursor-pointer"
                                aria-label={`Retry ${doc.title}`}
                              >
                                <img
                                  src={retryIcon}
                                  alt="Retry"
                                  width={15.5}
                                  height={13.5}
                                  className="shrink-0"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-[7.5px] rounded-full bg-[#d9d9d9] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-150 ${
                              isUploaded
                                ? 'bg-[#23b321]'
                                : isFailed
                                  ? 'bg-[#dc2626]'
                                  : 'bg-[#3553ab]'
                            }`}
                            style={{ width: `${doc.progress}%` }}
                          />
                        </div>
                        <span className="text-[13px] text-[#0f0f0f] w-11 text-right shrink-0">
                          {doc.progress} %
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(key)}
                      className="p-2 hover:bg-[#f1f1f1] rounded-md cursor-pointer shrink-0"
                      aria-label={`Delete ${doc.title}`}
                    >
                      <img src={deleteIcon} alt="Delete" width={20} height={20} className="shrink-0" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {formError && <p className="mt-5 text-[14px] text-[#dc2626]">{formError}</p>}
      </div>

      <StepActions onBack={onBack} />
    </form>
  );
}
