export type Source = 'soundcloud';

export interface Track {
  id: string;          // `${source}:${nativeId}`
  source: Source;
  nativeId: string;
  title: string;
  artist: string;
  artistId?: string;
  artwork?: string;
  durationSec: number;
  /** URL hint for the player. SoundCloud -> hls m3u8 (resolved on demand) */
  streamHint: { kind: 'mp3' | 'hls' | 'resolve'; url: string };
  permalink?: string;
  playCount?: number;
}
