/**
 * Utilidad para convertir SVG strings a archivos de imagen (PNG)
 * para poder subirlos al backend
 */

/**
 * Convierte un SVG string a un archivo PNG
 * @param svgString String con el contenido SVG
 * @param filename Nombre del archivo resultante
 * @param width Ancho de la imagen resultante (por defecto 800)
 * @param height Alto de la imagen resultante (por defecto 400)
 * @returns Promise que resuelve con un objeto File
 */
export async function svgToFile(
  svgString: string,
  filename: string = 'logo.png',
  width: number = 800,
  height: number = 400
): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // Crear un blob del SVG
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Crear una imagen para cargar el SVG
      const img = new Image();
      
      img.onload = () => {
        try {
          // Crear un canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          // Dibujar la imagen en el canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir canvas a blob
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              
              if (!blob) {
                reject(new Error('Error al convertir canvas a blob'));
                return;
              }

              // Crear un File desde el blob
              const file = new File([blob], filename, { type: 'image/png' });
              resolve(file);
            },
            'image/png',
            1.0 // Calidad máxima
          );
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar la imagen SVG'));
      };

      // Cargar el SVG
      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convierte un SVG string a una URL data (data:image/png;base64,...)
 * Útil para previews sin necesidad de crear un archivo
 * @param svgString String con el contenido SVG
 * @param width Ancho de la imagen resultante (por defecto 800)
 * @param height Alto de la imagen resultante (por defecto 400)
 * @returns Promise que resuelve con una URL data
 */
export async function svgToDataURL(
  svgString: string,
  width: number = 800,
  height: number = 400
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataURL = canvas.toDataURL('image/png', 1.0);
          
          URL.revokeObjectURL(url);
          resolve(dataURL);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar la imagen SVG'));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}
