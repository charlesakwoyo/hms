import React, { useEffect, useState } from 'react';
import { Save, Link2 } from 'lucide-react';
import { CancerTreatmentProtocol } from '../../types';
import { apiClient } from '../../services/apiClient';

const mapProtocol = (r: any): CancerTreatmentProtocol => ({
  id: r.id,
  code: r.code,
  name: r.name,
  treatmentType: r.treatment_type,
  regimen: r.regimen,
  intent: r.intent,
  route: r.route,
  cycleDays: Number(r.cycle_days || 21),
  defaultCycles: Number(r.default_cycles || 1),
  department: r.department,
  preauthRequired: Boolean(Number(r.preauth_required)),
  shaBenefitCode: r.sha_benefit_code,
  description: r.description,
  status: r.status,
});
const mapItem = (r: any) => ({
  id: r.id,
  code: r.code,
  name: r.name || r.brand_name || r.test_name || r.procedure_name,
  cashPrice: Number(r.cash_price || 0),
  subCategoryPrices: r.sub_category_prices_json ? JSON.parse(r.sub_category_prices_json) : {},
});
export const CancerSetupRegisters: React.FC = () => {
  const [protocols, setProtocols] = useState<CancerTreatmentProtocol[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [source, setSource] = useState('setup-pharmacy-drugs');
  const [linkCatalogue, setLinkCatalogue] = useState(true);
  const [form, setForm] = useState<any>({
    id: '',
    code: '',
    name: '',
    treatmentType: 'Chemotherapy',
    regimen: '',
    intent: 'Curative',
    route: 'IV',
    cycleDays: 21,
    defaultCycles: 6,
    department: 'Oncology',
    preauthRequired: true,
    shaBenefitCode: 'SHA-ONC',
    description: '',
    status: 'Active',
  });
  const [svc, setSvc] = useState<any>({
    id: '',
    code: '',
    name: '',
    serviceType: 'Pharmacy',
    sourceEntity: 'setup-pharmacy-drugs',
    sourceId: '',
    cashPrice: 0,
    shaSubcategoryCode: '',
    shaPrice: 0,
    billingCategory: 'Pharmacy',
    preauthRequired: true,
    status: 'Active',
  });
  const [msg, setMsg] = useState('');
  const load = async () => {
    const [p, s, sc] = await Promise.all([
      apiClient.getEntity('setup-cancer-protocols'),
      apiClient.getEntity('setup-cancer-services'),
      apiClient.getEntity('setup-patient-subcategories'),
    ]);
    setProtocols(p.map(mapProtocol));
    setServices(s);
    setSubs(sc);
  };
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    setSvc((x: any) => ({ ...x, sourceEntity: source, sourceId: '' }));
    if (linkCatalogue) {
      void (async () => {
        const rows = await apiClient.getEntity(source);
        setCatalogue(rows.map(mapItem));
      })();
    }
  }, [source, linkCatalogue]);
  const selected = linkCatalogue ? catalogue.find((x) => String(x.id) === String(svc.sourceId)) : undefined;
  useEffect(() => {
    if (selected) {
      const prices = selected.subCategoryPrices || {};
      const sha =
        svc.shaSubcategoryCode ||
        subs.find((x: any) =>
          String(x.sub_category_code || '')
            .toUpperCase()
            .includes('SHA'),
        )?.sub_category_code ||
        '';
      setSvc((x: any) => ({
        ...x,
        code: selected.code || x.code,
        name: selected.name || x.name,
        cashPrice: selected.cashPrice,
        shaPrice: Number(prices[sha] || 0),
        shaSubcategoryCode: sha,
      }));
    }
  }, [svc.sourceId, catalogue, subs]);
  const save = async () => {
    const row: CancerTreatmentProtocol = {
      ...form,
      id: form.id || `ONC-SET-${Date.now()}`,
      cycleDays: Number(form.cycleDays),
      defaultCycles: Number(form.defaultCycles),
      preauthRequired: Boolean(form.preauthRequired),
    };
    const r = await apiClient.persistEntity('setup-cancer-protocols', row);
    if (r.success) {
      setProtocols([row, ...protocols.filter((x) => x.id !== row.id)]);
      setForm({ ...form, id: '' });
      setMsg('Cancer protocol saved.');
    } else setMsg(r.error || 'Save failed');
    setTimeout(() => setMsg(''), 3000);
  };
  const saveService = async () => {
    if (!svc.code?.trim() || !svc.name?.trim()) {
      setMsg('Enter the cancer service code and service name.');
      return;
    }
    if (linkCatalogue && !svc.sourceId) {
      setMsg('Select a System Setup catalogue item or turn off catalogue linking to create a standalone cancer service.');
      return;
    }
    const row = {
      ...svc,
      id: svc.id || `ONC-SVC-${Date.now()}`,
      sourceEntity: linkCatalogue ? source : null,
      sourceId: linkCatalogue ? String(svc.sourceId) : null,
      cashPrice: Number(svc.cashPrice || 0),
      shaPrice: Number(svc.shaPrice || 0),
      preauthRequired: Boolean(svc.preauthRequired),
    };
    const r = await apiClient.persistEntity('setup-cancer-services', row);
    if (r.success) {
      setServices([row, ...services.filter((x) => x.id !== row.id)]);
      setSvc({ ...svc, id: '' });
      setMsg('Cancer service linked to System Setup catalogue.');
    } else setMsg(r.error || 'Service save failed');
    setTimeout(() => setMsg(''), 3000);
  };
  return (
    <div className="space-y-4">
      {msg && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg font-bold">{msg}</div>}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-black mb-3">Cancer / Oncology Treatment Protocol Setup</h3>
        <div className="grid md:grid-cols-4 gap-2">
          <input
            placeholder="Protocol code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="border rounded-lg p-2"
          />
          <input
            placeholder="Protocol name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg p-2"
          />
          <select
            value={form.treatmentType}
            onChange={(e) => setForm({ ...form, treatmentType: e.target.value })}
            className="border rounded-lg p-2"
          >
            <option>Chemotherapy</option>
            <option>Radiotherapy</option>
            <option>Immunotherapy</option>
            <option>Hormonal Therapy</option>
            <option>Supportive Oncology</option>
          </select>
          <input
            placeholder="Regimen"
            value={form.regimen}
            onChange={(e) => setForm({ ...form, regimen: e.target.value })}
            className="border rounded-lg p-2"
          />
          <input
            placeholder="Route"
            value={form.route}
            onChange={(e) => setForm({ ...form, route: e.target.value })}
            className="border rounded-lg p-2"
          />
          <input
            type="number"
            value={form.cycleDays}
            onChange={(e) => setForm({ ...form, cycleDays: e.target.value })}
            className="border rounded-lg p-2"
            placeholder="Cycle days"
          />
          <input
            type="number"
            value={form.defaultCycles}
            onChange={(e) => setForm({ ...form, defaultCycles: e.target.value })}
            className="border rounded-lg p-2"
            placeholder="Default cycles"
          />
          <input
            placeholder="SHA benefit code"
            value={form.shaBenefitCode}
            onChange={(e) => setForm({ ...form, shaBenefitCode: e.target.value })}
            className="border rounded-lg p-2"
          />
        </div>
        <label className="flex gap-2 items-center text-sm mt-3">
          <input type="checkbox" checked={form.preauthRequired} onChange={(e) => setForm({ ...form, preauthRequired: e.target.checked })} />{' '}
          SHA preauthorization required
        </label>
        <button onClick={() => void save()} className="mt-3 bg-blue-700 text-white px-4 py-2 rounded-lg font-bold">
          <Save className="w-4 h-4 inline mr-1" />
          Save Protocol
        </button>
      </div>
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-black mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Cancer Services linked to existing System Setup catalogues
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={linkCatalogue}
            onChange={(e) => {
              setLinkCatalogue(e.target.checked);
              setSvc((x: any) => ({ ...x, sourceId: e.target.checked ? x.sourceId : '', sourceEntity: e.target.checked ? source : null }));
            }}
          />
          <span className="text-sm font-bold">Link to an existing System Setup catalogue item (optional)</span>
        </div>
        <div className="grid md:grid-cols-4 gap-2">
          <input
            value={svc.code}
            onChange={(e) => setSvc({ ...svc, code: e.target.value })}
            placeholder="Cancer service code"
            className="border rounded-lg p-2"
          />
          <input
            value={svc.name}
            onChange={(e) => setSvc({ ...svc, name: e.target.value })}
            placeholder="Cancer service name"
            className="border rounded-lg p-2"
          />
          <select
            value={svc.serviceType}
            onChange={(e) => setSvc({ ...svc, serviceType: e.target.value })}
            className="border rounded-lg p-2"
          >
            <option>Pharmacy</option>
            <option>Laboratory</option>
            <option>Radiology</option>
            <option>Nursing Procedure</option>
            <option>Consultation</option>
            <option>Chemotherapy</option>
            <option>Radiotherapy</option>
            <option>Immunotherapy</option>
            <option>Other Oncology Service</option>
          </select>
          {linkCatalogue ? (
            <>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="border rounded-lg p-2">
                <option value="setup-pharmacy-drugs">Pharmacy / Drugs</option>
                <option value="setup-lab-tests">Laboratory</option>
                <option value="setup-radiology-tests">Radiology</option>
                <option value="setup-nursing-procedures">Nursing Procedures</option>
                <option value="setup-consultation-services">Consultation</option>
              </select>
              <select value={svc.sourceId} onChange={(e) => setSvc({ ...svc, sourceId: e.target.value })} className="border rounded-lg p-2">
                <option value="">Select catalogue item</option>
                {catalogue.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.code} — {x.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <input
            type="number"
            value={svc.cashPrice}
            onChange={(e) => setSvc({ ...svc, cashPrice: e.target.value })}
            placeholder="Cash price"
            className="border rounded-lg p-2"
          />
          <select
            value={svc.shaSubcategoryCode}
            onChange={(e) => {
              const v = e.target.value;
              const price = selected?.subCategoryPrices?.[v] || svc.shaPrice || 0;
              setSvc({ ...svc, shaSubcategoryCode: v, shaPrice: Number(price) });
            }}
            className="border rounded-lg p-2"
          >
            <option value="">SHA sub-category (optional)</option>
            {subs.map((s: any) => (
              <option key={s.id} value={s.sub_category_code}>
                {s.sub_category_code} — {s.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={svc.shaPrice}
            onChange={(e) => setSvc({ ...svc, shaPrice: e.target.value })}
            className="border rounded-lg p-2"
            placeholder="SHA price"
          />
        </div>
        <div className="text-xs text-slate-500 mt-2">
          You can create a standalone oncology service without selecting a Pharmacy, Lab, Radiology, Nursing or Consultation catalogue item.
          If linked, the SHA price is populated from the selected System Setup sub-category tariff.
        </div>
        <button onClick={() => void saveService()} className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">
          <Save className="w-4 h-4 inline mr-1" />
          Link Service
        </button>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Service</th>
              <th className="p-3 text-left">Source</th>
              <th className="p-3 text-left">SHA Sub-Category</th>
              <th className="p-3 text-right">SHA Price</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.code}</td>
                <td className="p-3 font-bold">{s.name}</td>
                <td className="p-3">
                  {s.source_entity} / {s.source_id}
                </td>
                <td className="p-3">{s.sha_subcategory_code}</td>
                <td className="p-3 text-right">KSh {Number(s.sha_price || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs">
        Oncology services can reference Pharmacy, Laboratory, Radiology, Nursing Procedures and Consultation setup records. Treatment
        plans/cycles/sessions then carry the SHA preauthorization and can generate separate invoices without breaking the standard Billing &
        Cashier module.
      </div>
    </div>
  );
};
