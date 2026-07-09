// Protocole des pièces jointes de la messagerie.
//
// Le contenu d'un message reste une simple chaîne (compatible avec le backend
// et le WebSocket existants) : les fichiers y sont référencés par des
// marqueurs, un par ligne, ajoutés après le texte :
//   image : ![image](url)
//   pdf   : ![file|<nom encodé URI>|<taille en octets>](url)
// Le marqueur image est le même que celui des Actualités.

export type ChatAttachmentKind = 'image' | 'pdf';

export interface ChatAttachment {
  kind: ChatAttachmentKind;
  url: string;
  name: string;
  size: number;
}

export interface UploadedChatFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

const MARKER_RE = /!\[(image|file\|[^\]\n]*)\]\(([^)\s]+)\)/g;

export function buildMessageContent(text: string, files: UploadedChatFile[]): string {
  const markers = files.map((file) =>
    file.mimeType.startsWith('image/')
      ? `![image](${file.url})`
      : `![file|${encodeURIComponent(file.name)}|${file.size}](${file.url})`,
  );
  return [text.trim(), ...markers].filter(Boolean).join('\n');
}

export function parseMessageContent(content: string): {
  text: string;
  attachments: ChatAttachment[];
} {
  const attachments: ChatAttachment[] = [];
  const text = (content ?? '')
    .replace(MARKER_RE, (_match, meta: string, url: string) => {
      if (meta === 'image') {
        attachments.push({ kind: 'image', url, name: '', size: 0 });
      } else {
        const [, rawName = '', rawSize = ''] = meta.split('|');
        let name = rawName;
        try {
          name = decodeURIComponent(rawName);
        } catch {
          // nom illisible : on garde la valeur brute
        }
        attachments.push({ kind: 'pdf', url, name, size: Number(rawSize) || 0 });
      }
      return '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text, attachments };
}

// Aperçu court pour la liste des conversations : le texte s'il existe,
// sinon un libellé décrivant la première pièce jointe.
export function formatMessagePreview(
  content: string,
  labels: { image: string; file: string },
): string {
  const { text, attachments } = parseMessageContent(content);
  if (text) return text;
  const first = attachments[0];
  if (!first) return '';
  if (first.kind === 'image') return labels.image;
  return first.name || labels.file;
}
