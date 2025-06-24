import React, { useRef } from 'react';
import ImageEditor from '@toast-ui/react-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';

const ToastImageEditor = ({ imageSrc, onSave, onCancel }) => {
  const editorRef = useRef();

  const handleSave = () => {
    const instance = editorRef.current.getInstance();
    const dataUrl = instance.toDataURL();
    if (onSave) onSave(dataUrl);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, background: '#fff', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <ImageEditor
        ref={editorRef}
        includeUI={{
          loadImage: {
            path: imageSrc,
            name: 'Bild',
          },
          theme: {}, // Optional: eigenes Theme
          menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
          initMenu: '',
          uiSize: {
            width: '90vw',
            height: '80vh',
          },
          menuBarPosition: 'bottom',
        }}
        cssMaxWidth={window.innerWidth * 0.85}
        cssMaxHeight={window.innerHeight * 0.7}
        selectionStyle={{
          cornerSize: 20,
          rotatingPointOffset: 70,
        }}
        usageStatistics={false}
      />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: 24 }}>
        <button onClick={onCancel}>Abbrechen</button>
        <button onClick={handleSave}>Speichern</button>
      </div>
    </div>
  );
};

export default ToastImageEditor;