"use client";

interface ConfirmDeleteDialogProps {
  itemName: string;
  itemType?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDeleteDialog({
  itemName,
  itemType = "item",
  onConfirm,
  onClose,
}: ConfirmDeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(29,33,28,0.5)] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#d9d0c1] bg-[#fbf7ef] shadow-[0_24px_80px_rgba(43,34,24,0.2)]">
        {/* Icon */}
        <div className="flex justify-center pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f7c1c1] bg-[#fcebeb]">
            <svg
              className="h-5 w-5 text-[#a32d2d]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="px-6 py-4 text-center">
          <h2 className="text-base font-bold text-[#1d211c]">Delete {itemType}?</h2>
          <p className="mt-1.5 text-sm text-[#6f675b]">
            <span className="font-medium text-[#1d211c]">{itemName}</span> will be permanently
            removed from your portfolio. This cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-[#e4dece] px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#d9d0c1] bg-white px-4 py-2 text-sm font-medium text-[#6f675b] transition-colors hover:bg-[#f4ede0]"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 rounded-lg bg-[#a32d2d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#791f1f]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}