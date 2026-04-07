# Plan de Implementación: Cambio de Branding a "ConfeccionArte"

Este plan detalla los pasos para renombrar el negocio de "MAISON BRUT" a "ConfeccionArte" en todo el proyecto.

## Pensamiento Senior
Como senior, antes de realizar un "buscar y reemplazar" global, he analizado lo siguiente:
1. **Consistencia de Case**: El nombre "ConfeccionArte" tiene CamelCase/PascalCase interno. Debo decidir si en lugares donde se usaba `MAISON BRUT` (todo en mayúsculas) debo usar `CONFECCIONARTE` o mantener `ConfeccionArte`. Dado que muchos elementos tienen la clase CSS `uppercase`, el resultado visual será `CONFECCIONARTE` independientemente de cómo se escriba en el código, lo cual mantiene la estética brutalista.
2. **SEO y Metadatos**: Es crucial actualizar los títulos de las páginas y etiquetas meta para que los motores de búsqueda indexen el nombre correcto.
3. **Assets y Slugs**: He verificado si existen slugs de URL como `/maison-brut`. Por ahora no parecen existir en la estructura de archivos, pero es algo a monitorear.
4. **Impacto en código**: No he encontrado variables o constantes críticas nombradas como `MAISON_BRUT`, por lo que el cambio es principalmente visual y de contenido.

## Pasos a seguir

### 1. Actualización de Componentes Core
- `src/components/NavBar.astro`: Cambiar el texto del logo.

### 2. Actualización de Páginas y Layouts
- `src/pages/index.astro`: Actualizar el título del layout.
- `src/pages/catalogo.astro`: Actualizar el título del layout.
- `src/pages/producto.astro`: Actualizar el título dinámico del layout.

### 3. Actualización de Assets de Referencia (opcional pero recomendado)
- `stitch_assets/code/*.html`: Aunque son archivos de referencia, es bueno mantenerlos sincronizados si se usan para futuras generaciones de código.

### 4. Verificación Final
- Ejecutar un grep final para asegurar que no queden referencias olvidadas.
