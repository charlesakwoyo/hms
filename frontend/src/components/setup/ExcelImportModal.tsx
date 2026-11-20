import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download, Eye } from 'lucide-react';
import { parseExcelOrCsvFile, downloadSetupSampleTemplate, ParsedSheetData } from '../../utils/setupExcelUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabKey: string;
  tabTitle: string;
  onImportConfirmed: (importedRows: Record<string, string | number>[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, tabKey, tabTitle, onImportConfirmed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setParsing(true);

    try {
      const data = await parseExcelOrCsvFile(selectedFile);
      if (data.totalCount === 0) {
        throw new Error('The selected file has no data rows. Please ensure it has column headers and at least 1 data row.');
      }
      setParsedData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reading spreadsheet file';
      setError(msg);
      setParsedData(null);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedData || parsedData.rows.length === 0) return;
    onImportConfirmed(parsedData.rows);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Excel / CSV Batch Upload</h3>
              <p className="text-xs text-slate-300">Import records directly into {tabTitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between gap-3 text-xs text-sky-900">
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Need the standard format? Download the official sample template with sample rows before uploading.</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSetupSampleTemplate(tabKey)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shrink-0 transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample Template (.CSV)</span>
            </button>
          </div>

          {!parsedData && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-[#0088cc] hover:bg-sky-50/50 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
            >
              <div className="p-4 bg-sky-100 text-[#0088cc] rounded-full">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {parsing ? 'Parsing Excel spreadsheet...' : 'Click to browse or drop your Excel / CSV file here'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Supports Microsoft Excel (.xlsx, .xls) and standard (.csv) files</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" />
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Spreadsheet Parse Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {parsedData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-900 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">{parsedData.fileName}</span> — successfully identified{' '}
                    <span className="font-extrabold text-emerald-700">{parsedData.totalCount} records</span> across{' '}
                    {parsedData.headers.length} columns.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-emerald-700 underline font-semibold hover:text-emerald-900 ml-3 shrink-0 cursor-pointer"
                >
                  Choose Different File
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs text-gray-600">
                  <span className="font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                    Data Preview (First 5 Rows):
                  </span>
                  <span>
                    Showing {Math.min(5, parsedData.rows.length)} of {parsedData.totalCount} rows
                  </span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-x-auto max-h-60">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-3 py-2 border-b border-gray-200">#</th>
                        {parsedData.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedData.rows.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 text-gray-400 font-mono">{rIdx + 1}</td>
                          {parsedData.headers.map((h, cIdx) => (
                            <td key={cIdx} className="px-3 py-1.5 text-gray-700 whitespace-nowrap max-w-xs truncate">
                              {String(row[h] !== undefined ? row[h] : '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedData || parsedData.rows.length === 0}
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
              parsedData && parsedData.rows.length > 0
                ? 'bg-[#0088cc] hover:bg-[#0077b5] text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Import {parsedData ? `${parsedData.totalCount} Records` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
