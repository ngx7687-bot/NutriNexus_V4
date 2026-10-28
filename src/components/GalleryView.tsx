import React, { useState, useEffect } from 'react';

interface GalleryItem {
  id: string;
  title: string;
  beforeImage: string;
  afterImage: string;
  beforeDate: string;
  afterDate: string;
  notes: string;
  dateAdded: string;
}

export default function GalleryView() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('nutrinexus_gallery');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [beforeDate, setBeforeDate] = useState('');
  const [afterDate, setAfterDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('nutrinexus_gallery', JSON.stringify(galleryItems));
  }, [galleryItems]);

  // Image compressor helper for fast uploads
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBeforeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setBeforeImage(compressed);
    }
  };

  const handleAfterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setAfterImage(compressed);
    }
  };

  const handleSaveTransformation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !beforeImage || !afterImage) {
      setError('Please provide a title and upload both Before and After photos.');
      return;
    }

    const newItem: GalleryItem = {
      id: Date.now().toString(),
      title: title.trim(),
      beforeImage,
      afterImage,
      beforeDate: beforeDate || 'Start',
      afterDate: afterDate || 'Present',
      notes: notes.trim(),
      dateAdded: new Date().toLocaleDateString()
    };

    setGalleryItems([newItem, ...galleryItems]);
    
    // Reset form
    setTitle('');
    setBeforeImage(null);
    setAfterImage(null);
    setBeforeDate('');
    setAfterDate('');
    setNotes('');
    setError('');
    setIsAdding(false);
  };

  const handleDeleteItem = (id: string) => {
    const updated = galleryItems.filter(item => item.id !== id);
    setGalleryItems(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24 md:pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Transformation Gallery</h2>
          <p className="text-sm text-slate-500">Track your visual progress and celebrate your health milestones.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
          >
            + Add Before & After
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSaveTransformation} className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">New Transformation Record</h3>
          
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Milestone / Title *</label>
            <input
              type="text"
              placeholder="e.g. 3-Month Glycemic & Weight Journey"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Photo Upload */}
            <div className="border-2 border-dashed border-slate-300 p-4 rounded-xl text-center space-y-2 bg-slate-50">
              <span className="text-xs font-bold text-slate-600 uppercase">Before Photo *</span>
              {beforeImage ? (
                <img src={beforeImage} alt="Before preview" className="h-40 mx-auto rounded-lg object-cover shadow-xs" />
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Upload Before Photo</div>
              )}
              <input type="file" accept="image/*" onChange={handleBeforeUpload} className="w-full text-xs text-slate-500" required />
              <input type="text" placeholder="Date (e.g. Jan 2026)" value={beforeDate} onChange={(e) => setBeforeDate(e.target.value)} className="w-full p-2 text-xs border rounded" />
            </div>

            {/* After Photo Upload */}
            <div className="border-2 border-dashed border-emerald-300 p-4 rounded-xl text-center space-y-2 bg-emerald-50/50">
              <span className="text-xs font-bold text-emerald-700 uppercase">After Photo *</span>
              {afterImage ? (
                <img src={afterImage} alt="After preview" className="h-40 mx-auto rounded-lg object-cover shadow-xs" />
              ) : (
                <div className="h-40 flex items-center justify-center text-emerald-400 text-sm">Upload After Photo</div>
              )}
              <input type="file" accept="image/*" onChange={handleAfterUpload} className="w-full text-xs text-slate-500" required />
              <input type="text" placeholder="Date (e.g. Apr 2026)" value={afterDate} onChange={(e) => setAfterDate(e.target.value)} className="w-full p-2 text-xs border rounded" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notes & Achievements</label>
            <textarea
              placeholder="e.g. HbA1c improved from 13% to 6.8%, lost 6kg, feeling more energetic!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm"
            >
              Save Transformation
            </button>
          </div>
        </form>
      )}

      {/* Gallery Feed */}
      {galleryItems.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-slate-100 space-y-3">
          <div className="w-14 h-14 mx-auto bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-2xl">📸</div>
          <h3 className="font-bold text-slate-800 text-lg">No transformation records yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Click "+ Add Before & After" to record and compare your fitness and health milestones.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {galleryItems.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-slate-400">Added on {item.dateAdded}</span>
                  <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition"
                >
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center bg-slate-50 p-4 rounded-xl border">
                  <span className="text-xs font-bold text-slate-500 block mb-2">BEFORE ({item.beforeDate})</span>
                  <img src={item.beforeImage} alt="Before" className="max-h-64 mx-auto rounded-lg object-cover shadow-xs" />
                </div>
                <div className="text-center bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-700 block mb-2">AFTER ({item.afterDate})</span>
                  <img src={item.afterImage} alt="After" className="max-h-64 mx-auto rounded-lg object-cover shadow-xs" />
                </div>
              </div>

              {item.notes && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border">
                  <strong className="text-slate-800">Milestone Notes:</strong> {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
