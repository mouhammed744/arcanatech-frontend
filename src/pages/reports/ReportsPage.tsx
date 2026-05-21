import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { reportsService } from '@/services/reports.service';
import type { ReportType, ReportFormat } from '@/services/reports.service';
import { downloadBlob } from '@/lib/utils';

export const ReportsPage = () => {
  usePageTitle('Rapports');

  const [reportType, setReportType] = useState<ReportType>('global');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetId, setTargetId] = useState('');

  const generateMutation = useMutation({
    mutationFn: () =>
      reportsService.generate({
        type: reportType,
        format,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        targetId: targetId || undefined,
      }),
    onSuccess: (blob) => {
      const ext = format === 'pdf' ? 'pdf' : 'csv';
      const filename = `rapport_${reportType}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      downloadBlob(blob, filename);
    },
  });

  const typeOptions = [
    { value: 'individual', label: 'Individuel', desc: 'Rapport pour un etudiant specifique', icon: '👤' },
    { value: 'class', label: 'Classe / Formation', desc: 'Rapport par formation ou groupe', icon: '👥' },
    { value: 'global', label: 'Global', desc: 'Rapport complet de l\'universite', icon: '🏛️' },
  ];

  return (
    <div>
      <PageHeader
        title="Rapports"
        breadcrumbs={[{ label: 'Tableau de bord', to: '/dashboard' }, { label: 'Rapports' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Type de rapport */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Type de rapport</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setReportType(opt.value as ReportType)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    reportType === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <span className="text-2xl block mb-2">{opt.icon}</span>
                  <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Periode */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Periode</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">Date debut</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">Date fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Cible (si individuel) */}
          {reportType === 'individual' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Etudiant cible</h3>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="Matricule ou ID de l'etudiant..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Format */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Format d'export</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat('pdf')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  format === 'pdf'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-100 text-slate-600 hover:border-slate-200'
                }`}
              >
                <FileText size={18} /> PDF
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  format === 'csv'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-100 text-slate-600 hover:border-slate-200'
                }`}
              >
                <FileSpreadsheet size={18} /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Resume + Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Resume</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium text-slate-800 capitalize">{reportType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Format</span>
                <span className="font-medium text-slate-800 uppercase">{format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Periode</span>
                <span className="font-medium text-slate-800">
                  {startDate && endDate ? `${startDate} - ${endDate}` : 'Tout'}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-100 mt-4 pt-4">
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Generation...</>
                ) : (
                  <><Download size={16} /> Generer le rapport</>
                )}
              </button>
            </div>
            {generateMutation.isError && (
              <p className="text-xs text-red-500 mt-3 text-center">Erreur lors de la generation.</p>
            )}
            {generateMutation.isSuccess && (
              <p className="text-xs text-green-600 mt-3 text-center">Rapport telecharge avec succes !</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
