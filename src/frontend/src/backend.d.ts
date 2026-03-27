import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SongInput {
    id: string;
    bpm: bigint;
    title: string;
    duration: number;
    difficulty: string;
    artist: string;
}
export interface Song {
    id: string;
    bpm: bigint;
    title: string;
    duration: number;
    difficulty: string;
    artist: string;
}
export interface Score {
    score: bigint;
    stars: bigint;
    timestamp: bigint;
    playerName: string;
    maxCombo: bigint;
    accuracy: number;
}
export interface backendInterface {
    addSong(songInput: SongInput): Promise<void>;
    getAllSongs(): Promise<Array<Song>>;
    getSong(songId: string): Promise<Song>;
    getTopScores(songId: string): Promise<Array<Score>>;
    submitScore(songId: string, playerName: string, scoreValue: bigint, maxCombo: bigint, accuracy: number, stars: bigint): Promise<void>;
}
