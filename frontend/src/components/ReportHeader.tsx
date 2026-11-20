import React from 'react';
import { HospitalConfig } from '../types';
import { hospitalHeaderHtml } from '../utils/hospitalAddress';

export const ReportHeader: React.FC<{ config?: HospitalConfig; title?: string; subtitle?: string }> = ({ config, title, subtitle }) => (
  <div className="report-facility-header pb-3 mb-4 text-center">
    <div dangerouslySetInnerHTML={{ __html: hospitalHeaderHtml(config) }} />
    {config?.website && <p className="text-[11px]">{config.website}</p>}
    {title && <h2 className="text-sm font-black uppercase mt-2">{title}</h2>}
    {subtitle && <p className="text-[10px] text-slate-600">{subtitle}</p>}
  </div>
);
