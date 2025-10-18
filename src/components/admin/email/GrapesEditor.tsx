import { useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsPresetNewsletter from 'grapesjs-preset-newsletter';

interface GrapesEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const GrapesEditor = ({ value, onChange }: GrapesEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!editorRef.current || editorInstanceRef.current) return;

    const editor = grapesjs.init({
      container: editorRef.current,
      height: '500px',
      width: 'auto',
      plugins: [gjsPresetNewsletter],
      pluginsOpts: {
        'gjs-preset-newsletter': {
          modalTitleImport: 'Import template',
        }
      },
      storageManager: false,
      fromElement: false,
      canvas: {
        styles: [],
        scripts: [],
      },
      panels: {
        defaults: [
          {
            id: 'basic-actions',
            el: '.panel__basic-actions',
            buttons: [
              {
                id: 'visibility',
                active: true,
                className: 'btn-toggle-borders',
                label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M15,9H9V5H15M12,19A1.5,1.5 0 0,1 10.5,17.5A1.5,1.5 0 0,1 12,16A1.5,1.5 0 0,1 13.5,17.5A1.5,1.5 0 0,1 12,19M21,10.12H3V12H21V10.12M3,13H21V15H3V13Z" /></svg>',
                command: 'sw-visibility',
              },
              {
                id: 'export',
                className: 'btn-open-export',
                label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12.89,3L14.85,3.4L11.11,21L9.15,20.6L12.89,3M19.59,12L16,8.41V5.58L22.42,12L16,18.41V15.58L19.59,12M1.58,12L8,5.58V8.41L4.41,12L8,15.58V18.41L1.58,12Z" /></svg>',
                command: 'export-template',
              },
              {
                id: 'undo',
                className: 'btn-undo',
                label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z" /></svg>',
                command: 'core:undo',
              },
              {
                id: 'redo',
                className: 'btn-redo',
                label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03 1.54,15.22L3.9,16C4.95,12.81 7.95,10.5 11.5,10.5C13.45,10.5 15.23,11.22 16.62,12.38L13,16H22V7L18.4,10.6Z" /></svg>',
                command: 'core:redo',
              },
              {
                id: 'clear-all',
                className: 'btn-clear',
                label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>',
                command: 'core:canvas-clear',
              },
            ],
          },
          {
            id: 'panel-devices',
            el: '.panel__devices',
            buttons: [
              {
                id: 'device-desktop',
                label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z" /></svg>',
                command: 'set-device-desktop',
                active: true,
                togglable: false,
              },
              {
                id: 'device-tablet',
                label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,18H5V6H19M21,4H3C1.89,4 1,4.89 1,6V18A2,2 0 0,0 3,20H21A2,2 0 0,0 23,18V6C23,4.89 22.1,4 21,4Z" /></svg>',
                command: 'set-device-tablet',
                togglable: false,
              },
              {
                id: 'device-mobile',
                label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z" /></svg>',
                command: 'set-device-mobile',
                togglable: false,
              },
            ],
          },
        ],
      },
      deviceManager: {
        devices: [
          {
            name: 'Desktop',
            width: '',
          },
          {
            name: 'Tablet',
            width: '768px',
            widthMedia: '992px',
          },
          {
            name: 'Mobile',
            width: '320px',
            widthMedia: '480px',
          },
        ],
      },
      styleManager: {
        sectors: [
          {
            name: 'Typography',
            open: true,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-shadow'],
          },
          {
            name: 'Decorations',
            open: false,
            buildProps: ['background-color', 'border-radius', 'border', 'box-shadow', 'background'],
          },
          {
            name: 'Dimensions',
            open: false,
            buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'],
          },
          {
            name: 'Extra',
            open: false,
            buildProps: ['opacity', 'transition', 'perspective', 'transform'],
          },
        ],
      },
      blockManager: {
        appendTo: '.blocks-container',
      },
    });

    // Set initial content
    if (value) {
      editor.setComponents(value);
    }

    // Listen for changes
    editor.on('update', () => {
      const html = editor.getHtml();
      const css = editor.getCss();
      const fullHtml = css ? `<style>${css}</style>${html}` : html;
      onChange(fullHtml);
    });

    editorInstanceRef.current = editor;

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorInstanceRef.current && value !== editorInstanceRef.current.getHtml()) {
      editorInstanceRef.current.setComponents(value);
    }
  }, [value]);

  return (
    <div className="grapes-editor-wrapper border rounded-lg overflow-hidden bg-background">
      <div className="panel__top flex items-center gap-2 p-2 border-b bg-muted/30">
        <div className="panel__basic-actions flex items-center gap-1"></div>
        <div className="panel__devices flex items-center gap-1 ml-auto"></div>
      </div>
      <div ref={editorRef} className="grapes-editor"></div>
    </div>
  );
};

export default GrapesEditor;
