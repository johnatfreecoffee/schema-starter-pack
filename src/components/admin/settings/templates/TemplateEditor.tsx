import Editor from '@monaco-editor/react';

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TemplateEditor = ({ value, onChange }: TemplateEditorProps) => {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
      <Editor
        height="100%"
        defaultLanguage="html"
        value={value}
        onChange={(value) => onChange(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
};

export default TemplateEditor;
