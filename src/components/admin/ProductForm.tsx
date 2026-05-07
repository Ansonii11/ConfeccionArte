import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  slug: string;
  category_id: string;
  featured: boolean;
  is_customizable: boolean;
  status: string;
}

interface VariantData {
  id?: string;
  size: string;
  stock: number;
}

interface ImageData {
  id: string;
  storage_path: string;
  is_primary: boolean;
}

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
  isPrimary: boolean;
}

interface Props {
  categories: any[];
  initialData?: {
    product: ProductFormData;
    variants: VariantData[];
    images: ImageData[];
  };
}

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const MAX_IMAGES = 4;

export default function ProductForm({ categories, initialData }: Props) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (initialData) return initialData.product;
    return {
      name: "",
      description: "",
      price: 0,
      sku: "",
      slug: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      featured: false,
      is_customizable: false,
      status: "draft",
    };
  });

  const [variants, setVariants] = useState<VariantData[]>(
    initialData?.variants?.length ? initialData.variants : [{ size: "M", stock: 10 }]
  );
  
  const [existingImages, setExistingImages] = useState<ImageData[]>(initialData?.images || []);
  const [imagesToDelete, setImagesToDelete] = useState<ImageData[]>([]);
  const [newFiles, setNewFiles] = useState<FileWithPreview[]>([]);

  // Cleanup previews to avoid memory leaks
  useEffect(() => {
    return () => {
      newFiles.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [newFiles]);

  const getPublicImageUrl = (path: string) => {
    return `${import.meta.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files);
    const validFiles: FileWithPreview[] = [];
    let sizeError = false;
    let limitReached = false;

    selectedFiles.forEach(file => {
      const totalCount = existingImages.length + newFiles.length + validFiles.length;
      if (totalCount >= MAX_IMAGES) {
        limitReached = true;
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        sizeError = true;
        return;
      }

      if (!file.type.startsWith('image/')) return;

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
        isPrimary: false
      });
    });

    if (sizeError) {
      setError(`Calidad excedida: Las imágenes deben ser menores a 500KB para optimizar el archivo.`);
    } else if (limitReached) {
      setError(`Archivo lleno: Solo se permiten un máximo de ${MAX_IMAGES} capturas (Portada + 3 extras).`);
    }

    if (sizeError || limitReached) {
      setTimeout(() => setError(null), 5000);
    }

    setNewFiles(prev => {
      // If no image is primary yet (existing or new), make the first valid one primary
      const hasPrimary = existingImages.some(img => img.is_primary) || prev.some(f => f.isPrimary);
      if (!hasPrimary && validFiles.length > 0) {
        validFiles[0].isPrimary = true;
      }
      return [...prev, ...validFiles];
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveNewFile = (id: string) => {
    setNewFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      // If the removed one was primary, assign to first available
      if (prev.find(f => f.id === id)?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleRemoveExistingImage = (img: ImageData) => {
    setExistingImages(prev => {
      const filtered = prev.filter(i => i.id !== img.id);
      // If removed was primary and there are still existing images, make the first one primary
      if (img.is_primary && filtered.length > 0) {
        filtered[0].is_primary = true;
      } else if (img.is_primary && newFiles.length > 0) {
        // If no existing left, make the first new file primary
        setNewFiles(nf => {
          const updated = [...nf];
          if (updated.length > 0) updated[0].isPrimary = true;
          return updated;
        });
      }
      return filtered;
    });
    setImagesToDelete(prev => [...prev, img]);
  };

  const setPrimary = (type: 'existing' | 'new', id: string) => {
    setExistingImages(prev => prev.map(img => ({
      ...img,
      is_primary: type === 'existing' && img.id === id
    })));
    setNewFiles(prev => prev.map(f => ({
      ...f,
      isPrimary: type === 'new' && f.id === id
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let productId = formData.id;

      // 1. Create or Update Product
      if (isEditing && productId) {
        const { error: updateError } = await supabase
          .from("products")
          .update({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            sku: formData.sku,
            slug: formData.slug,
            category_id: formData.category_id,
            featured: formData.featured,
            is_customizable: formData.is_customizable,
            status: formData.status
          })
          .eq("id", productId);
        if (updateError) throw updateError;
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert([{
            name: formData.name,
            description: formData.description,
            price: formData.price,
            sku: formData.sku,
            slug: formData.slug,
            category_id: formData.category_id,
            featured: formData.featured,
            is_customizable: formData.is_customizable,
            status: formData.status
          }])
          .select()
          .single();
        if (insertError) throw insertError;
        productId = newProduct.id;
      }

      // 2. Handle Variants (Delete and re-insert for simplicity in editing)
      if (isEditing) {
        await supabase.from("product_variants").delete().eq("product_id", productId!);
      }
      
      if (variants.length > 0) {
        const variantsToInsert = variants.map((v) => ({
          product_id: productId,
          size: v.size,
          stock: v.stock,
        }));
        const { error: variantError } = await supabase
          .from("product_variants")
          .insert(variantsToInsert);
        if (variantError) throw variantError;
      }

      // 3. Delete Images marked for deletion
      if (imagesToDelete.length > 0) {
        const pathsToDelete = imagesToDelete.map(img => img.storage_path);
        await supabase.storage.from("products").remove(pathsToDelete);
        const idsToDelete = imagesToDelete.map(img => img.id);
        await supabase.from("product_images").delete().in("id", idsToDelete);
      }

      // 4. Update existing images (primary status might have changed)
      if (isEditing) {
        for (const img of existingImages) {
          await supabase.from("product_images")
            .update({ is_primary: img.is_primary })
            .eq("id", img.id);
        }
      }

      // 5. Upload New Images
      for (const item of newFiles) {
        const fileExt = item.file.name.split('.').pop();
        const filePath = `${productId}/${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, item.file);

        if (uploadError) throw uploadError;

        await supabase.from("product_images").insert({
          product_id: productId,
          storage_path: filePath,
          is_primary: item.isPrimary,
        });
      }

      setSuccess(true);
      if (!isEditing) {
        setFormData({ ...formData, name: "", slug: "", sku: "", description: "" });
        setVariants([{ size: "M", stock: 10 }]);
        setNewFiles([]);
        setExistingImages([]);
      } else {
        setTimeout(() => window.location.reload(), 1500);
      }

    } catch (err: any) {
      setError(err.message || "Error al procesar el producto");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div 
      className="product-form-container"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="error-alert"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="success-alert"
          >
            {isEditing ? "Pieza actualizada en el archivo." : "Pieza creada exitosamente."}
          </motion.div>
        )}
      </AnimatePresence>
      
      <form onSubmit={handleSubmit} className="react-form">
        
        {/* Basic Info */}
        <motion.div className="form-section" variants={itemVariants}>
          <div className="section-header">
            <span className="section-number">01</span>
            <h3>Identidad de la Pieza</h3>
          </div>
          
          <div className="form-group">
            <label>Nombre de la Pieza</label>
            <input
              type="text"
              required
              placeholder="Ej. Abrigo de Lana Alpaca"
              value={formData.name}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData,
                  name: val,
                  slug: !isEditing ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : formData.slug,
                });
              }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Slug de Archivo</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>SKU / Referencia</label>
              <input
                type="text"
                placeholder="REF-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Inversión (Precio)</label>
              <div className="input-with-symbol">
                <span className="symbol">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Colección / Categoría</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Narrativa / Descripción</label>
            <textarea
              rows={4}
              placeholder="Describe la historia y materiales de esta pieza..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </motion.div>

        {/* Configuration */}
        <motion.div className="form-section" variants={itemVariants}>
          <div className="section-header">
            <span className="section-number">02</span>
            <h3>Estado y Exhibición</h3>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Estado en el Catálogo</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="draft">Borrador (Privado)</option>
                <option value="active">Activo (Exhibición Pública)</option>
                <option value="archived">Archivado (Histórico)</option>
              </select>
            </div>
          </div>

          <div className="checkboxes-group">
            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              />
              <span className="checkmark"></span>
              Pieza Destacada en Portada
            </label>
            
            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={formData.is_customizable}
                onChange={(e) => setFormData({ ...formData, is_customizable: e.target.checked })}
              />
              <span className="checkmark"></span>
              Disponible para Atelier a Medida
            </label>
          </div>
        </motion.div>

        {/* Variants */}
        <motion.div className="form-section" variants={itemVariants}>
          <div className="section-header">
            <span className="section-number">03</span>
            <h3>Dimensiones y Disponibilidad</h3>
          </div>
          
          {variants.map((variant, index) => (
            <div key={index} className="variant-row">
              <div className="form-group">
                <label>Talla / Medida</label>
                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => {
                    const newV = [...variants];
                    newV[index].size = e.target.value;
                    setVariants(newV);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Unidades</label>
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) => {
                    const newV = [...variants];
                    newV[index].stock = parseInt(e.target.value);
                    setVariants(newV);
                  }}
                />
              </div>
              {variants.length > 1 && (
                <button 
                  type="button" 
                  className="btn-remove" 
                  onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              )}
            </div>
          ))}
          
          <button 
            type="button" 
            className="btn-add-variant"
            onClick={() => setVariants([...variants, { size: "Única", stock: 1 }])}
          >
            + Añadir Dimensión
          </button>
        </motion.div>

        {/* Images */}
        <motion.div className="form-section" variants={itemVariants}>
          <div className="section-header">
            <span className="section-number">04</span>
            <h3>Galería de Curaduría</h3>
          </div>

          <div className="gallery-instructions">
            <p>Selecciona la portada (estrella) y hasta 3 imágenes extra. Máximo 500KB por archivo.</p>
          </div>
          
          <div className="image-grid">
            <AnimatePresence>
              {/* Existing Images */}
              {existingImages.map(img => (
                <motion.div 
                  key={img.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className={`image-card ${img.is_primary ? 'primary-active' : ''}`}
                >
                  <img src={getPublicImageUrl(img.storage_path)} alt="Piece" />
                  <div className="card-actions">
                    <button 
                      type="button" 
                      className={`btn-action-star ${img.is_primary ? 'active' : ''}`}
                      onClick={() => setPrimary('existing', img.id)}
                      title="Establecer como Portada"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={img.is_primary ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    <button type="button" className="btn-action-delete" onClick={() => handleRemoveExistingImage(img)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                  {img.is_primary && <span className="primary-label">Portada</span>}
                </motion.div>
              ))}

              {/* New Files */}
              {newFiles.map(item => (
                <motion.div 
                  key={item.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className={`image-card new-file ${item.isPrimary ? 'primary-active' : ''}`}
                >
                  <img src={item.preview} alt="New upload" />
                  <div className="card-actions">
                    <button 
                      type="button" 
                      className={`btn-action-star ${item.isPrimary ? 'active' : ''}`}
                      onClick={() => setPrimary('new', item.id)}
                      title="Establecer como Portada"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={item.isPrimary ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    <button type="button" className="btn-action-delete" onClick={() => handleRemoveNewFile(item.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                  {item.isPrimary && <span className="primary-label">Portada (Pendiente)</span>}
                </motion.div>
              ))}
            </AnimatePresence>

            <button 
              type="button" 
              className="add-image-card"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>Añadir Captura</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </button>
          </div>
        </motion.div>

        <motion.button 
          type="submit" 
          className="btn-primary form-submit" 
          disabled={loading}
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {loading ? "Procesando Archivo..." : isEditing ? "Confirmar Cambios en la Pieza" : "Registrar Nueva Pieza en Colección"}
        </motion.button>
      </form>
      
      <style>{`
        .product-form-container {
          max-width: 900px;
          margin: 0 auto;
          padding-top: 2rem;
        }
        .react-form {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }
        .form-section {
          padding: 3rem;
          border: 1px solid var(--panel-border);
          background: var(--bg-dark);
          margin-bottom: 2rem;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }
        .section-number {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          color: var(--primary);
          opacity: 0.5;
        }
        .form-section h3 {
          margin: 0;
          color: var(--text-main);
          font-family: var(--font-heading);
          font-size: 1.5rem;
          letter-spacing: 0.02em;
        }
        .form-row {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }
        .form-row > * {
          flex: 1;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .form-group label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--primary);
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 1.25rem;
          background: transparent;
          border: 1px solid var(--panel-border);
          border-radius: 0;
          color: var(--text-main);
          font-family: var(--font-mono);
          font-size: 0.9rem;
          transition: none;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          background: var(--text-main);
          color: var(--bg-dark);
        }

        .input-with-symbol {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-with-symbol .symbol {
          position: absolute;
          left: 1.25rem;
          color: var(--text-muted);
        }
        .input-with-symbol input {
          padding-left: 2.5rem;
          width: 100%;
        }
        
        .checkboxes-group {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .custom-checkbox {
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          color: var(--text-main);
          font-size: 0.9rem;
          user-select: none;
        }
        .custom-checkbox input {
          display: none;
        }
        .checkmark {
          width: 20px;
          height: 20px;
          border: 1px solid var(--panel-border);
          border-radius: 0;
          position: relative;
          transition: none;
        }
        .custom-checkbox input:checked + .checkmark {
          background: var(--primary);
          border-color: var(--primary);
        }
        .custom-checkbox input:checked + .checkmark::after {
          content: '';
          position: absolute;
          left: 6px;
          top: 2px;
          width: 6px;
          height: 12px;
          border: solid var(--bg-dark);
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .variant-row {
          display: flex;
          gap: 1.5rem;
          align-items: flex-end;
          margin-bottom: 1.5rem;
        }
        .variant-row .form-group {
          margin-bottom: 0;
          flex: 1;
        }
        .btn-remove {
          width: 48px;
          height: 48px;
          background: transparent;
          color: var(--danger);
          border: 1px solid var(--danger);
          border-radius: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: none;
        }
        .btn-remove:hover {
          background: var(--danger);
          color: var(--text-main);
        }
        .btn-add-variant {
          width: 100%;
          padding: 1rem;
          background: transparent;
          border: 1px dashed var(--panel-border);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          border-radius: 0;
          cursor: pointer;
          transition: none;
          margin-top: 1rem;
        }
        .btn-add-variant:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(202, 138, 4, 0.03);
        }

        .gallery-instructions {
          margin-bottom: 2rem;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-style: italic;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1.5rem;
        }
        .image-card {
          position: relative;
          aspect-ratio: 4/5;
          border-radius: 0;
          overflow: hidden;
          border: 1px solid var(--panel-border);
          background: transparent;
          transition: none;
        }
        .image-card.primary-active {
          border-color: var(--primary);
        }
        .image-card.new-file {
          border-style: dashed;
        }
        .image-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: none;
        }
        .image-card:hover img {
          transform: scale(1.05);
        }

        .card-actions {
          position: absolute;
          inset: 0;
          background: transparent;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 1rem;
          padding-bottom: 1rem;
          opacity: 0;
          transition: none;
        }
        .image-card:hover .card-actions {
          opacity: 1;
          background: rgba(34, 16, 16, 0.8);
        }

        .btn-action-star, .btn-action-delete {
          width: 36px;
          height: 36px;
          border-radius: 0;
          border: 1px solid var(--panel-border);
          background: var(--bg-dark);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: none;
        }
        .btn-action-star.active {
          color: var(--primary);
          border-color: var(--primary);
          background: rgba(202, 138, 4, 0.1);
        }
        .btn-action-star:hover {
          transform: scale(1.1);
          border-color: var(--primary);
        }
        .btn-action-delete:hover {
          transform: scale(1.1);
          background: var(--danger);
          border-color: var(--danger);
        }

        .primary-label {
          position: absolute;
          top: 10px;
          left: 10px;
          background: var(--primary);
          color: var(--text-main);
          font-size: 0.6rem;
          font-family: var(--font-mono);
          font-weight: 700;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 0;
          letter-spacing: 0.05em;
        }

        .add-image-card {
          aspect-ratio: 4/5;
          border: 1px dashed var(--panel-border);
          background: transparent;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          cursor: pointer;
          transition: none;
          color: var(--text-muted);
        }
        .add-image-card:hover {
          background: rgba(202, 138, 4, 0.05);
          border-color: var(--primary);
          color: var(--primary);
        }
        .add-image-card span {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .hidden { display: none; }

        .form-submit {
          font-size: 1rem;
          padding: 1.5rem;
          margin-top: 2rem;
          margin-bottom: 5rem;
        }

        .error-alert { background: transparent; color: var(--primary); font-family: var(--font-mono); padding: 1.5rem; border-radius: 0; margin-bottom: 2rem; border: 1px solid var(--primary); text-align: center; font-size: 0.9rem; }
        .success-alert { background: transparent; color: var(--text-main); font-family: var(--font-mono); padding: 1.5rem; border-radius: 0; margin-bottom: 2rem; border: 1px solid var(--text-main); text-align: center; font-size: 0.9rem; }
      `}</style>
    </motion.div>
  );
}

