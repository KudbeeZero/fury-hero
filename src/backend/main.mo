import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

actor {
  type Song = {
    id : Text;
    title : Text;
    artist : Text;
    bpm : Nat;
    duration : Float; // in seconds
    difficulty : Text;
  };

  type SongInput = {
    id : Text;
    title : Text;
    artist : Text;
    bpm : Nat;
    duration : Float;
    difficulty : Text;
  };

  type Score = {
    playerName : Text;
    score : Nat;
    maxCombo : Nat;
    accuracy : Float;
    stars : Nat; // 1-5
    timestamp : Int;
  };

  module Score {
    // For sorting scores by highest score first, then timestamp
    public func compareByPoints(first : Score, second : Score) : Order.Order {
      switch (Nat.compare(second.score, first.score)) {
        case (#equal) { Nat.compare(second.maxCombo, first.maxCombo) };
        case (order) { order };
      };
    };
  };

  let songs = Map.empty<Text, Song>();
  let scores = Map.empty<Text, [Score]>();

  // Initialize placeholder songs
  let initialSongs = [
    {
      id = "song1";
      title = "Electric Pulse";
      artist = "SynthWave";
      bpm = 120;
      duration = 180.0;
      difficulty = "Medium";
    },
    {
      id = "song2";
      title = "Metal Fury";
      artist = "RockZone";
      bpm = 140;
      duration = 210.0;
      difficulty = "Hard";
    },
  ];

  for (song in initialSongs.values()) {
    songs.add(song.id, song);
  };

  public shared ({ caller }) func submitScore(songId : Text, playerName : Text, scoreValue : Nat, maxCombo : Nat, accuracy : Float, stars : Nat) : async () {
    if (stars < 1 or stars > 5) {
      Runtime.trap("Stars must be between 1 and 5");
    };

    if (not songs.containsKey(songId)) {
      Runtime.trap("Song does not exist");
    };

    let newScore : Score = {
      playerName;
      score = scoreValue;
      maxCombo;
      accuracy;
      stars;
      timestamp = Time.now();
    };

    // Get existing scores for this song (if any)
    let songScores = switch (scores.get(songId)) {
      case (null) { [].values() };
      case (?existing) { existing.values() };
    };

    let updatedScores = songScores.concat([newScore].values());

    let sortedScores = updatedScores.toArray().sort(Score.compareByPoints);

    // Keep only top 10 scores
    if (sortedScores.size() > 10) {
      scores.add(songId, sortedScores.sliceToArray(0, 10));
    } else {
      scores.add(songId, sortedScores);
    };
  };

  public query ({ caller }) func getTopScores(songId : Text) : async [Score] {
    switch (scores.get(songId)) {
      case (null) { [] };
      case (?songScores) { songScores };
    };
  };

  public shared ({ caller }) func addSong(songInput : SongInput) : async () {
    if (songs.containsKey(songInput.id)) {
      Runtime.trap("Song with this ID already exists");
    };

    let newSong : Song = {
      id = songInput.id;
      title = songInput.title;
      artist = songInput.artist;
      bpm = songInput.bpm;
      duration = songInput.duration;
      difficulty = songInput.difficulty;
    };

    songs.add(songInput.id, newSong);
  };

  public query ({ caller }) func getAllSongs() : async [Song] {
    songs.values().toArray();
  };

  public query ({ caller }) func getSong(songId : Text) : async Song {
    switch (songs.get(songId)) {
      case (null) { Runtime.trap("Song does not exist") };
      case (?song) { song };
    };
  };
};
