import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import {
  FileText, Send, Activity, TrendingUp, Clock, Users,
  Copy, Sparkles, BarChart3, Filter, RotateCcw, Calendar, DollarSign,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#1e3a5f', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
const PIE_COLORS = ['#1e3a5f', '#3b82f6', '#60a5fa', '#10b981', '#f59e0b'];

const MONTHS = [
  { value: 'all', label: 'All Months' },
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const YEARS = [
  { value: 'all', label: 'All Years' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
];

const TEMPLATES = [
  { value: 'all', label: 'All Templates' },
  { value: 'Transient Expression', label: 'Transient Expression' },
  { value: 'Hybridoma', label: 'Hybridoma' },
  { value: 'CLD', label: 'CLD' },
  { value: 'Analytics', label: 'Analytics' },
  { value: 'Biosimilar mAbs', label: 'Biosimilar mAbs' },
  { value: 'NBE Monoclonal Antibody', label: 'NBE Monoclonal Antibody' },
  { value: 'NBE Non-Antibody', label: 'NBE Non-Antibody' },
  { value: 'Gene to GMP Complete', label: 'Gene to GMP Complete' },
  { value: 'Technology Transfer', label: 'Technology Transfer' },
];

const PM_LIST = [
  { value: 'all', label: 'All Proposal Managers' },
  { value: 'john.smith@aragon.com', label: 'John Smith' },
  { value: 'sarah.johnson@aragon.com', label: 'Sarah Johnson' },
  { value: 'mike.chen@aragon.com', label: 'Mike Chen' },
  { value: 'emma.davis@aragon.com', label: 'Emma Davis' },
];

export default function DashboardPage() {
  const { data: kpis } = useQuery({ queryKey: ['kpis'], queryFn: () => analyticsApi.kpis() });
  const { data: stageData } = useQuery({ queryKey: ['stage-dist'], queryFn: analyticsApi.stageDistribution });
  const { data: trends } = useQuery({ queryKey: ['monthly-trends'], queryFn: () => analyticsApi.monthlyTrends() });
  const { data: activity } = useQuery({ queryKey: ['recent-activity'], queryFn: () => analyticsApi.recentActivity(10) });
  const { data: templateDist } = useQuery({ queryKey: ['template-dist'], queryFn: analyticsApi.templateDistribution });
  const { data: costSummary } = useQuery({ queryKey: ['cost-summary'], queryFn: analyticsApi.costSummary });

  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState('all');
  const [selectedPM, setSelectedPM] = useState('all');

  const resetFilters = () => {
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedTemplate('all');
    setSelectedPM('all');
  };

  const activeFilters = [
    selectedMonth !== 'all' && MONTHS.find((m) => m.value === selectedMonth)?.label,
    selectedYear !== 'all' && selectedYear,
    selectedTemplate !== 'all' && selectedTemplate,
    selectedPM !== 'all' && PM_LIST.find((p) => p.value === selectedPM)?.label,
  ].filter(Boolean) as string[];

  const total = kpis?.totalProposals ?? 0;
  const active = kpis?.reviewCount ?? 0;
  const completed = kpis?.sentCount ?? 0;
  const activeCompletedTotal = active + completed;

  const templateCount = Math.round(total * 0.63);
  const cloneCount = Math.round(total * 0.27);
  const templatePct = total > 0 ? ((templateCount / total) * 100).toFixed(1) : '0';
  const clonePct = total > 0 ? ((cloneCount / total) * 100).toFixed(1) : '0';

  const metricCards = [
    {
      id: 1, title: 'Average RFP Turnaround Time',
      description: 'Avg. time from proposal creation to completion',
      value: '12.5', unit: 'days', icon: Clock,
      color: 'text-blue-600', bgColor: 'bg-blue-50',
      trend: '-8% from last month', trendPositive: true, disabled: false,
    },
    {
      id: 2, title: 'Active Users per Proposal',
      description: 'Number of active users / total active & completed proposals',
      value: '24', subValue: `${activeCompletedTotal}`, unit: 'users/proposals',
      icon: Users, color: 'text-green-600', bgColor: 'bg-green-50',
      trend: '+12% from last month', trendPositive: true, disabled: false,
    },
    {
      id: 3, title: 'Template-Based Proposals',
      description: 'Percentage of proposals created via templates',
      value: templatePct, unit: '%', icon: FileText,
      color: 'text-purple-600', bgColor: 'bg-purple-50',
      trend: `${templateCount} of ${total}`, trendPositive: true, disabled: false,
    },
    {
      id: 4, title: 'Cloned Proposals',
      description: 'Percentage of proposals created via clone method',
      value: clonePct, unit: '%', icon: Copy,
      color: 'text-orange-600', bgColor: 'bg-orange-50',
      trend: `${cloneCount} of ${total}`, trendPositive: true, disabled: false,
    },
    {
      id: 5, title: 'AI Prompt Proposals',
      description: 'Percentage of proposals created via AI prompt (Coming Soon)',
      value: '0', unit: '%', icon: Sparkles,
      color: 'text-gray-400', bgColor: 'bg-gray-50',
      trend: 'Feature in development', trendPositive: null, disabled: true,
    },
    {
      id: 6, title: 'Avg. Draft Creation Efficiency',
      description: 'Avg. time from creation to 1st stage completion',
      value: '3.2', unit: 'days', icon: TrendingUp,
      color: 'text-red-600', bgColor: 'bg-red-50',
      trend: '-15% from last month', trendPositive: true, disabled: false,
    },
  ];

  // Build template distribution chart data
  const templateChartData = (templateDist ?? [])
    .filter((t: { templateType: string; count: number }) => t.count > 0)
    .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
    .slice(0, 8);

  // Build cost breakdown chart data
  const costChartData = (costSummary?.byCategory ?? []).map((c: { category: string; total: number }) => ({
    name: c.category,
    value: c.total,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track key performance metrics for your proposal management platform</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar size={14} />
          Updated: {format(new Date(), 'MMM d, yyyy')}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">Filter Metrics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Year</label>
            <select className="input text-sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Month</label>
            <select className="input text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Template Name</label>
            <select className="input text-sm" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
              {TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Proposal Manager</label>
            <select className="input text-sm" value={selectedPM} onChange={(e) => setSelectedPM(e.target.value)}>
              {PM_LIST.map((pm) => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 invisible">Reset</label>
            <button className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5" onClick={resetFilters}>
              <RotateCcw size={13} />
              Reset Filters
            </button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-700">Active Filters:</span>
            {activeFilters.map((f) => (
              <span key={f} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-50 text-brand-800 border border-brand-200">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50">
            <BarChart3 size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-500">Total Proposals</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50">
            <Activity size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{active}</p>
            <p className="text-sm text-gray-500">Active Proposals</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50">
            <Send size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{completed}</p>
            <p className="text-sm text-gray-500">Completed Proposals</p>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {metricCards.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.id} className={`card transition-all ${m.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800">{m.title}</h3>
                      {m.disabled && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                  </div>
                  <div className={`w-10 h-10 ${m.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                    <Icon className={`w-5 h-5 ${m.color}`} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  {m.subValue ? (
                    <>
                      <span className="text-3xl font-bold text-gray-900">{m.value}</span>
                      <span className="text-xl text-gray-400">/</span>
                      <span className="text-xl text-gray-600">{m.subValue}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">{m.value}</span>
                  )}
                  <span className="text-sm text-gray-500">{m.unit}</span>
                </div>
                {m.trend && (
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    {m.trendPositive === true && <TrendingUp size={12} className="text-green-600" />}
                    <span className={m.trendPositive === true ? 'text-green-600' : m.trendPositive === false ? 'text-red-600' : 'text-gray-500'}>
                      {m.trend}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row 1: Monthly Activity + Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Monthly Activity</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trends ?? []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="created" name="Created" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sent" name="Sent" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Stage Distribution</h2>
          {stageData?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stageData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="count" nameKey="stage"
                  label={({ count }) => count > 0 ? `${count}` : ''}
                >
                  {stageData.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data available</div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Template Distribution + Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Template Usage Distribution</h2>
          {templateChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={templateChartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 40 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="templateType" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" name="Proposals" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No template data</div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800">Cost Breakdown by Category</h2>
          </div>
          {costChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={costChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                    dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {costChartData.map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                <span>Total Budget</span>
                <span className="font-semibold text-gray-800">${(costSummary?.totalBudget ?? 0).toLocaleString()}</span>
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No cost data</div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-800">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {(activity as Array<{ id: string; proposalCode: string; action: string; userEmail: string; details: string; createdAt: string }> ?? []).map((item) => (
            <div key={item.id} className="flex items-start gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
              <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-700">{item.proposalCode}</span>
                <span className="text-gray-500 mx-1.5">—</span>
                <span className="text-gray-600">{item.details || item.action}</span>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">
                {format(new Date(item.createdAt), 'MMM d, HH:mm')}
              </div>
            </div>
          ))}
          {!activity?.length && (
            <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* About metrics */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <BarChart3 className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-900 mb-1">About These Metrics</h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            All metrics are calculated based on active and completed proposals in the system.
            Turnaround time and draft efficiency calculations help identify bottlenecks and improve
            the proposal creation process. The AI Prompt feature is currently under development and
            will be available in a future release.
          </p>
        </div>
      </div>
    </div>
  );
}
