import { useState } from 'react';
import { X, FileDown, FileText } from 'lucide-react';
import { exportApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface Props {
  proposalId: string;
  onClose: () => void;
}

export default function ExportModal({ proposalId, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const [includeCosts, setIncludeCosts] = useState(true);
  const [loading, setLoading] = useState<'pdf' | 'word' | null>(null);

  const dto = {
    includeCosts,
    exportedBy: user!.email,
  };

  const handlePdf = async () => {
    setLoading('pdf');
    try {
      await exportApi.pdf(proposalId, dto);
      toast.success('PDF downloaded successfully');
    } catch {
      toast.error('PDF export failed');
    } finally {
      setLoading(null);
    }
  };

  const handleWord = async () => {
    setLoading('word');
    try {
      await exportApi.word(proposalId, dto);
      toast.success('Word document downloaded');
    } catch {
      toast.error('Word export failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900">Export Proposal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={includeCosts}
              onChange={(e) => setIncludeCosts(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Include Cost Breakdown</span>
          </label>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              className="btn-primary justify-center py-3 flex-col gap-1 h-auto"
              onClick={handlePdf}
              disabled={!!loading}
            >
              <FileDown size={20} />
              <span className="text-xs">{loading === 'pdf' ? 'Generating...' : 'Export PDF'}</span>
            </button>
            <button
              className="btn-secondary justify-center py-3 flex-col gap-1 h-auto"
              onClick={handleWord}
              disabled={!!loading}
            >
              <FileText size={20} />
              <span className="text-xs">{loading === 'word' ? 'Generating...' : 'Export Word'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
