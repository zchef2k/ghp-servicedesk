import { useRef, useState, type ClipboardEvent, type DragEvent, type Dispatch, type SetStateAction } from 'react';
import { uploadImage } from './images';

/** Adds paste/drop-to-upload image support to a Markdown textarea. */
export function useImagePaste(setValue: Dispatch<SetStateAction<string>>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(0);

  function insertFiles(files: File[]) {
    for (const file of files) {
      const pos = textareaRef.current?.selectionStart ?? 0;
      const placeholder = `![Uploading ${file.name}…]()`;
      setValue((v) => v.slice(0, pos) + placeholder + v.slice(pos));
      setUploading((n) => n + 1);
      uploadImage(file)
        .then((src) => setValue((v) => v.replace(placeholder, `![${file.name}](${src})`)))
        .catch(() => setValue((v) => v.replace(placeholder, '')))
        .finally(() => setUploading((n) => n - 1));
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(e.clipboardData.items)
      .map((item) => item.getAsFile())
      .filter((f): f is File => !!f && f.type.startsWith('image/'));
    if (files.length) {
      e.preventDefault();
      insertFiles(files);
    }
  }

  function onDrop(e: DragEvent<HTMLTextAreaElement>) {
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length) {
      e.preventDefault();
      insertFiles(files);
    }
  }

  return { textareaRef, onPaste, onDrop, uploading };
}
