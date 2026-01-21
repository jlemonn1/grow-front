export interface ImageUploadResponse {
  filename: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

/**
 * Sube una imagen al servidor
 */
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8080/api/v1/images/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al subir imagen' }));
    throw new Error(error.message || 'Error al subir imagen');
  }

  return response.json();
}
