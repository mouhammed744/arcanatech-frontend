import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2, Wifi, WifiOff, Wrench } from 'lucide-react';
import { roomService } from '@/services/room.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const RfidBadge = ({ status }: { status: string }) => {
  if (status === 'online') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><Wifi size={12} /> En ligne</span>;
  if (status === 'maintenance') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Wrench size={12} /> Maintenance</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><WifiOff size={12} /> Hors ligne</span>;
};

export const RoomsListPage = () => {
  usePageTitle('Salles');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rooms'] }); setDeleteId(null); },
  });

  if (isLoading) return <LoadingSpinner centered />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Salles"
        subtitle={(rooms as any[]).length + ' salle(s)'}
        actions={
          <button onClick={() => navigate('/rooms/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Nouvelle salle
          </button>
        }
      />
      {(rooms as any[]).length === 0 ? (
        <EmptyState title="Aucune salle" description="Ajoutez une salle" action={{ label: 'Ajouter', onClick: () => navigate('/rooms/new') }} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Nom','Code','Batiment','Capacite','Type','Lecteur RFID','Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(rooms as any[]).map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{room.name}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{room.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{room.building ?? 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{room.capacity}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">{room.type}</td>
                    <td className="px-6 py-4"><RfidBadge status={room.rfidReader?.status ?? room.readerStatus ?? 'offline'} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate('/rooms/' + room.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                        <button onClick={() => navigate('/rooms/' + room.id + '/edit')} className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"><Edit size={16} /></button>
                        <button onClick={() => setDeleteId(room.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmDialog isOpen={!!deleteId} title="Supprimer la salle" message="Action irreversible." onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} isLoading={deleteMutation.isPending} />
    </div>
  );
};
