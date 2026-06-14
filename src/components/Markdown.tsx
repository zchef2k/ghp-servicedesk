import { marked } from 'marked';

export default function Markdown({ text }: { text: string }) {
  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: marked.parse(text || '*No content.*', { async: false }) }}
    />
  );
}
