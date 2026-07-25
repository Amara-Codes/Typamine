import { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";

// Stesso modulo/opzioni già usati altrove nel progetto per la compressione
// lato client (vedi components/admin/common/content-modules/shared.tsx e
// UserForm.tsx) — senza, un JPG/PNG diretto da fotocamera può superare
// facilmente il body-size limit della Server Action (1MB di default in
// Next.js) e far fallire il salvataggio.
const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

// Un file appena scelto in un <input type="file"> non è visibile finché non
// si salva e si ricarica: qui costruiamo una blob URL locale (object URL) per
// mostrare subito l'anteprima di quello che si sta per caricare, invece di
// lasciare l'utente a fidarsi ciecamente del nome del file selezionato.
export function useFilePreview() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrlState] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setPreviewUrl = (url: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrlState(url);
  };

  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0] || null;
    if (!raw) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setIsCompressing(true);
    try {
      const compressed = await imageCompression(raw, IMAGE_COMPRESSION_OPTIONS);
      const compressedFile = new File([compressed], raw.name, { type: raw.type });

      // Sostituisce il file dentro l'<input> nativo: gli input con `name`
      // vengono letti direttamente da new FormData(form), quindi devono
      // portare i byte compressi anche loro, non solo lo stato React.
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressedFile);
      if (inputRef.current) {
        inputRef.current.files = dataTransfer.files;
      }

      setFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("Image compression failed, using original file:", error);
      setFile(raw);
      setPreviewUrl(URL.createObjectURL(raw));
    } finally {
      setIsCompressing(false);
    }
  };

  const clear = () => {
    setFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  return { file, previewUrl, isCompressing, inputRef, onSelect, clear };
}

export default useFilePreview;
