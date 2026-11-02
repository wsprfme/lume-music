export type Source = 'soundcloud' | 'youtube';

export interface Track {
  id: string;          // `${source}:${nativeId}`
  source: Source;
  nativeId: string;
  title: string;
  artist: string;
  artistId?: string;
  artwork?: string;
  durationSec: number;
  /** URL hint for the player. SoundCloud -> hls/transcoding; YouTube -> videoId (resolved to BE audio proxy) */
  streamHint: { kind: 'mp3' | 'hls' | 'resolve'; url: string };
  permalink?: string;
  playCount?: number;
}
