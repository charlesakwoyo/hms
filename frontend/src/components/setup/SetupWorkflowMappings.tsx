import React, { useEffect, useState } from 'react';
import { RefreshCw, GitBranch, CheckCircle2, CreditCard, MapPin } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface WorkflowRow {
  id: string;
  sourceEntity: string;
  sourceId: string;
  sourceCode?: string;
  workflowCode: string;
  executionStation?: string;
  billingRequired: boolean;
  collectionRequiresPayment: boolean;
  active: boolean;
  notes?: string;
}

const camel = (row: any): WorkflowRow => ({
  ...row,
  sourceEntity: row.sourceEntity || row.source_entity,
  sourceId: String(row.sourceId ?? row.source_id ?? ''),
  sourceCode: row.sourceCode || row.source_code || '',
  workflowCode: row.workflowCode || row.workflow_code || '',
  executionStation: row.executionStation || row.execution_station || '',
  billingRequired: Number(row.billingRequired ?? row.billing_required) === 1 || row.billingRequired === true,
  collectionRequiresPayment:
    Number(row.collectionRequiresPayment ?? row.collection_requires_payment) === 1 || row.collectionRequiresPayment === true,
  active: Number(row.active) !== 0,
});

export const SetupWorkflowMappings: React.FC = () => {
  const [rows, setRows] = useState<WorkflowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const load = async () => {
    setLoading(true);
    const data = await apiClient.getEntity('setup-workflow-mappings');
    setRows((data || []).map(camel));
    setLoading(false);
    setMessage(`Loaded ${(data || []).length} workflow mappings from MySQL.`);
  };
  useEffect(() => {
    void load();
  }, []);
  const groups = rows.reduce<Record<string, WorkflowRow[]>>((a, r) => {
    (a[r.workflowCode] ||= []).push(r);
    return a;
  }, {});
  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            Workflow Mapping
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Every System Setup catalogue item is mapped to the operational workflow that consumes it.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="px-4 py-2 border rounded-lg text-xs font-bold flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      {message && <div className="text-xs bg-slate-50 border rounded-lg p-3">{message}</div>}
      <div className="grid md:grid-cols-3 gap-3">
        {Object.entries(groups).map(([workflow, items]) => (
          <div key={workflow} className="bg-white border rounded-xl p-4">
            <div className="font-black text-sm text-indigo-800">{workflow}</div>
            <div className="text-[11px] text-slate-500 mt-1">{items.length} catalogue item(s)</div>
            <div className="mt-3 space-y-2">
              {items.slice(0, 6).map((r) => (
                <div key={r.id} className="border rounded-lg p-2.5 text-[11px]">
                  <div className="font-bold text-slate-900">{r.sourceCode || r.sourceId}</div>
                  <div className="text-slate-500">{r.sourceEntity}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {r.executionStation}
                    </span>
                    {r.billingRequired && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        Billing
                      </span>
                    )}
                    {r.collectionRequiresPayment && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Payment gate
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Catalogue</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Workflow</th>
              <th className="p-3 text-left">Execution Station</th>
              <th className="p-3 text-center">Billing</th>
              <th className="p-3 text-center">Payment Gate</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.sourceEntity}</td>
                <td className="p-3 font-mono">{r.sourceCode || r.sourceId}</td>
                <td className="p-3 font-bold text-indigo-700">{r.workflowCode}</td>
                <td className="p-3">{r.executionStation}</td>
                <td className="p-3 text-center">{r.billingRequired ? 'Yes' : 'No'}</td>
                <td className="p-3 text-center">{r.collectionRequiresPayment ? 'Required' : '—'}</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">{r.active ? 'Active' : 'Inactive'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
