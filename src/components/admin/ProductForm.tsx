import React, { useState } from "react";
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

interface Props {
  categories: any[];
  initialData?: {
    product: ProductFormData;
    variants: VariantData[];
    images: ImageData[];
  };
}

export default function ProductForm({ categories, initialData }: Props) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
  const [files, setFiles] = useState<File[]>([]);

  const getPublicImageUrl = (path: string) => {
    return `${import.meta.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`;
  };

  const handleRemoveExistingImage = (img: ImageData) => {
    setExistingImages(prev => prev.filter(i => i.id !== img.id));
    setImagesToDelete(prev => [...prev, img]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let productId = formData.id;

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

      if (imagesToDelete.length > 0) {
        const pathsToDelete = imagesToDelete.map(img => img.storage_path);
        await supabase.storage.from("products").remove(pathsToDelete);
        const idsToDelete = imagesToDelete.map(img => img.id);
        const { error: dbImgError } = await supabase.from("product_images").delete().in("id", idsToDelete);
        if (dbImgError) throw dbImgError;
      }

      if (files.length > 0) {
        const hasPrimary = existingImages.some(i => i.is_primary) && !imagesToDelete.some(i => i.is_primary);

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop();
          const filePath = `${productId}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("products")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          await supabase.from("product_images").insert({
            product_id: productId,
            storage_path: filePath,
            is_primary: !hasPrimary && i === 0,
          });
        }
      }

      setSuccess(true);
      if (!isEditing) {
        setFormData({ ...formData, name: "", slug: "", sku: "" });
        setVariants([{ size: "M", stock: 10 }]);
        setFiles([]);
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
        <motion.div className="form-section glass-panel" variants={itemVariants}>
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
        <motion.div className="form-section glass-panel" variants={itemVariants}>
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
        <motion.div className="form-section glass-panel" variants={itemVariants}>
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
        <motion.div className="form-section glass-panel" variants={itemVariants}>
          <div className="section-header">
            <span className="section-number">04</span>
            <h3>Registro Visual</h3>
          </div>
          
          {existingImages.length > 0 && (
            <div className="existing-images">
              <p className="sub-label">Galería Actual</p>
              <div className="image-grid">
                {existingImages.map(img => (
                  <div key={img.id} className="image-card">
                    <img src={getPublicImageUrl(img.storage_path)} alt="Piece" />
                    {img.is_primary && <span className="primary-tag">Principal</span>}
                    <button type="button" className="remove-img-overlay" onClick={() => handleRemoveExistingImage(img)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="upload-zone">
            <label className="upload-label">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden-input"
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(Array.from(e.target.files));
                  }
                }}
              />
              <div className="upload-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span>{files.length > 0 ? `${files.length} archivos seleccionados` : "Arrastra o selecciona nuevas capturas"}</span>
              </div>
            </label>
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
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--panel-border);
          border-radius: 2px;
          color: #fff;
          font-family: var(--font-body);
          font-size: 0.9rem;
          transition: all 0.4s ease;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(0,0,0,0.4);
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
          border-radius: 2px;
          position: relative;
          transition: all 0.3s ease;
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
          background: rgba(239, 68, 68, 0.05);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.1);
          border-radius: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .btn-remove:hover {
          background: var(--danger);
          color: white;
        }
        .btn-add-variant {
          width: 100%;
          padding: 1rem;
          background: rgba(255,255,255,0.02);
          border: 1px dashed var(--panel-border);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.75rem;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }
        .btn-add-variant:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(202, 138, 4, 0.03);
        }

        .existing-images {
          margin-bottom: 2.5rem;
        }
        .sub-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1.5rem;
        }
        .image-card {
          position: relative;
          aspect-ratio: 4/5;
          border-radius: 2px;
          overflow: hidden;
          border: 1px solid var(--panel-border);
        }
        .image-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .primary-tag {
          position: absolute;
          top: 8px;
          left: 8px;
          background: var(--primary);
          color: var(--bg-dark);
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 2px;
        }
        .remove-img-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .image-card:hover .remove-img-overlay {
          opacity: 1;
        }

        .upload-zone {
          margin-top: 1rem;
        }
        .upload-label {
          display: block;
          border: 1px dashed var(--panel-border);
          padding: 3rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.4s ease;
        }
        .upload-label:hover {
          border-color: var(--primary);
          background: rgba(202, 138, 4, 0.03);
        }
        .hidden-input {
          display: none;
        }
        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .upload-content span {
          font-size: 0.85rem;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .form-submit {
          font-size: 1rem;
          padding: 1.5rem;
          margin-top: 2rem;
          margin-bottom: 5rem;
        }

        .error-alert { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 1.5rem; border-radius: 4px; margin-bottom: 2rem; border: 1px solid rgba(239, 68, 68, 0.2); text-align: center; font-size: 0.9rem; }
        .success-alert { background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 1.5rem; border-radius: 4px; margin-bottom: 2rem; border: 1px solid rgba(34, 197, 94, 0.2); text-align: center; font-size: 0.9rem; }
      `}</style>
    </motion.div>
  );
}

