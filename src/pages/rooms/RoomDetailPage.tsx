import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Building, Hash, Users, Wifi, WifiOff, Wrench, Server, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { roomService } from '@/services/room.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'online') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><Wifi size={12} /> En ligne</span>;
  if (status === 'maintenance') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Wrench size={12} /> Maintenance</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><WifiOff size={12} /> Hors ligne</span>;
};

export const RoomDetailPage = () => {
  usePageTitle('Detail salle');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: room, isLoading, error } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner centered />;
  if (error || !room) return (
    <div className="p-6">
      <p className="text-red-500">Erreur de chargement.</p>
      <button onClick={() => navigate('/rooms')} className="mt-4 text-blue-600 hover:underline">Retour</button>
    </div>
  );

  const reader = (room as any).rfidReader ?? {};

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={room.name}
        subtitle={room.code}
        actions={
          <div className="flex gap-3">
            <button onClick={() => navigate('/rooms')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><ArrowLeft size={16} /> Retour</button>
            <Link to={'/rooms/' + id + '/edit'} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit size={16} /> Editer</Link>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Building size={18} className="text-gray-400" /><div><p className="text-sm text-gray-500">Batiment / Etage</p><p className="font-medium text-gray-900">{room.building ?? 'N/A'} - Etage {(room as any).floor ?? 0}</p></div></div>
            <div className="flex items-center gap-3"><Hash size={18} className="text-gray-400" /><div><p className="text-sm text-gray-500">Code</p><p className="font-medium text-gray-900 font-mono">{room.code}</p></div></div>
            <div className="flex items-center gap-3"><Users size={18} className="text-gray-400" /><div><p className="text-sm text-gray-500">Capacite</p><p className="font-medium text-gray-900">{room.capacity} personnes</p></div></div>
            <div><p className="text-sm text-gray-500">Type</p><p className="font-medium text-gray-900 capitalize">{room.type}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lecteur RFID</h2>
          {reader.id ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3"><Server size={18} className="text-gray-400" /><div><p className="text-sm text-gray-500">Adresse IP</p><p className="font-medium text-gray-900 font-mono">{reader.ipAddress ?? 'N/A'}</p></div></div>
              <div><p className="text-sm text-gray-500">Firmware</p><p className="font-medium text-gray-900">{reader.firmware ?? 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Statut</p><StatusBadge status={reader.status ?? 'offline'} /></div>
              <div className="flex items-center gap-3"><Clock size={18} className="text-gray-400" /><div><p className="text-sm text-gray-500">Dernier ping</p><p className="font-medium text-gray-900">{reader.lastPing ? format(parseISO(reader.lastPing), 'dd/MM/yyyy HH:mm') : 'Jamais'}</p></div></div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun lecteur RFID configure.</p>
          )}
        </div>
      </div>
    </div>
  );
};
