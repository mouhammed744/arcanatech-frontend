import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { rfidService } from '@/services/rfid.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { RfidBadge } from '@/components/common/RfidBadge';
import { formatDateTime } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'En retard' },
  { value: 'absent', label: 'Absent' },
  { value: 'excused', label: 'Excuse' },
];

export const RfidEventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['rfid-event', id],
    queryFn: () => rfidService.getEventById(id!),
    enabled: !!id,
  });

  usePageTitle(event ? 'Evenement RFID #'+event.id : 'Detail evenement');

  const overrideMutation = useMutation({
    mutationFn: () => rfidService.overrideStatus(id!, overrideStatus, overrideReason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rfid-event', id] }); setSuccessMsg('Statut mis a jour avec succes.'); setTimeout(()=>setSuccessMsg(''), 3000); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner/></div>;
  if (isError || !event) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-slate-500">Evenement introuvable.</p>
      <button onClick={()=>navigate('/rfid')} className="text-blue-600 hover:underline flex items-center gap-1"><ArrowLeft size={16}/>Retour</button>
    </div>
  );

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.3}} className="max-w-3xl mx-auto p-6 space-y-6">
      <button onClick={()=>navigate('/rfid')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={18}/><span className="text-sm font-medium">Retour aux acces RFID</span>
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Evenement RFID</h1>
            <p className="text-slate-500 text-sm mt-1">{formatDateTime(event.timestamp ?? event.scannedAt)}</p>
          </div>
          <RfidBadge status={event.attendanceStatus} showLabel/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-slate-400 uppercase font-medium mb-1">Etudiant</p><p className="text-sm font-medium text-slate-700">{event.student ? event.student.firstName+' '+event.student.lastName : '-'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase font-medium mb-1">Matricule</p><p className="font-mono text-sm text-slate-700">{event.student?.studentNumber||'-'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase font-medium mb-1">Salle</p><p className="text-sm font-medium text-slate-700">{event.room?.name||'-'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase font-medium mb-1">Cours</p><p className="text-sm font-medium text-slate-700">{event.course?.name||'-'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase font-medium mb-1">Type d'acces</p><p className="text-sm font-medium text-slate-700">{event.accessType||'rfid'}</p></div>
          <div><p className="text-xs text-slate-400 uppercase font-medium mb-1">Retard</p><p className="text-sm font-medium text-slate-700">{event.minutesLate > 0 ? event.minutesLate+' minutes' : "A l'heure"}</p></div>
          {event.cardId && <div><p className="text-xs text-slate-400 uppercase font-medium mb-1">Carte RFID</p><p className="font-mono text-sm text-slate-700">{event.cardId}</p></div>}
          {event.reader?.ipAddress && <div><p className="text-xs text-slate-400 uppercase font-medium mb-1">Lecteur (IP)</p><p className="font-mono text-sm text-slate-700">{event.reader.ipAddress}</p></div>}
        </div>
        {event.notes && <div className="mt-4"><p className="text-xs text-slate-400 uppercase font-medium mb-1">Notes</p><p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">{event.notes}</p></div>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-500"/>Override du statut</h2>
        {successMsg && <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm">{successMsg}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau statut</label>
            <select value={overrideStatus} onChange={e=>setOverrideStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selectionnez un statut</option>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Raison</label>
            <textarea value={overrideReason} onChange={e=>setOverrideReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Expliquez la raison de ce changement..."/>
          </div>
          <button onClick={()=>overrideMutation.mutate()} disabled={!overrideStatus || !overrideReason || overrideMutation.isPending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">
            {overrideMutation.isPending ? <LoadingSpinner size="sm"/> : <Save size={16}/>}
            Enregistrer le changement
          </button>
        </div>
      </div>
    </motion.div>
  );
};
export default RfidEventDetailPage;
