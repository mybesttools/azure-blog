import { readFile } from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';

export default async function AnchorElementsLabPage() {
  const filePath = path.join(
    process.cwd(),
    'src',
    'app',
    'lab',
    'anchor-elements',
    'solution.html'
  );

  try {
    const html = await readFile(filePath, 'utf8');
    const srcDoc = `<!doctype html><html><head><meta charset="utf-8" /></head><body>${html}</body></html>`;

    return (
      <div className="min-h-screen bg-white">
        <iframe
          title="Lab: Anchor Elements"
          srcDoc={srcDoc}
          className="h-screen w-full border-0"
        />
      </div>
    );
  } catch {
    notFound();
  }
}
