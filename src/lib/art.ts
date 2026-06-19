// Curated public-domain sacred art for session headers. Sessions store either an
// art key from this library, or a full custom image URL. All works are public
// domain (artists died > 100 years ago). `source` links to the Wikimedia Commons
// file page (license + provenance).

export interface ArtPiece {
  key: string;
  src: string;
  title: string;
  artist: string;
  source: string | null;
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:';

export const ART_LIBRARY: ArtPiece[] = [
  { key: 'sermon-on-the-mount', src: '/art/sermon-on-the-mount.jpg', title: 'The Sermon on the Mount', artist: 'Carl Bloch', source: `${COMMONS}Bloch-SermonOnTheMount.jpg` },
  { key: 'christ-hofmann', src: '/art/christ-hofmann.jpg', title: 'Christ', artist: 'Heinrich Hofmann', source: `${COMMONS}Christ,_by_Heinrich_Hofmann.jpg` },
  { key: 'christ-and-child', src: '/art/christ-and-child.jpg', title: 'Christ and the Child', artist: 'Carl Bloch', source: `${COMMONS}Carl_Bloch_-_Christ_and_Child.jpg` },
  { key: 'rich-young-ruler', src: '/art/rich-young-ruler.jpg', title: 'Christ and the Rich Young Ruler', artist: 'Heinrich Hofmann', source: `${COMMONS}Hoffman-ChristAndTheRichYoungRuler.jpg` },
  { key: 'gethsemane', src: '/art/gethsemane.jpg', title: 'Christ in Gethsemane', artist: 'Carl Bloch', source: `${COMMONS}Gethsemane_Carl_Bloch.jpg` },
  { key: 'resurrection', src: '/art/resurrection.jpg', title: 'The Resurrection', artist: 'Carl Bloch', source: `${COMMONS}The_Resurrection_by_Carl_Heinrich_Bloch,_1881.jpg` },
  { key: 'david-slays-goliath', src: '/art/david-slays-goliath.jpg', title: 'David Slays Goliath', artist: 'Gustave Doré', source: `${COMMONS}071A.David_Slays_Goliath.jpg` },
];

export function resolveArt(image: string | null | undefined): ArtPiece | null {
  if (!image) return null;
  if (image.startsWith('http') || image.startsWith('/')) {
    return { key: 'custom', src: image, title: '', artist: '', source: image.startsWith('http') ? image : null };
  }
  return ART_LIBRARY.find((a) => a.key === image) ?? null;
}
