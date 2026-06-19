// Curated public-domain sacred art for session headers. Sessions store either an
// art key from this library, or a full custom image URL. All works are public
// domain (artists died > 100 years ago).

export interface ArtPiece {
  key: string;
  src: string;
  title: string;
  artist: string;
}

export const ART_LIBRARY: ArtPiece[] = [
  { key: 'sermon-on-the-mount', src: '/art/sermon-on-the-mount.jpg', title: 'The Sermon on the Mount', artist: 'Carl Bloch' },
  { key: 'christ-hofmann', src: '/art/christ-hofmann.jpg', title: 'Christ', artist: 'Heinrich Hofmann' },
  { key: 'christ-and-child', src: '/art/christ-and-child.jpg', title: 'Christ and the Child', artist: 'Carl Bloch' },
  { key: 'rich-young-ruler', src: '/art/rich-young-ruler.jpg', title: 'Christ and the Rich Young Ruler', artist: 'Heinrich Hofmann' },
  { key: 'gethsemane', src: '/art/gethsemane.jpg', title: 'Christ in Gethsemane', artist: 'Carl Bloch' },
  { key: 'resurrection', src: '/art/resurrection.jpg', title: 'The Resurrection', artist: 'Carl Bloch' },
  { key: 'david-slays-goliath', src: '/art/david-slays-goliath.jpg', title: 'David Slays Goliath', artist: 'Gustave Doré' },
];

export function resolveArt(image: string | null | undefined): ArtPiece | null {
  if (!image) return null;
  if (image.startsWith('http') || image.startsWith('/')) {
    return { key: 'custom', src: image, title: '', artist: '' };
  }
  return ART_LIBRARY.find((a) => a.key === image) ?? null;
}
