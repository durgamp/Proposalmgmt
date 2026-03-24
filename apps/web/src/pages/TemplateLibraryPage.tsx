import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, ArrowRight, Loader2, AlertCircle, CheckCircle2, FileText, X,
  ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { templatesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─── BU / Template definitions ───────────────────────────────────────────────

const BU_GROUPS = [
  {
    bu: 'Biologics US',
    color: 'bg-brand-800',
    lightBg: 'bg-brand-50',
    border: 'border-brand-200',
    text: 'text-brand-800',
    templates: [
      { name: 'Transient Expression',       desc: 'Rapid protein production via transient transfection (HEK293/CHO). Early-stage feasibility & characterisation.' },
      { name: 'Hybridoma',                  desc: 'mAb generation via hybridoma technology. Covers immunisation, fusion, screening, and cloning.' },
      { name: 'Cell Line Development (CLD)',desc: 'Stable CHO CLD from transfection through MCB — single-cell cloning, expansion & stability studies.' },
      { name: 'Analytics',                  desc: 'SEC-HPLC, cIEF, glycan profiling, bioassays, and ICH Q2(R2)-aligned method development.' },
      { name: 'Biosimilar mAbs',            desc: 'End-to-end biosimilar mAb program — CLD, comparability studies & regulatory submission support.' },
    ],
  },
  {
    bu: 'Biologics India',
    color: 'bg-indigo-700',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-800',
    templates: [
      { name: 'NBE Monoclonal Antibody',                    desc: 'NBE mAb program covering IND-enabling studies, upstream/downstream development, and GMP manufacturing.' },
      { name: 'NBE Non-Antibody',                           desc: 'NBE non-antibody biologics (cytokines, enzymes, fusion proteins) — expression, purification & analytics.' },
      { name: 'NBE BiSpecific Antibody',                    desc: 'Bispecific antibody development covering molecule engineering, CLD, and process development.' },
      { name: 'Bio Similar Entity - Mono Clonal Antibody',  desc: 'Biosimilar mAb with full analytical comparability package aligned to EMA/FDA guidelines.' },
      { name: 'Bio Similar Entity - Non Antibody',          desc: 'Biosimilar non-antibody entity (peptides, cytokines, hormones) with regulatory comparability studies.' },
      { name: 'Technology Transfer',                        desc: 'Process characterisation, analytical transfer, validation, and regulatory support package.' },
    ],
  },
];

const SECTION_LABELS = ['CEO Letter', 'Executive Summary', 'Scope of Work', 'Project Details', 'Terms & Conditions'];

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  templateName: string;
  bu: string;
  existingId: string | null;
  onClose: () => void;
}

function UploadModal({ templateName, bu, existingId, onClose }: UploadModalProps) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<Array<{
    sectionKey: string; title: string; sortOrder: number; defaultContent: object;
  }> | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (sections: object[]) =>
      existingId
        ? templatesApi.update(existingId, { sections })
        : templatesApi.create({
            name: templateName,
            businessUnit: bu,
            category: templateName,
            description: BU_GROUPS.flatMap((g) => g.templates)
              .find((t) => t.name === templateName)?.desc ?? '',
            sections,
            createdBy: user!.email,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      toast.success(`"${templateName}" template saved`);
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || 'Save failed'),
  });

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setParsed(null);
    setParsing(true);
    try {
      const res = await templatesApi.uploadAndParse(f);
      setParsed(res.detectedSections);
      const detected = res.detectedSections.filter((s) => {
        const c = s.defaultContent as any;
        return c?.content?.some((p: any) => p?.content?.some((t: any) => t?.text?.trim()));
      }).length;
      toast.success(`Detected content in ${detected} of ${res.detectedSections.length} sections`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const sectionPreview = (content: object): string => {
    try {
      const doc = content as any;
      return doc.content
        ?.flatMap((p: any) => p.content?.map((t: any) => t.text ?? '') ?? [])
        .filter(Boolean)
        .join(' ')
        .slice(0, 220) || '';
    } catch { return ''; }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">{existingId ? 'Update' : 'Upload'} Template</h2>
            <p className="text-xs text-gray-500 mt-0.5">{templateName} · {bu}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Drop zone */}
          <div
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              dragging ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50',
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".docx,.pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
            {parsing ? (
              <div className="flex flex-col items-center gap-2 text-brand-700">
                <Loader2 size={32} className="animate-spin" />
                <p className="text-sm font-medium">Parsing document — detecting sections...</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-2 text-gray-700">
                <FileText size={32} className="text-brand-600" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-400">Click to replace file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload size={32} />
                <p className="text-sm font-medium">Drag & drop or click to select</p>
                <p className="text-xs">Word (.docx) or PDF · Max 20 MB</p>
              </div>
            )}
          </div>

          {/* Detected sections */}
          {parsed && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-green-500" />
                Auto-detected sections
              </p>
              <div className="space-y-1.5">
                {parsed.map((s) => {
                  const preview = sectionPreview(s.defaultContent);
                  const hasContent = preview.trim().length > 0;
                  const isOpen = expanded === s.sectionKey;
                  return (
                    <div key={s.sectionKey} className={clsx('border rounded-lg overflow-hidden', hasContent ? 'border-green-200' : 'border-gray-200')}>
                      <button
                        className={clsx('w-full flex items-center justify-between px-3 py-2 text-xs font-medium',
                          hasContent ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-400')}
                        onClick={() => setExpanded(isOpen ? null : s.sectionKey)}
                      >
                        <span className="flex items-center gap-1.5">
                          {hasContent ? <CheckCircle2 size={11} className="text-green-500" /> : <AlertCircle size={11} />}
                          {s.title}
                        </span>
                        {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                      {isOpen && hasContent && (
                        <div className="px-3 py-2 text-xs text-gray-600 bg-white border-t border-gray-100 leading-relaxed">
                          {preview}{preview.length >= 220 && '...'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button
            className="btn-primary text-sm"
            disabled={!parsed || saveMutation.isPending}
            onClick={() => parsed && saveMutation.mutate(parsed)}
          >
            {saveMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={14} /> {existingId ? 'Update Template' : 'Save Template'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
  name: string;
  desc: string;
  dbTemplate: any | null;
  buGroup: typeof BU_GROUPS[0];
  isManager: boolean;
  onUpload: () => void;
  onUse: () => void;
}

function TemplateCard({ name, desc, dbTemplate, buGroup, isManager, onUpload, onUse }: TemplateCardProps) {
  const hasUpload = !!dbTemplate;
  return (
    <div className={clsx('bg-white rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col', buGroup.border)}>
      <div className={clsx('h-1 rounded-t-xl', buGroup.color)} />
      <div className="p-4 flex-1 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{name}</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
        </div>

        {/* Upload status badge */}
        {hasUpload ? (
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
            <CheckCircle2 size={11} />
            Template file uploaded
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <AlertCircle size={11} />
            No file uploaded yet
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-gray-100 p-3 space-y-2">
        {hasUpload && (
          <button
            className="w-full btn-primary py-1.5 text-xs justify-center"
            onClick={onUse}
          >
            <ArrowRight size={12} /> Use Template
          </button>
        )}
        {isManager && (
          <button
            className={clsx(
              'w-full py-1.5 text-xs rounded border font-medium flex items-center justify-center gap-1.5 transition-colors',
              hasUpload
                ? 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
                : clsx('border-2', buGroup.border, buGroup.text, buGroup.lightBg, 'hover:opacity-90 font-semibold'),
            )}
            onClick={onUpload}
          >
            <Upload size={11} />
            {hasUpload ? 'Update File' : 'Upload Template'}
          </button>
        )}
        {!hasUpload && !isManager && (
          <p className="text-center text-xs text-gray-400">Contact your Proposal Manager to upload this template.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TemplateLibraryPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === 'proposal-manager';

  const [modal, setModal] = useState<{ name: string; bu: string } | null>(null);

  const { data: templates, isLoading, isError } = useQuery({
    queryKey: ['templates'],
    queryFn: templatesApi.list,
  });

  // Quick lookup: template name → db record
  const byName = (templates ?? []).reduce<Record<string, any>>((acc, t) => {
    acc[t.name] = t;
    return acc;
  }, {});

  const modalDbTemplate = modal ? (byName[modal.name] ?? null) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading templates...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-red-500">
        <AlertCircle className="w-5 h-5" /> Failed to load templates. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Template Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and upload proposal templates by Business Unit.
            {isManager && ' Upload Word or PDF files to auto-populate section content.'}
          </p>
        </div>
        {isManager && (
          <button className="btn-primary text-sm" onClick={() => navigate('/proposals/new')}>
            <Plus size={15} /> New Proposal
          </button>
        )}
      </div>

      {/* BU Sections */}
      {BU_GROUPS.map((group) => (
        <section key={group.bu}>
          {/* Section heading */}
          <div className="flex items-center gap-3 mb-5">
            <div className={clsx('w-1 h-7 rounded-full', group.color)} />
            <div>
              <h2 className="text-lg font-bold text-gray-900">{group.bu}</h2>
              <p className="text-xs text-gray-500">{group.templates.length} templates</p>
            </div>
            {/* Upload progress indicator */}
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
              <span className="font-medium text-gray-700">
                {group.templates.filter((t) => byName[t.name]).length}
              </span>
              / {group.templates.length} uploaded
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all', group.color)}
                  style={{ width: `${(group.templates.filter((t) => byName[t.name]).length / group.templates.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {group.templates.map((tmpl) => (
              <TemplateCard
                key={tmpl.name}
                name={tmpl.name}
                desc={tmpl.desc}
                dbTemplate={byName[tmpl.name] ?? null}
                buGroup={group}
                isManager={isManager}
                onUpload={() => setModal({ name: tmpl.name, bu: group.bu })}
                onUse={() => {
                  const t = byName[tmpl.name];
                  if (t) navigate(`/proposals/new?templateId=${t.id}&templateName=${encodeURIComponent(tmpl.name)}&bu=${encodeURIComponent(group.bu)}`);
                }}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Upload instructions for non-managers */}
      {!isManager && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-sm text-blue-800">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
          <span>Only Proposal Managers can upload or update template files. Contact your PM to upload a template for a business unit.</span>
        </div>
      )}

      {/* Upload Modal */}
      {modal && (
        <UploadModal
          templateName={modal.name}
          bu={modal.bu}
          existingId={modalDbTemplate?.id ?? null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
