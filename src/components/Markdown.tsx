import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import { isRepoAsset, resolveImage } from '../lib/images';

/** Renders Markdown text, resolving `repo-asset:` image references to inline data URIs. */
export default function Markdown({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const imgs = ref.current?.querySelectorAll('img') ?? [];
    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      if (!src || !isRepoAsset(src)) return;
      img.style.visibility = 'hidden';
      resolveImage(src)
        .then((dataUrl) => {
          img.setAttribute('src', dataUrl);
          img.style.visibility = 'visible';
        })
        .catch(() => {
          img.style.visibility = 'visible';
        });
    });
  }, [text]);

  return (
    <div
      ref={ref}
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: marked.parse(text || '*No content.*', { async: false }) }}
    />
  );
}
