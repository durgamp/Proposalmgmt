import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Plus, Save, Trash2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { format, differenceInDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import type { ProjectStage, ProjectActivity } from '@biopropose/shared-types';

interface Props {
  proposalId: string;
}

const COLORS = ['#1e3a5f', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function GanttTimeline({ proposalId }: Props) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['timeline', proposalId],
    queryFn: () => costsApi.getTimeline(proposalId),
  });

  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    setStages(data.stages);
    setActivities(data.activities);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      costsApi.saveTimeline(proposalId, {
        stages: stages.map((s, i) => ({
          ...s,
          sortOrder: i,
          durationDays: differenceInDays(parseISO(s.endDate), parseISO(s.startDate)),
        })),
        activities: activities.map((a, i) => ({
          ...a,
          sortOrder: i,
          durationDays: differenceInDays(parseISO(a.endDate), parseISO(a.startDate)),
        })),
        updatedBy: user!.email,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeline', proposalId] });
      toast.success('Timeline saved');
    },
    onError: () => toast.error('Failed to save timeline'),
  });

  const addStage = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const newStage: ProjectStage = {
      id: uuid(),
      proposalId,
      name: 'New Stage',
      startDate: today,
      endDate: today,
      durationDays: 0,
      sortOrder: stages.length,
      activities: [],
      createdBy: user!.email,
      updatedBy: user!.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setStages((s) => [...s, newStage]);
  };

  const addActivity = (stageId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const newActivity: ProjectActivity = {
      id: uuid(),
      proposalId,
      stageId,
      name: 'New Activity',
      startDate: today,
      endDate: today,
      durationDays: 0,
      progress: 0,
      assignee: '',
      phase: '',
      color: COLORS[activities.length % COLORS.length],
      dependencies: [],
      sortOrder: activities.filter((a) => a.stageId === stageId).length,
      createdBy: user!.email,
      updatedBy: user!.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActivities((a) => [...a, newActivity]);
  };

  const updateStage = (id: string, field: keyof ProjectStage, value: unknown) => {
    setStages((s) => s.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateActivity = (id: string, field: keyof ProjectActivity, value: unknown) => {
    setActivities((a) => a.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  if (isLoading) return <div className="card text-center text-gray-400 py-8">Loading timeline...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Project Timeline</h3>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs py-1.5" onClick={addStage}>
            <Plus size={14} />
            Add Stage
          </button>
          <button
            className="btn-primary text-xs py-1.5"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save size={14} />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {stages.length === 0 && (
        <div className="card text-center text-gray-400 py-8 text-sm">
          No stages yet. Click "Add Stage" to build your project timeline.
        </div>
      )}

      {stages.map((stage, sIdx) => {
        const stageActivities = activities.filter((a) => a.stageId === stage.id);
        return (
          <div key={stage.id} className="card p-0 overflow-hidden">
            {/* Stage header */}
            <div
              className="flex items-center gap-3 px-4 py-3 text-white text-sm"
              style={{ backgroundColor: COLORS[sIdx % COLORS.length] }}
            >
              <input
                className="bg-transparent border-b border-white/40 text-white placeholder-white/60 text-sm font-semibold flex-1 outline-none"
                value={stage.name}
                onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
              />
              <div className="flex items-center gap-2 text-xs text-white/80">
                <input
                  type="date"
                  className="bg-transparent border border-white/30 rounded px-2 py-0.5 text-white text-xs"
                  value={stage.startDate}
                  onChange={(e) => updateStage(stage.id, 'startDate', e.target.value)}
                />
                <span>→</span>
                <input
                  type="date"
                  className="bg-transparent border border-white/30 rounded px-2 py-0.5 text-white text-xs"
                  value={stage.endDate}
                  onChange={(e) => updateStage(stage.id, 'endDate', e.target.value)}
                />
              </div>
              <button
                className="text-white/60 hover:text-white"
                onClick={() => setStages((s) => s.filter((st) => st.id !== stage.id))}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Activities */}
            <div className="divide-y divide-gray-100">
              {stageActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 px-4 py-2 text-xs">
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: activity.color ?? '#3b82f6' }}
                  />
                  <input
                    className="input text-xs py-1 flex-1"
                    value={activity.name}
                    onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                    placeholder="Activity name"
                  />
                  <input
                    type="date"
                    className="input text-xs py-1 w-32"
                    value={activity.startDate}
                    onChange={(e) => updateActivity(activity.id, 'startDate', e.target.value)}
                  />
                  <input
                    type="date"
                    className="input text-xs py-1 w-32"
                    value={activity.endDate}
                    onChange={(e) => updateActivity(activity.id, 'endDate', e.target.value)}
                  />
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      className="flex-1"
                      value={activity.progress ?? 0}
                      onChange={(e) => updateActivity(activity.id, 'progress', Number(e.target.value))}
                    />
                    <span className="w-8 text-right text-gray-500">{activity.progress ?? 0}%</span>
                  </div>
                  <input
                    className="input text-xs py-1 w-28"
                    value={activity.assignee ?? ''}
                    onChange={(e) => updateActivity(activity.id, 'assignee', e.target.value)}
                    placeholder="Assignee"
                  />
                  <button
                    className="text-gray-300 hover:text-red-500"
                    onClick={() => setActivities((a) => a.filter((act) => act.id !== activity.id))}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="px-4 py-2">
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  onClick={() => addActivity(stage.id)}
                >
                  <Plus size={12} />
                  Add activity
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
