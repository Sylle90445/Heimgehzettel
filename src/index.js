import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import App from './App';
import './i18n';
import { useTranslation } from 'react-i18next';
import dbService from './indexedDBService';

const useJsonDatabase = (category) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const instructionsList = await dbService.readData(category);
        console.log('Fetched data for category:', category, instructionsList);
        setData(instructionsList || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData([]);
      }
    };

    fetchData();
  }, [category]);

  const addItemToDatabase = async (item) => {
    try {
      const newItem = await dbService.addItem(category, item);
      const updatedData = await dbService.readData(category);
      console.log('Data after adding item:', updatedData);
      setData(updatedData);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateItemInDatabase = async (id, updatedItem) => {
    try {
      await dbService.updateItem(category, id, updatedItem);
      const updatedData = await dbService.readData(category);
      console.log('Data after updating item:', updatedData);
      setData(updatedData);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItemFromDatabase = async (id) => {
    try {
      await dbService.deleteItem(category, id);
      const updatedData = await dbService.readData(category);
      console.log('Data after deleting item:', updatedData);
      setData(updatedData);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return { data, addItemToDatabase, updateItemInDatabase, deleteItemFromDatabase };
};

export default useJsonDatabase;

const DragAndDropArea = ({ onDrop }) => {
  const { t } = useTranslation();
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onDrop(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '20px',
      }}
    >
      {t('dropImageOrVideo')}
    </div>
  );
};

import ImageEditor from './ImageEditor';

const WorkInstructionForm = ({ addInstruction, isAuthenticated }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionImages, setDescriptionImages] = useState([]);
  const [steps, setSteps] = useState([]);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [creatorName, setCreatorName] = useState('');

  // Bildbearbeitung
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editImageIndex, setEditImageIndex] = useState(null);
  const [editImageSrc, setEditImageSrc] = useState(null);
  const [editStepIndex, setEditStepIndex] = useState(null);
  const [editStepMediaIndex, setEditStepMediaIndex] = useState(null);

  // Beschreibung-Bild bearbeiten
  const handleEditDescriptionImage = (mediaIndex) => {
    setEditImageIndex(mediaIndex);
    setEditImageSrc(descriptionImages[mediaIndex].data);
    setShowImageEditor(true);
    setEditStepIndex(null);
    setEditStepMediaIndex(null);
  };

  // Schritt-Bild bearbeiten
  const handleEditStepImage = (stepIndex, mediaIndex) => {
    setEditStepIndex(stepIndex);
    setEditStepMediaIndex(mediaIndex);
    setEditImageSrc(steps[stepIndex].media[mediaIndex].data);
    setShowImageEditor(true);
    setEditImageIndex(null);
  };

  // Bild speichern (Beschreibung oder Schritt)
  const handleSaveEditedDescriptionImage = (newImageDataUrl) => {
    if (editStepIndex !== null && editStepMediaIndex !== null) {
      // Schritt-Bild bearbeiten
      const updatedSteps = [...steps];
      updatedSteps[editStepIndex].media[editStepMediaIndex] = {
        ...updatedSteps[editStepIndex].media[editStepMediaIndex],
        data: newImageDataUrl
      };
      setSteps(updatedSteps);
    } else if (editImageIndex !== null) {
      // Beschreibung-Bild bearbeiten
      const updatedImages = [...descriptionImages];
      updatedImages[editImageIndex] = { ...updatedImages[editImageIndex], data: newImageDataUrl };
      setDescriptionImages(updatedImages);
    }
    setShowImageEditor(false);
    setEditImageIndex(null);
    setEditImageSrc(null);
    setEditStepIndex(null);
    setEditStepMediaIndex(null);
  };

  const closeImageEditor = () => {
    setShowImageEditor(false);
    setEditImageIndex(null);
    setEditImageSrc(null);
    setEditStepIndex(null);
    setEditStepMediaIndex(null);
  };


  const handleAddStep = () => {
    setSteps([...steps, { text: '', media: [], mediaType: '' }]);
  };

  const handleDropMedia = async (files, index, isDescription = false) => {
    const newMedia = [];

    for (const file of files) {
      if (file instanceof Blob || file instanceof File) {
        try {
          const mediaData = await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async () => {
              if (file.type.startsWith('image')) {
                const img = new Image();
                img.src = reader.result;

                await new Promise((imgResolve) => {
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const maxWidth = 800;
                    const maxHeight = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                      if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                      }
                    } else {
                      if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                      }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                      const compressedReader = new FileReader();
                      compressedReader.onloadend = () => {
                        resolve({
                          type: 'image',
                          data: compressedReader.result,
                          width,
                          height
                        });
                      };
                      compressedReader.readAsDataURL(blob);
                    }, 'image/jpeg', 0.7);
                  };
                });
              } else if (file.type.startsWith('video')) {
                resolve({
                  type: 'video',
                  data: reader.result,
                  size: file.size
                });
              }
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newMedia.push(mediaData);
        } catch (error) {
          console.error('Error processing file:', error);
          alert('Error processing file. Please try again.');
        }
      }
    }

    if (isDescription) {
      setDescriptionImages([...descriptionImages, ...newMedia]);
    } else {
      const newSteps = [...steps];
      newSteps[index].media = [...(newSteps[index].media || []), ...newMedia];
      setSteps(newSteps);
    }
  };

  const handleFileChange = async (e, index, isDescription) => {
    const file = e.target.files[0];
    if (!file) return;

    await handleDropMedia([file], index, isDescription);
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const removeMedia = (stepIndex, mediaIndex, isDescription = false) => {
    if (isDescription) {
      const newDescriptionImages = [...descriptionImages];
      newDescriptionImages.splice(mediaIndex, 1);
      setDescriptionImages(newDescriptionImages);
    } else {
      const newSteps = [...steps];
      newSteps[stepIndex].media.splice(mediaIndex, 1);
      setSteps(newSteps);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!creatorName.trim()) {
      alert(t('Bitte gib den Namen des Erstellers an!'));
      return;
    }
    try {
      // Ensure all description images are resolved
      const resolvedDescriptionImages = await Promise.all(
        descriptionImages.map(async (media) => {
          if (media instanceof Promise) {
            return await media;
          }
          return media;
        })
      );

      // Ensure all steps and their media are resolved
      const resolvedSteps = await Promise.all(
        steps.map(async (step) => {
          const resolvedMedia = await Promise.all(
            (step.media || []).map(async (media) => {
              if (media instanceof Promise) {
                return await media;
              }
              return media;
            })
          );

          return {
            ...step,
            media: resolvedMedia
          };
        })
      );

        const newInstruction = {
        title,
        description,
        descriptionImages: resolvedDescriptionImages,
        steps: resolvedSteps,
        creationDate: new Date().toLocaleString(),
        changeStatus: 'A',  // Initialize with 'A'
        creatorName,
        creatorDate: new Date().toLocaleString(),
        modifierName: '',
        modifierDate: ''
        };

      console.log('Saving instruction with resolved media:', newInstruction);
      addInstruction(newInstruction);

      // Reset form
      setTitle('');
      setDescription('');
      setDescriptionImages([]);
      setSteps([]);
    } catch (error) {
      console.error('Error processing media:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
        <input
        type="text"
        placeholder={t('Ersteller Name')}
        value={creatorName}
        onChange={(e) => setCreatorName(e.target.value)}
        required
        style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
        disabled={!isAuthenticated}
        />
        <input
        type="text"
        placeholder={t('Name Arbeitsanweisung')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
        disabled={!isAuthenticated}
        />
      <textarea
        placeholder={t('description')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
        disabled={!isAuthenticated}
      />

      {/* Bereich für das Hinzufügen von Bildern zur Beschreibung */}
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="description-image-input" style={{
          display: 'inline-block',
          padding: '10px',
          backgroundColor: isAuthenticated ? '#007bff' : '#ccc',
          color: '#fff',
          borderRadius: '5px',
          cursor: isAuthenticated ? 'pointer' : 'not-allowed',
          marginRight: '10px',
        }}>
          {t('selectFile')}
        </label>
        <input
          id="description-image-input"
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, null, true)}
          style={{ display: 'none' }}
          disabled={!isAuthenticated}
          multiple
        />
        <DragAndDropArea onDrop={(files) => handleDropMedia(files, null, true)} />
        <div>
  {descriptionImages.map((media, mediaIndex) => (
    <div key={mediaIndex} style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }}>
      {media.type === 'image' && <img src={media.data} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />}
      <button onClick={() => removeMedia(null, mediaIndex, true)} style={{
        position: 'absolute',
        top: '5px',
        right: '5px',
        backgroundColor: 'red',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        width: '20px',
        height: '20px',
        textAlign: 'center',
        lineHeight: '20px',
      }}>x</button>
      {media.type === 'image' && (
        <button
          type="button"
          onClick={() => handleEditDescriptionImage(mediaIndex)}
          style={{
            position: 'absolute',
            bottom: '5px',
            right: '5px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: '12px',
          }}
        >
          Bearbeiten
        </button>
      )}
    </div>
  ))}
  {showImageEditor && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, maxWidth: 600 }}>
        <ImageEditor imageSrc={editImageSrc} onSave={handleSaveEditedDescriptionImage} />
        <button onClick={closeImageEditor} style={{ marginTop: 10 }}>Abbrechen</button>
      </div>
    </div>
  )}

</div>
        
      </div>

      {steps.map((step, index) => (
        <div key={index} style={{ marginBottom: '10px', position: 'relative' }}>
          <textarea
            placeholder={`${t('step')} ${index + 1}`}
            value={step.text}
            onChange={(e) => handleStepChange(index, 'text', e.target.value)}
            required
            style={{ marginBottom: '5px', padding: '5px', width: '100%' }}
            disabled={!isAuthenticated}
          />
          <button onClick={() => removeStep(index)} style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '20px',
            height: '20px',
            textAlign: 'center',
            lineHeight: '20px',
          }}>x</button>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label htmlFor={`file-input-${index}`} style={{
              display: 'inline-block',
              padding: '10px',
              backgroundColor: isAuthenticated ? '#007bff' : '#ccc',
              color: '#fff',
              borderRadius: '5px',
              cursor: isAuthenticated ? 'pointer' : 'not-allowed',
              marginRight: '10px',
            }}>
              {t('selectFile')}
            </label>
            <input
              id={`file-input-${index}`}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handleFileChange(e, index)}
              style={{ display: 'none' }}
              disabled={!isAuthenticated}
              multiple
            />
            <DragAndDropArea onDrop={(files) => handleDropMedia(files, index)} />
        </div>
        {step.media.map((media, mediaIndex) => (
          <div key={mediaIndex} style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }}>
            {media.type === 'image' && <img src={media.data} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />}
            {media.type === 'video' && <video controls style={{ maxWidth: '100px', maxHeight: '100px' }}>
              <source src={media.data} type={media.data.type} />
              {t('videoNotSupported')}
            </video>}
            <button onClick={() => removeMedia(index, mediaIndex)} style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              width: '20px',
              height: '20px',
              textAlign: 'center',
              lineHeight: '20px',
            }}>x</button>
            {media.type === 'image' && (
              <button
                type="button"
                onClick={() => handleEditStepImage(index, mediaIndex)}
                style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '12px',
                }}
              >
                Bearbeiten
              </button>
            )}
          </div>
        ))}
      </div>
    ))}
    <button type="button" onClick={handleAddStep} style={{ marginBottom: '10px' }} disabled={!isAuthenticated}>
      {t('schritt hinzufügen')}
    </button>
    <button
      type="submit"
      style={{ padding: '10px', width: '100%' }}
      disabled={!isAuthenticated || isProcessingMedia}
    >
      {isProcessingMedia ? t('processingMedia') : t('addInstruction')}
    </button>
  </form>
);
};

const EditInstructionForm = ({ instruction, index, updateInstruction, cancelEdit }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(instruction.title);
  const [description, setDescription] = useState(instruction.description);
  const [descriptionImages, setDescriptionImages] = useState(instruction.descriptionImages || []);
  const [steps, setSteps] = useState(instruction.steps);
  const [modifierName, setModifierName] = useState('');

  // Bildbearbeitungs-States für Editor
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editImageIndex, setEditImageIndex] = useState(null);
  const [editImageSrc, setEditImageSrc] = useState(null);
  const [editStepIndex, setEditStepIndex] = useState(null);
  const [editStepMediaIndex, setEditStepMediaIndex] = useState(null);

  // Function to increment change status
  const getNextChangeStatus = (currentStatus) => {
    if (!currentStatus) return 'A';
    return String.fromCharCode(currentStatus.charCodeAt(0) + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedInstruction = {
      ...instruction,
      title,
      description,
      descriptionImages,
      steps,
      modificationDate: new Date().toLocaleString(),
      changeStatus: getNextChangeStatus(instruction.changeStatus || '@'), // @ is before A in ASCII
      modifierName,
      modifierDate: new Date().toLocaleString()
    };
    updateInstruction(index, updatedInstruction);
    cancelEdit();
  };

  const handleDescriptionFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const newMedia = [];

    for (const file of files) {
      if (file instanceof Blob || file instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (file.type.startsWith('image')) {
            newMedia.push({
              type: 'image',
              data: reader.result
            });
            setDescriptionImages([...descriptionImages, ...newMedia]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDropDescriptionMedia = async (files) => {
    const newMedia = [];
    for (const file of files) {
      if (file instanceof Blob || file instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (file.type.startsWith('image')) {
            newMedia.push({
              type: 'image',
              data: reader.result
            });
            setDescriptionImages([...descriptionImages, ...newMedia]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDropStepMedia = async (files, stepIndex) => {
    const newSteps = [...steps];
    const newMedia = [...newSteps[stepIndex].media];
    for (const file of files) {
      if (file instanceof Blob || file instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newMedia.push({ 
            data: reader.result, 
            type: file.type.startsWith('video') ? 'video' : 'image' 
          });
          newSteps[stepIndex].media = newMedia;
          setSteps(newSteps);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeDescriptionImage = (mediaIndex) => {
    const newDescriptionImages = [...descriptionImages];
    newDescriptionImages.splice(mediaIndex, 1);
    setDescriptionImages(newDescriptionImages);
  };

  const handleStepChange = (stepIndex, field, value) => {
    const newSteps = [...steps];
    newSteps[stepIndex][field] = value;
    setSteps(newSteps);
  };

  const insertStep = (index) => {
    const newSteps = [...steps];
    newSteps.splice(index, 0, { text: '', media: [], mediaType: '' });
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, { text: '', media: [], mediaType: '' }]);
  };

  const handleFileChange = async (e, stepIndex) => {
    const files = Array.from(e.target.files);
    const newSteps = [...steps];
    const newMedia = [...newSteps[stepIndex].media];
    for (const file of files) {
      if (file instanceof Blob || file instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newMedia.push({ data: reader.result, type: file.type.startsWith('video') ? 'video' : 'image' });
          newSteps[stepIndex].media = newMedia;
          setSteps(newSteps);
        };
        reader.readAsDataURL(file); // Read as Data URL to get Base64
      } else {
        console.error('Selected file is not a Blob or File.');
      }
    }
  };

  const removeStep = (stepIndex) => {
    const newSteps = steps.filter((_, i) => i !== stepIndex);
    setSteps(newSteps);
  };

  const removeMedia = (stepIndex, mediaIndex) => {
    const newSteps = [...steps];
    newSteps[stepIndex].media.splice(mediaIndex, 1);
    setSteps(newSteps);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('bearbeiter name')}:</label>
          <input 
            type="text" 
            value={modifierName} 
            onChange={(e) => setModifierName(e.target.value)} 
            required 
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('title')}:</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('description')}:</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              minHeight: '100px',
              resize: 'vertical'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('Bild Beschreibung')}:</label>
          <input
          type="file"
          accept="image/*"
          onChange={handleDescriptionFileChange}
          multiple
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            backgroundColor: '#fff',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
          />
          <DragAndDropArea onDrop={handleDropDescriptionMedia} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {descriptionImages.map((media, mediaIndex) => (
              <div key={mediaIndex} style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }}>
                {media.type === 'image' ? (
                  <>
                    <img
                      src={media.data}
                      alt={t('Bild Beschreibung')}
                      style={{ maxWidth: '200px', display: 'block', marginTop: '10px', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditImageIndex(mediaIndex);
                        setEditImageSrc(media.data);
                        setShowImageEditor(true);
                        setEditStepIndex(null);
                        setEditStepMediaIndex(null);
                      }}
                      style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '5px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        fontSize: '12px',
                      }}
                    >
                      Bearbeiten
                    </button>
                  </>
                ) : null}
                <button
                  onClick={() => removeDescriptionImage(mediaIndex)}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    width: '24px',
                    height: '24px',
                    textAlign: 'center',
                    lineHeight: '24px',
                  }}
                >x</button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('steps')}:</label>
          {steps.map((step, stepIndex) => (
            <div key={stepIndex}>
              <button 
                type="button"
                onClick={() => insertStep(stepIndex)}
                style={{
                  width: '100%',
                  padding: '5px',
                  marginBottom: '10px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {t('Schritt hier einfügen')}
              </button>
              <div style={{ 
                position: 'relative',
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                <textarea 
                  placeholder={t('stepDescription')} 
                  value={step.text} 
                  onChange={(e) => handleStepChange(stepIndex, 'text', e.target.value)} 
                  required 
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => removeStep(stepIndex)} 
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    width: '24px',
                    height: '24px',
                    textAlign: 'center',
                    lineHeight: '24px',
                  }}
                >x</button>
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  onChange={(e) => handleFileChange(e, stepIndex)} 
                  multiple
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '10px',
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
                <DragAndDropArea onDrop={(files) => handleDropStepMedia(files, stepIndex)} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {step.media.map((media, mediaIndex) => (
                    <div key={mediaIndex} style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }}>
                      {media.type === 'image' ? (
                        <>
                          <img
                            src={media.data}
                            alt={`${t('step')} ${stepIndex + 1}`}
                            style={{ maxWidth: '200px', display: 'block', marginTop: '10px', borderRadius: '4px' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditStepIndex(stepIndex);
                              setEditStepMediaIndex(mediaIndex);
                              setEditImageSrc(media.data);
                              setShowImageEditor(true);
                              setEditImageIndex(null);
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '5px',
                              right: '5px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              fontSize: '12px',
                            }}
                          >
                            Bearbeiten
                          </button>
                        </>
                      ) : (
                        <video
                          controls
                          style={{ maxWidth: '200px', display: 'block', marginTop: '10px', borderRadius: '4px' }}
                        >
                          <source src={media.data} type="video/mp4" />
                          {t('videoNotSupported')}
                        </video>
                      )}
                      <button 
                        onClick={() => removeMedia(stepIndex, mediaIndex)} 
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          backgroundColor: 'red',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          width: '24px',
                          height: '24px',
                          textAlign: 'center',
                          lineHeight: '24px',
                        }}
                      >x</button>
                    </div>
                  ))}
                </div>
                {showImageEditor && (
                  <ImageEditor
                    imageSrc={editImageSrc}
                    onSave={(newImageDataUrl) => {
                      if (editStepIndex !== null && editStepMediaIndex !== null) {
                        // Schritt-Bild bearbeiten
                        const updatedSteps = [...steps];
                        updatedSteps[editStepIndex].media[editStepMediaIndex] = {
                          ...updatedSteps[editStepIndex].media[editStepMediaIndex],
                          data: newImageDataUrl
                        };
                        setSteps(updatedSteps);
                      } else if (editImageIndex !== null) {
                        // Beschreibung-Bild bearbeiten
                        const updatedImages = [...descriptionImages];
                        updatedImages[editImageIndex] = { ...updatedImages[editImageIndex], data: newImageDataUrl };
                        setDescriptionImages(updatedImages);
                      }
                      setShowImageEditor(false);
                      setEditImageIndex(null);
                      setEditImageSrc(null);
                      setEditStepIndex(null);
                      setEditStepMediaIndex(null);
                    }}
                    onClose={() => {
                      setShowImageEditor(false);
                      setEditImageIndex(null);
                      setEditImageSrc(null);
                      setEditStepIndex(null);
                      setEditStepMediaIndex(null);
                    }}
                  />
                )}
              </div>
            </div>
          ))}
          <div>
          <button 
            type="button"
            onClick={() => insertStep(steps.length)}
            style={{
            width: '100%',
            padding: '5px',
            marginBottom: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
            }}
          >
            {t('Schritt am Ende einfügen')}
          </button>
          <button 
            type="button" 
            onClick={addStep}
            style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
            }}
          >
            {t('schritt hinzufügen')}
          </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            type="submit"
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1
            }}
          >{t('save')}</button>
          <button 
            type="button" 
            onClick={cancelEdit}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1
            }}
          >{t('abbrechen')}</button>
        </div>
    </form>
  );
};

const instructionCardStyle = {
  card: {
    margin: '10px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 1.3s',
  },
  cardHover: {
    transform: 'scale(1.02)',
  },
  cardTitle: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '5px',
  },
};

const PrintModal = ({ isOpen, onClose, onPrint, instruction }) => {
  const { t, i18n } = useTranslation();
  const [ausgeber, setAusgeber] = useState('');
  const [gueltigAb, setGueltigAb] = useState('');
  const [geltungsbereich, setGeltungsbereich] = useState('');
  const [prozessinhaber, setProzessinhaber] = useState('');
  const [prozessverantwortlicher, setProzessverantwortlicher] = useState('');
  const [zweck, setZweck] = useState('');

  const handlePrint = async () => {
    const printData = {
      ...instruction,
      ausgeber,
      gueltigAb,
      geltungsbereich,
      prozessinhaber,
      prozessverantwortlicher,
      zweck
    };
    const lang = i18n.language;
    const translatedData = await getTranslatedPrintData(printData, lang);
    printInstruction(translatedData, t, translatedData.changeStatus || 'A');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        width: '400px',
      }}>
        <h3>{t('printOptions')}</h3>
        <div>
          <label>{t('issuer')}:</label>
          <input type="text" value={ausgeber} onChange={(e) => setAusgeber(e.target.value)} required />
        </div>
        <div>
          <label>{t('validFrom')}:</label>
          <input type="text" value={gueltigAb} onChange={(e) => setGueltigAb(e.target.value)} required />
        </div>
        <div>
          <label>{t('scope')}:</label>
          <input type="text" value={geltungsbereich} onChange={(e) => setGeltungsbereich(e.target.value)} required />
        </div>
        <div>
          <label>{t('processOwner')}:</label>
          <input type="text" value={prozessinhaber} onChange={(e) => setProzessinhaber(e.target.value)} required />
        </div>
        <div>
          <label>{t('processResponsible')}:</label>
          <input type="text" value={prozessverantwortlicher} onChange={(e) => setProzessverantwortlicher(e.target.value)} required />
        </div>
        <div>
          <label>{t('purpose')}:</label>
          <input type="text" value={zweck} onChange={(e) => setZweck(e.target.value)} required />
        </div>
        <button onClick={handlePrint} style={{ marginRight: '10px' }}>{t('print')}</button>
        <button onClick={onClose}>{t('cancel')}</button>
      </div>
    </div>
  );
};

const printInstruction = (printData, t, changeStatus = 'A') => {
  const printWindow = window.open('', '_blank');

  // Format dates in DD.MM.YYYY format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // First try to parse the date string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If the date is invalid, try to parse from German format
        const parts = dateString.split('.');
        if (parts.length === 3) {
          return dateString; // Return as is if it's already in DD.MM.YYYY format
        }
        return '';
      }
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Format dates
  const creationDate = formatDate(printData.creatorDate);
  const modificationDate = printData.modifierDate ? formatDate(printData.modifierDate) : '';




  printWindow.document.write(`
    <html>
      <head>
      <title>${t('print')} ${printData.title}</title>
      <style>
        @page {
        size: A4;
        margin: 1.4cm;
        }
        body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        width: 21cm;
        }
        .container {
        width: 100%;
        border: 1px solid #000;
        padding: 10px;
        box-sizing: border-box;
        position: relative;
        min-height: 29.7cm; /* A4 height */
        }
        .header {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #000;
        padding-bottom: 10px;
        margin-bottom: 10px;
        }
        .header img {
        width: 50px;
        height: 50px;
        margin-right: 10px;
        }
        .header .info {
        flex: 1;
        text-align: center;
        }
        .header .info h2 {
        margin: 0;
        font-size: 18px;
        }
        .header .info p {
        margin: 2px 0;
        font-size: 12px;
        }
        .content {
        display: flex;
        flex-direction: column;
        padding-bottom: 150px; /* Space for footer */
        }

          .content h1 {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .content p {
            margin-bottom: 10px;
          }
          .steps {
            margin-top: 20px;
          }
          .steps h3 {
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .table-container {
            margin-bottom: 20px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .table th, .table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            word-wrap: break-word;
          }
          .table th {
            background-color: #f2f2f2;
          }
          .details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .details div {
            flex: 1;
            text-align: left;
          }
          .details ul {
            list-style-type: none;
            padding: 0;
          }
          .details ul li {
            margin-bottom: 5px;
          }
          .media-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
          }
          .media-container img, .media-container video {
            max-width: 200px;
            height: auto;
            margin-bottom: 10px;
          }
          .step-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
              .footer {
              position: absolute;
              bottom: 10px;
              left: 10px;
              right: 10px;
              page-break-inside: avoid;
              }
              .footer-table {
              width: 100%;
              border-collapse: collapse;
              background-color: #f2f2f2;
              }
            .footer-table td {
            border: 1px solid #000;
            padding: 4px 8px;
            font-size: 11px;
            }
            .footer-table .change-status {
            text-align: right;
            padding-right: 10px;
            }
            .footer-warning {
            background-color: #000;
            color: #fff;
            padding: 2px 4px;
            font-size: 11px;
            }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img id="logo" src="${window.location.origin}/etm Logo.ico" alt="Logo" style="display:block;">
            <div class="info">
              <h2>${printData.title}</h2>
              <p>[AA] ${t('Arbeitsanweisung')} / [APE] ${t('Autonome Produktionseinheit')}</p>
              <p>${printData.title}</p>
              <p>${t('nur für Internen gebrauch')}</p>
            </div>
          </div>
          <div class="content">
            <h1>${t('Arbeitsanweisung')}</h1>
            <div class="table-container">
              <table class="table">
                <tr>
                  <th>${t('issuer')}</th>
                  <th>${t('validFrom')}</th>
                  <th>${t('scope')}</th>
                </tr>
                <tr>
                  <td>${printData.ausgeber}</td>
                  <td>${printData.gueltigAb}</td>
                  <td>${printData.geltungsbereich}</td>
                </tr>
                <tr>
                  <th>${t('processOwner')}</th>
                  <th>${t('processResponsible')}</th>
                  <th>${t('purpose')}</th>
                </tr>
                <tr>
                  <td>${printData.prozessinhaber}</td>
                  <td>${printData.prozessverantwortlicher}</td>
                  <td>${printData.zweck}</td>
                </tr>
              </table>
            </div>
            <div class="details">
              <div>
                <strong>${t('Mitgeltende Dokumente')}:</strong>
                <span style="display:block;margin:4px 0 8px 0;">&#x25BA;&nbsp;Gesetzliche und betriebliche Sicherheits-/ Arbeitsschutz- und Umweltbestimmungen</span>
                <ul>
                  <li></li>
                  <li></li>
                </ul>
              </div>
            </div>
            <h1>${printData.title}</h1>
            <p>${printData.description}</p>
            ${printData.descriptionImages && printData.descriptionImages.length > 0 ? `
              <div class="media-container">
              ${printData.descriptionImages.map((media, mediaIndex) =>
                media.type === 'image' ?
                `<img src="${media.data}" alt="${t('description')} ${t('image')} ${mediaIndex + 1}" style="max-width: 310px; height: auto;"/>` : ''
              ).join('')}
              </div>
            ` : ''}
            <div class="steps">
              ${printData.steps.map((step, index) => `
                <div class="step-content">
                  <h3>${t('step')} ${index + 1}</h3>
                  <p>${step.text}</p>
                  <div class="media-container">
                    ${step.media.map((media, mediaIndex) => media.type === 'image' ?
                        `<img src="${media.data}" alt="${t('step')} ${index + 1} ${t('media')} ${mediaIndex + 1}" style="max-width: 310px; height: auto;"/>` :
                        `<video controls src="${media.data}" style="max-width: 310px;"></video>`
                    ).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
            <div class="footer">
            <table class="footer-table">
                <tr>
                <td>Erstellt von:</td>
                <td>${printData.creatorName || '[Name Ersteller]'}</td>
                <td>Datum:</td>
                <td>${creationDate}</td>
                </tr>
                <tr>
                <td>Geändert von:</td>
                <td>${printData.modifierName || '[Name Bearbeiter]'}</td>
                <td>Datum:</td>
                <td>${modificationDate || '[DD.MM.YYYY]'}</td>
                </tr>
              <tr>
              <td>Freigegeben von:</td>
              <td>[Name Freigeber]</td>
              <td>Datum:</td>
              <td>[DD.MM.YYYY]</td>
                <td class="change-status">Änderungsstand: ${changeStatus}</td>
              </tr>
              <tr>
              <td colspan="5" class="footer-warning">Prüfe vor Einsatz den Änderungsstand!</td>
              </tr>
            </table>
            </div>
        </div>
        <!-- Seitenumbruch für letzte Seite -->
        <div style="page-break-before: always;"></div>
        <div class="arbeitsschutz-extra" style="padding: 30px 40px 40px 40px; font-family: Arial, sans-serif;">
  <!-- Kopfzeile für Arbeitsschutz-Seite -->
  <div style="display: flex; align-items: flex-start; margin-bottom: 18px;">
    <img src="${window.location.origin}/etm Logo.ico" alt="Logo" style="width: 90px; margin-right: 30px;" />
    <div>
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">${printData.title || ''}</div>
      <div style="font-size: 13px;">[AA] Arbeitsanweisung / [APE] Autonome Produktionseinheit</div>
      <div style="font-size: 13px;">${printData.title || ''}</div>
      <div style="font-size: 11px;">nur für Internen gebrauch</div>
    </div>
  </div>
  <!-- Ende Kopfzeile -->
  <div style="display: flex; align-items: flex-start; justify-content: space-between;">
    <div style="flex: 1;">
      <div style="font-size: 25px; font-weight: bold; margin-bottom: 18px;">Arbeitsschutz- / Arbeitsmittel:</div>
      <ul style="font-size: 16px; line-height: 1.7; margin-top: 0;">
        <li>In den entsprechend gekennzeichneten Produktionsbereichen sind Gehörschutz und Arbeitsschutzschuhe zu tragen.</li>
        <li>Im Umgang mit Messern/Skalpellen und ähnlichen scharfen Gegenständen, sind Schnittschutzhandschuhe der Schnittschutzstufe 5 Gem. EN 388 zu tragen.</li>
        <li>Im Umgang mit heißen Stoffen, wie aufgeschmolzenen Kunststoffen bei der Düsenreinigung sind Hitzeschutz-handschuhe gem. PSA Kategorie 2, EN 388, EN 407 zu tragen.</li>
        <li>Im Umgang mit entsprechend gekennzeichneten Gefahrstoffen und Lösungsmitteln ist eine Schutzbrille und ggf. Atemschutz zu tragen.</li>
        <li>Im Allgemeinen sind alle Hinweise bezüglich Arbeitssicherheit in den Bereichen und an den Arbeitsplätzen zu befolgen.</li>
        <li>Falls situativ bedingt die vorgegebene Arbeitssicherheit nicht oder nicht ausreichend gegeben ist, darf die Tätigkeit nicht fortgeführt werden. In diesem Fall ist umgehend der Vorgesetzte und die Fachkraft für Arbeitssicherheit zu informieren.</li>
      </ul>
    </div>
    <div style="flex: 0 0 150px; display: flex; justify-content: flex-end;">
      <img src="${window.location.origin}/schutz.png" alt="Schutzsymbole" style="width: 120px; margin-left: 40px;" />
    </div>
  </div>
</div>

      </body>
    </html>
  `);

  printWindow.onload = function() {
    printWindow.print();
    printWindow.onafterprint = function() {
      printWindow.close();
    };
  };
};


import { getTranslation } from './getTranslation';
import { getTranslatedPrintData } from './printTranslationHelper';

const InstructionsList = ({ instructions, editInstruction, deleteInstruction, isAuthenticated }) => {
  const { t, i18n } = useTranslation();

  const getLocalizedInstruction = (instruction) => {
    if (!instruction) return null;

    const currentLang = i18n.language;
    if (currentLang === 'de' || !instruction.translations) {
      return instruction;
    }
    return instruction.translations[currentLang] || instruction;
  };
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [instructionToPrint, setInstructionToPrint] = useState(null);

  const toggleExpanded = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const openPrintModal = (instruction) => {
    setInstructionToPrint(instruction);
    setPrintModalOpen(true);
  };

  const closePrintModal = () => {
    setPrintModalOpen(false);
    setInstructionToPrint(null);
  };

  const handlePrint = async (printData) => {
    // Translate instruction fields before printing
    const lang = i18n.language;
    const translatedData = await getTranslatedPrintData(printData, lang);
    printInstruction(translatedData, t, translatedData.changeStatus || 'A');
  };

  const handleExport = (instruction) => {
    const jsonData = JSON.stringify(instruction, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${instruction.title}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <h3>{t('Erstellte Arbeitsanweisungen')}</h3>
        {instructions.map((instruction, index) => {
        if (!instruction) return null;
        const localizedInstruction = getLocalizedInstruction(instruction);
        if (!localizedInstruction) return null;

        return (
          <div
            key={index}
            style={{ ...instructionCardStyle.card, ...(expandedIndex === index ? instructionCardStyle.cardHover : {}) }}
            onClick={() => toggleExpanded(index)}
          >
            <h4 style={instructionCardStyle.cardTitle}>{localizedInstruction.title}</h4>
            <p>{t('createdAt')}: {instruction.creationDate}</p>
            {instruction.modificationDate && <p>{t('lastModified')}: {instruction.modificationDate}</p>}
            {expandedIndex === index && (
                <div>
                  <p>{localizedInstruction.description}</p>
                  {localizedInstruction.descriptionImages && localizedInstruction.descriptionImages.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', marginBottom: '20px' }}>
                    {localizedInstruction.descriptionImages.map((media, mediaIndex) => (
                      <div
                      key={mediaIndex}
                      style={{
                        maxWidth: '300px',
                        margin: '10px 0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '5px'
                      }}
                      >
                      {media.type === 'image' && (
                        <img
                        src={media.data}
                        alt={`${t('description')} ${t('image')} ${mediaIndex + 1}`}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                        />
                      )}
                      </div>
                    ))}
                    </div>
                  )}
                <ul>
                  {localizedInstruction.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>
                      {/* Übersetzung für Schritttext */}
                      {getTranslation(step.textKey ? step.textKey : step.text, i18n.language)}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                        {step.media && step.media.map((media, mediaIndex) => (
                          <div key={mediaIndex} style={{
                            maxWidth: '300px',
                            margin: '10px 0',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '5px'
                          }}>
                            {media.type === 'image' ? (
                              <img
                                src={media.data}
                                alt={`${t('step')} ${stepIndex + 1} ${t('media')} ${mediaIndex + 1}`}
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  display: 'block'
                                }}
                              />
                            ) : (
                              <video
                                controls
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  display: 'block'
                                }}
                              >
                                <source src={media.data} type="video/mp4" />
                                {t('videoNotSupported')}
                              </video>
                            )}
                          </div>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
                <button onClick={(e) => { e.stopPropagation(); openPrintModal(instruction); }}>{t('print')}</button>
                {isAuthenticated && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); handleExport(instruction); }}>{t('export')}</button>
                    <button onClick={(e) => { e.stopPropagation(); editInstruction(index); }}>{t('edit')}</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteInstruction(index); }}>{t('delete')}</button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
        <PrintModal
        isOpen={printModalOpen}
        onClose={closePrintModal}
        onPrint={handlePrint}
        instruction={instructionToPrint ? getLocalizedInstruction(instructionToPrint) : null}
        />
    </div>
  );
};

const categoryStyle = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  paragraph: {
    color: '#666',
    lineHeight: '1.6',
    fontSize: '16px',
  },
  backButton: {
    display: 'block',
    margin: '20px auto',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 1.3s',
  },
  backButtonHover: {
    backgroundColor: '#0056b3',
  },
};

const categoryCardStyle = {
  card: {
    display: 'inline-block',
    width: '250px',
    margin: '10px',
    padding: '20px',
    backgroundColor: '#007bff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    transition: 'transform 1.3s',
    cursor: 'pointer',
  },
  cardHover: {
    transform: 'scale(1.05)',
  },
  cardTitle: {
    fontSize: '18px',
    color: '#fff',
    marginBottom: '10px',
  },
};

const LoginButton = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button onClick={onClick} style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      padding: '5px 10px',
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
    }}>
      {t('login')}
    </button>
  );
};

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'absolute', top: '10px', right: '100px', zIndex: 1000 }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{
        padding: '5px 10px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}>
        {t('language')}
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '0',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
        }}>
          <button onClick={() => changeLanguage('de')} style={{
            width: '100%',
            padding: '10px',
            textAlign: 'left',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}>
            Deutsch
          </button>
          <button onClick={() => changeLanguage('en')} style={{
            width: '100%',
            padding: '10px',
            textAlign: 'left',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}>
            English
          </button>
          <button onClick={() => changeLanguage('pl')} style={{
            width: '100%',
            padding: '10px',
            textAlign: 'left',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}>
            Polski
          </button>
          <button onClick={() => changeLanguage('cs')} style={{
            width: '100%',
            padding: '10px',
            textAlign: 'left',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}>
            Čeština
          </button>
        </div>
      )}
    </div>
  );
};

const Engel400 = ({ isAuthenticated }) => {
  const { t } = useTranslation();
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState(null);

  // Dynamische Kategorie abhängig von der Auswahl
  const category = selectedSubSubcategory
    ? `engel400_Schweißanlagen_${selectedSubSubcategory.replace(' ', '_')}`
    : selectedSubcategory
    ? `engel400_${selectedSubcategory.replace(' ', '_')}`
    : null;

  const { addItemToDatabase, updateItemInDatabase, deleteItemFromDatabase, data: instructions } = useJsonDatabase(category);

  const [editingIndex, setEditingIndex] = useState(null);
  const navigate = useNavigate();

  const subcategories = [
    t('spritzgussmaschine'),
    t('schweißanlagen'),
    t('montageanlagen')
  ];

  const subSubcategories = [
    t('suzi'),
    t('promatik')
  ];

  const addInstruction = (instruction) => {
    addItemToDatabase(instruction);
  };

  const updateInstruction = (index, updatedInstruction) => {
    const id = instructions[index].id;
    updateItemInDatabase(id, updatedInstruction);
  };

  const deleteInstruction = (index) => {
    const id = instructions[index].id;
    deleteItemFromDatabase(id);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonData = JSON.parse(e.target.result);
        addItemToDatabase(jsonData);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={categoryStyle.container}>
      <h2 style={categoryStyle.header}>{t('engel400')}</h2>
      {!selectedSubcategory ? (
        <>
          <button
            style={categoryStyle.backButton}
            onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor}
            onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor}
            onClick={() => navigate(-1)}
          >
            {t('back')}
          </button>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {subcategories.map((subcategory) => {
              // Überprüfen, ob Arbeitsanweisungen in der Kategorie existieren
              const hasInstructions = instructions.some(i =>
                i.category === `engel400_${subcategory.replace(' ', '_')}` ||
                (subcategory === t('schweißanlagen') && i.category.startsWith(`engel400_Schweißanlagen_`))
              );

              return (
                <div
                  key={subcategory}
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    margin: '10px',
                    cursor: 'pointer',
                    width: '150px',
                    textAlign: 'center',
                    backgroundColor: hasInstructions ? '#98FB98' : '#f9f9f9', // Grüne Farbe für Arbeitsanweisungen
                  }}
                  onClick={() => setSelectedSubcategory(subcategory)}
                >
                  {subcategory}
                </div>
              );
            })}
          </div>
        </>
      ) : selectedSubcategory === t('schweißanlagen') && !selectedSubSubcategory ? (
        <>
          <button
            style={categoryStyle.backButton}
            onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor}
            onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor}
            onClick={() => setSelectedSubcategory(null)}
          >
            {t('back')}
          </button>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {subSubcategories.map((subSubcategory) => {
              // Überprüfen, ob Arbeitsanweisungen in der Sub-Sub-Kategorie existieren
              const hasInstructions = instructions.some(i =>
                i.category === `engel400_Schweißanlagen_${subSubcategory.replace(' ', '_')}`
              );

              return (
                <div
                  key={subSubcategory}
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    margin: '10px',
                    cursor: 'pointer',
                    width: '150px',
                    textAlign: 'center',
                    backgroundColor: hasInstructions ? '#98FB98' : '#f9f9f9', // Grüne Farbe für Arbeitsanweisungen
                  }}
                  onClick={() => setSelectedSubSubcategory(subSubcategory)}
                >
                  {subSubcategory}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p style={categoryStyle.paragraph}>
            {t('details')} {selectedSubSubcategory || selectedSubcategory}...
          </p>
          <button
            style={categoryStyle.backButton}
            onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor}
            onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor}
            onClick={() => {
              if (selectedSubSubcategory) {
                setSelectedSubSubcategory(null);
              } else {
                setSelectedSubcategory(null);
              }
            }}
          >
            {t('back')}
          </button>
          {isAuthenticated && !editingIndex && (
            <WorkInstructionForm addInstruction={addInstruction} isAuthenticated={isAuthenticated} />
          )}
          {editingIndex !== null ? (
            <EditInstructionForm
              instruction={instructions[editingIndex]}
              index={editingIndex}
              updateInstruction={updateInstruction}
              cancelEdit={() => setEditingIndex(null)}
            />
          ) : (
            <>
              {isAuthenticated && (
                <>
                  <label htmlFor="import-file" style={{
                    display: 'inline-block',
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginBottom: '20px',
                  }}>
                    {t('arbeitsanweisung Importieren')}
                  </label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                  />
                </>
              )}
              <InstructionsList
                instructions={instructions}
                editInstruction={setEditingIndex}
                deleteInstruction={deleteInstruction}
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

const Engel900 = ({ isAuthenticated, searchTerm = '', setSearchTerm }) => {
  const { t } = useTranslation();
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const category = selectedSubcategory ? `engel900_${selectedSubcategory.replace(' ', '_')}` : null;
  const { addItemToDatabase, updateItemInDatabase, deleteItemFromDatabase, data: instructions } = useJsonDatabase(category);
  const [editingIndex, setEditingIndex] = useState(null);
  const navigate = useNavigate();

  const subcategories = [
    t('spritzgussmaschine'),
    t('roboter'),
    t('schweißanlage'),
    t('montage'),
    t('druckprüfung')
  ];

  const addInstruction = (instruction) => {
    addItemToDatabase(instruction);
    console.log('Instructions after adding:', instructions);
  };

  const updateInstruction = (index, updatedInstruction) => {
    const id = instructions[index].id;
    updateItemInDatabase(id, updatedInstruction);
  };


  const deleteInstruction = (index) => {
    const id = instructions[index].id;
    deleteItemFromDatabase(id);
  };

  const filteredInstructions = instructions.filter(instruction => {
    if (!searchTerm) return true;

    const searchTermLower = searchTerm.toLowerCase();
    return (
      (instruction.title && instruction.title.toLowerCase().includes(searchTermLower)) ||
      (instruction.description && instruction.description.toLowerCase().includes(searchTermLower)) ||
      (instruction.steps && instruction.steps.some(step =>
        step && step.text && step.text.toLowerCase().includes(searchTermLower)
      ))
    );
  });

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonData = JSON.parse(e.target.result);
        addItemToDatabase(jsonData);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={categoryStyle.container}>
      <h2 style={categoryStyle.header}>{t('engel900')}</h2>
      {!selectedSubcategory ? (
        <>
          <button style={categoryStyle.backButton} onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor} onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor} onClick={() => navigate(-1)}>{t('back')}</button>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {subcategories.map((subcategory) => (
              <div
                key={subcategory}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '20px',
                  margin: '10px',
                  cursor: 'pointer',
                  width: '150px',
                  textAlign: 'center',
                  backgroundColor: instructions.some(i => i.category === `engel900_${subcategory.replace(' ', '_')}`) ? '#98FB98' : '#f9f9f9',
                  transition: 'background-color 1.3s'
                }}
                onClick={() => setSelectedSubcategory(subcategory)}
              >
                {subcategory}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '20px', padding: '5px', width: '100%' }}
          />
          <p style={categoryStyle.paragraph}>{t('details')} {selectedSubcategory}...</p>
          <button style={categoryStyle.backButton} onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor} onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor} onClick={() => setSelectedSubcategory(null)}>{t('back')}</button>
          {isAuthenticated && !editingIndex && <WorkInstructionForm addInstruction={addInstruction} isAuthenticated={isAuthenticated} />}
          {editingIndex !== null ? (
            <EditInstructionForm
              instruction={instructions[editingIndex]}
              index={editingIndex}
              updateInstruction={updateInstruction}
              cancelEdit={() => setEditingIndex(null)}
            />
          ) : (
            <>
              {isAuthenticated && (
                <>
                  <label htmlFor="import-file" style={{
                    display: 'inline-block',
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginBottom: '20px',
                  }}>
                    {t('arbeitsanweisung Importieren')}
                  </label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                  />
                </>
              )}
              <InstructionsList
                instructions={filteredInstructions}
                editInstruction={setEditingIndex}
                deleteInstruction={deleteInstruction}
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

const Engel1500 = ({ isAuthenticated }) => {
  const { t } = useTranslation();
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState(null);
  const category = selectedSubSubcategory
    ? `engel1500_Zelle_${selectedSubSubcategory.replace(' ', '_')}`
    : selectedSubcategory
    ? `engel1500_${selectedSubcategory.replace(' ', '_')}`
    : null;
  const { addItemToDatabase, updateItemInDatabase, deleteItemFromDatabase, data: instructions } = useJsonDatabase(category);
  const [editingIndex, setEditingIndex] = useState(null);
  const navigate = useNavigate();

  const subcategories = [
    t('spritzgussmaschine'),
    t('roboter'),
    t('zelle'),
    t('anfahranleitung')
  ];

  const subSubcategories = [
    t('schweißanlage'),
    t('rundtakttisch'),
    t('drucker'),
    t('roboter')
  ];

  const weldingSubcategories = [
    t('suzi'),
    t('bilomatik')
  ];

  const addInstruction = (instruction) => {
    addItemToDatabase(instruction);
    console.log('Instructions after adding:', instructions);
  };

  const updateInstruction = (index, updatedInstruction) => {
    const id = instructions[index].id;
    updateItemInDatabase(id, updatedInstruction);
  };


  const deleteInstruction = (index) => {
    const id = instructions[index].id;
    deleteItemFromDatabase(id);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonData = JSON.parse(e.target.result);
        addItemToDatabase(jsonData);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={categoryStyle.container}>
      <h2 style={categoryStyle.header}>{t('engel1500')}</h2>
      {!selectedSubcategory ? (
        <>
          <button style={categoryStyle.backButton} onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor} onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor} onClick={() => navigate(-1)}>{t('back')}</button>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {subcategories.map((subcategory) => (
              <div
                key={subcategory}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '20px',
                  margin: '10px',
                  cursor: 'pointer',
                  width: '150px',
                  textAlign: 'center',
                  backgroundColor: instructions.some(i => i.category === `engel1500_${subcategory.replace(' ', '_')}`) ||
                                    (subcategory === t('zelle') && instructions.some(i => i.category.startsWith(`engel1500_Zelle_`)))
                                    ? '#98FB98' : '#f9f9f9',
                  transition: 'background-color 1.3s'
                }}
                onClick={() => setSelectedSubcategory(subcategory)}
              >
                {subcategory}
              </div>
            ))}
          </div>
        </>
      ) : selectedSubcategory === t('zelle') && !selectedSubSubcategory ? (
        <>
          <button style={categoryStyle.backButton} onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor} onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor} onClick={() => setSelectedSubcategory(null)}>{t('back')}</button>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {subSubcategories.map((subSubcategory) => (
              <div
                key={subSubcategory}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '20px',
                  margin: '10px',
                  cursor: 'pointer',
                  width: '150px',
                  textAlign: 'center',
                  backgroundColor: instructions.some(i => i.category === `engel1500_Zelle_${subSubcategory.replace(' ', '_')}`) ||
                                    (subSubcategory === t('schweißanlage') && instructions.some(i => i.category.startsWith(`engel1500_Zelle_Schweißanlage_`)))
                                    ? '#98FB98' : '#f9f9f9',
                  transition: 'background-color 1.3s'
                }}
                onClick={() => setSelectedSubSubcategory(subSubcategory)}
              >
                {subSubcategory}
              </div>
            ))}
          </div>
        </>
      ) : selectedSubcategory === t('zelle') && selectedSubSubcategory === t('schweißanlage') ? (
        <>
          <button style={categoryStyle.backButton} onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor} onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor} onClick={() => setSelectedSubSubcategory(null)}>{t('back')}</button>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {weldingSubcategories.map((subcategory) => (
              <div
                key={subcategory}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '20px',
                  margin: '10px',
                  cursor: 'pointer',
                  width: '150px',
                  textAlign: 'center',
                  backgroundColor: instructions.some(i => i.category === `engel1500_Zelle_Schweißanlage_${subcategory.replace(' ', '_')}`) ? '#98FB98' : '#f9f9f9',
                  transition: 'background-color 1.3s'
                }}
                onClick={() => setSelectedSubSubcategory(subcategory)}
              >
                {subcategory}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p style={categoryStyle.paragraph}>{t('details')} {selectedSubSubcategory || selectedSubcategory}...</p>
          <button style={categoryStyle.backButton} onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor} onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor} onClick={() => {
            if (selectedSubSubcategory) {
              setSelectedSubSubcategory(null);
            } else {
              setSelectedSubcategory(null);
            }
          }}>{t('back')}</button>
          {isAuthenticated && !editingIndex && <WorkInstructionForm addInstruction={addInstruction} isAuthenticated={isAuthenticated} />}
          {editingIndex !== null ? (
            <EditInstructionForm
              instruction={instructions[editingIndex]}
              index={editingIndex}
              updateInstruction={updateInstruction}
              cancelEdit={() => setEditingIndex(null)}
            />
          ) : (
            <>
              {isAuthenticated && (
                <>
                  <label htmlFor="import-file" style={{
                    display: 'inline-block',
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginBottom: '20px',
                  }}>
                    {t('arbeitsanweisung Importieren')}
                  </label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                  />
                </>
              )}
              <InstructionsList
                instructions={instructions}
                editInstruction={setEditingIndex}
                deleteInstruction={deleteInstruction}
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

const EngelDiverse = ({ isAuthenticated }) => {
  const { t } = useTranslation();
  const category = 'engel_Diverse';
  const { addItemToDatabase, updateItemInDatabase, deleteItemFromDatabase, data: instructions } = useJsonDatabase(category);
  const [editingIndex, setEditingIndex] = useState(null);
  const navigate = useNavigate();

  const addInstruction = (instruction) => {
    addItemToDatabase(instruction);
    console.log('Instructions after adding:', instructions);
  };

  const updateInstruction = (index, updatedInstruction) => {
    const id = instructions[index].id;
    updateItemInDatabase(id, updatedInstruction);
  };


  const deleteInstruction = (index) => {
    const id = instructions[index].id;
    deleteItemFromDatabase(id);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonData = JSON.parse(e.target.result);
        addItemToDatabase(jsonData);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={categoryStyle.container}>
      <h2 style={categoryStyle.header}>{t('diverse')}</h2>
      <button style={categoryStyle.backButton} onMouseOver={(e) => e.target.style.backgroundColor = categoryStyle.backButtonHover.backgroundColor} onMouseOut={(e) => e.target.style.backgroundColor = categoryStyle.backButton.backgroundColor} onClick={() => navigate(-1)}>{t('back')}</button>
      {isAuthenticated && !editingIndex && <WorkInstructionForm addInstruction={addInstruction} isAuthenticated={isAuthenticated} />}
      {editingIndex !== null ? (
        <EditInstructionForm
          instruction={instructions[editingIndex]}
          index={editingIndex}
          updateInstruction={updateInstruction}
          cancelEdit={() => setEditingIndex(null)}
        />
      ) : (
        <>
          {isAuthenticated && (
            <>
              <label htmlFor="import-file" style={{
                display: 'inline-block',
                padding: '10px',
                backgroundColor: '#007bff',
                color: '#fff',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '20px',
              }}>
                {t('arbeitsanweisung Importieren')}
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </>
          )}
          <InstructionsList
            instructions={instructions}
            editInstruction={setEditingIndex}
            deleteInstruction={deleteInstruction}
            isAuthenticated={isAuthenticated}
          />
        </>
      )}
    </div>
  );
};

const AppComponent = () => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogin = () => {
    const enteredPassword = prompt(t('enterPassword'));
    if (enteredPassword === 'sylle90') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      alert(t('loginSuccessful'));
    } else {
      alert(t('incorrectPassword'));
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('isAuthenticated', 'false');
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated') {
        setIsAuthenticated(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div>
      <BrowserRouter>
        <Link to="/" style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <img src="/etm Logo.ico" alt="Logo" style={{ width: '80px', height: '80px' }} />
        </Link>
        <LoginButton onClick={isAuthenticated ? handleLogout : handleLogin} />
        <LanguageSwitcher />
        <div style={{ padding: '20px' }}>
          <h1 style={{ textAlign: 'center' }}>{t('title')}</h1>
          <Routes>
            <Route path="/engel400" element={<Engel400 isAuthenticated={isAuthenticated} />} />
            <Route path="/engel900" element={
              <Engel900
              isAuthenticated={isAuthenticated}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              />
            } />
            <Route path="/engel1500" element={<Engel1500 isAuthenticated={isAuthenticated} />} />
            <Route path="/engelDiverse" element={<EngelDiverse isAuthenticated={isAuthenticated} />} />
            <Route path="/" element={
              <div>
                <h2 style={categoryStyle.header}>{t('categories')}</h2>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/engel400" style={{ textDecoration: 'none' }}>
                    <div style={categoryCardStyle.card} onMouseOver={(e) => e.currentTarget.style.transform = categoryCardStyle.cardHover.transform} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                      <h3 style={categoryCardStyle.cardTitle}>{t('engel400')}</h3>
                    </div>
                  </Link>
                  <Link to="/engel900" style={{ textDecoration: 'none' }}>
                    <div style={categoryCardStyle.card} onMouseOver={(e) => e.currentTarget.style.transform = categoryCardStyle.cardHover.transform} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                      <h3 style={categoryCardStyle.cardTitle}>{t('engel900')}</h3>
                    </div>
                  </Link>
                  <Link to="/engel1500" style={{ textDecoration: 'none' }}>
                    <div style={categoryCardStyle.card} onMouseOver={(e) => e.currentTarget.style.transform = categoryCardStyle.cardHover.transform} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                      <h3 style={categoryCardStyle.cardTitle}>{t('engel1500')}</h3>
                    </div>
                  </Link>
                  <Link to="/engelDiverse" style={{ textDecoration: 'none' }}>
                    <div style={categoryCardStyle.card} onMouseOver={(e) => e.currentTarget.style.transform = categoryCardStyle.cardHover.transform} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                      <h3 style={categoryCardStyle.cardTitle}>{t('diverse')}</h3>
                    </div>
                  </Link>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
};

ReactDOM.render(<AppComponent />, document.getElementById('root'));




