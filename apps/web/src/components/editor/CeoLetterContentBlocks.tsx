import { useState } from 'react';
import { GripVertical, Edit2, X } from 'lucide-react';
import { GrammarCheckTextarea } from './GrammarCheckTextarea';

interface ContentBlock {
  id: string;
  title: string;
  content: string;
}

const DEFAULT_BLOCKS: ContentBlock[] = [
  {
    id: 'aragon-overview',
    title: 'Aragon Overview',
    content:
      'Aragon Pharmaceuticals is a leading contract research, development, and manufacturing organization (CRDMO) specializing in biologics development. With over 15 years of experience, we provide comprehensive solutions from early discovery through commercial manufacturing.',
  },
  {
    id: 'crdmo-experience',
    title: 'CRDMO Experience',
    content:
      'Our team has successfully supported over 200 biologics programs, including 30+ products that have reached clinical trials. We offer integrated services spanning the entire product lifecycle with a proven track record of regulatory success.',
  },
  {
    id: 'biologics-capability',
    title: 'Biologics Capability',
    content:
      'We specialize in monoclonal antibodies, bispecific antibodies, antibody-drug conjugates (ADCs), fusion proteins, and complex biologics. Our state-of-the-art facilities include GMP suites for mammalian cell culture at scales up to 2,000L.',
  },
  {
    id: 'discovery-capability',
    title: 'Discovery Capability',
    content:
      'Our discovery services include target validation, antibody generation and engineering, hit identification and optimization, lead selection, and comprehensive in vitro and in vivo characterization using cutting-edge platforms.',
  },
  {
    id: 'development-capability',
    title: 'Development Capability',
    content:
      'We provide end-to-end process development including cell line development, upstream and downstream process optimization, analytical method development and validation, formulation development, and comprehensive stability studies.',
  },
  {
    id: 'manufacturing-capability',
    title: 'Manufacturing Capability',
    content:
      'Our GMP manufacturing capabilities include clinical and commercial production, process validation, quality control and release testing, supply chain management, and full regulatory support for IND, BLA, and MAA submissions.',
  },
];

interface CeoLetterContentBlocksProps {
  canEdit: boolean;
  onBlocksChange?: (blocks: ContentBlock[]) => void;
  initialBlocks?: ContentBlock[];
}

export function CeoLetterContentBlocks({
  canEdit,
  onBlocksChange,
  initialBlocks,
}: CeoLetterContentBlocksProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks ?? DEFAULT_BLOCKS);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [editContent, setEditContent] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const updateBlocks = (updated: ContentBlock[]) => {
    setBlocks(updated);
    onBlocksChange?.(updated);
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, hoverIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === hoverIndex) return;
    const updated = [...blocks];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, removed);
    setDragIndex(hoverIndex);
    updateBlocks(updated);
  };

  const handleDrop = () => setDragIndex(null);

  const handleOpenEdit = (block: ContentBlock) => {
    setEditingBlock(block);
    setEditContent(block.content);
  };

  const handleSaveEdit = () => {
    if (!editingBlock) return;
    updateBlocks(blocks.map((b) => (b.id === editingBlock.id ? { ...b, content: editContent } : b)));
    setEditingBlock(null);
  };

  return (
    <div className="mb-6">
      <div className="mb-3 pb-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          Company Capabilities
          {canEdit && (
            <span className="text-xs font-normal text-gray-500">(Drag to reorder)</span>
          )}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            draggable={canEdit}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            className={`border rounded-lg p-3 bg-white hover:border-brand-600 transition-colors ${canEdit ? 'cursor-move' : ''} ${dragIndex === index ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {canEdit && <GripVertical className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
              <span className="text-xs font-semibold text-gray-800 flex-1 truncate">{block.title}</span>
              {canEdit && (
                <button
                  onClick={() => handleOpenEdit(block)}
                  className="p-0.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-700 transition-colors"
                  title="Edit content"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{block.content}</p>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-brand-700" />
                <h3 className="font-semibold text-gray-900">Edit — {editingBlock.title}</h3>
              </div>
              <button onClick={() => setEditingBlock(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <GrammarCheckTextarea
              value={editContent}
              onChange={setEditContent}
              className="min-h-[180px] resize-y text-sm border border-gray-300 rounded-lg w-full"
              placeholder="Enter content..."
            />

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn-secondary" onClick={() => setEditingBlock(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
