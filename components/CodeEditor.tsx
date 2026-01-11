
import React, { useState, useEffect } from 'react';
import { ResumeData } from '../types';

interface CodeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ data, onChange }) => {
  const [code, setCode] = useState(JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only update if external change happened (e.g. from visual editor)
    // Avoid feedback loop
    const currentCode = JSON.stringify(data, null, 2);
    if (currentCode !== code) {
      setCode(currentCode);
    }
  }, [data]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    try {
      const parsed = JSON.parse(value);
      setError(null);
      onChange(parsed);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm">
      <div className="p-2 bg-[#252526] flex justify-between items-center border-b border-[#3e3e3e]">
        <span className="text-xs uppercase font-bold text-gray-500">resume_data.json</span>
        {error ? (
          <span className="text-red-400 text-[10px] bg-red-900/30 px-2 py-0.5 rounded">Invalid JSON</span>
        ) : (
          <span className="text-green-400 text-[10px] bg-green-900/30 px-2 py-0.5 rounded">Valid JSON</span>
        )}
      </div>
      <textarea
        className="flex-1 p-4 bg-transparent outline-none resize-none caret-white leading-relaxed"
        value={code}
        spellCheck={false}
        onChange={(e) => handleCodeChange(e.target.value)}
      />
      {error && (
        <div className="p-2 bg-red-900/50 text-red-200 text-xs border-t border-red-800">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
