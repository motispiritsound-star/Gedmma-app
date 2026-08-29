"""
The explainer's soundtrack, synthesised from scratch.

Written rather than licensed, for two reasons. A track from a stock library
carries terms that have to be read, attributed and re-checked every time the
video is re-cut, and a platform's content-ID system will happily flag a piece
that thousands of other videos also use. This one belongs to the project.

The arrangement follows the same six shots as the picture -- the timings come
from `SHOTS` in scene.js and are repeated here as `MOMENTS`, so a change to the
edit is a change to one list in each file rather than a re-scored track.

It is deliberately plain: a plucked motif, a warm pad underneath, and a low
pulse you feel more than hear. Something busier would compete with a video whose
whole job is to be read.

    python3 scripts/explainer/music.py marketing/audio/buurklus-theme.wav
"""

from __future__ import annotations

import math
import struct
import sys
import wave
from pathlib import Path

import numpy as np

RATE = 44_100
DURATION = 25.0  # Matches the picture exactly; the tail fades inside it.

# --- The edit, in seconds ----------------------------------------------------

MOMENTS = {
    "hook": (0.0, 3.0),
    "describe": (3.0, 8.2),
    "quotes": (8.2, 13.8),
    "choose": (13.8, 18.0),
    "privacy": (18.0, 21.4),
    "end": (21.4, 25.0),
}

# 100 bpm: one beat every 0.6 s, which puts a pluck roughly where each quote
# card lands without having to nudge either.
BPM = 100.0
BEAT = 60.0 / BPM


def note(semitones_from_a4: float) -> float:
    """Frequency of a note, counted in semitones from A4."""
    return 440.0 * (2.0 ** (semitones_from_a4 / 12.0))


# D major, which is warm without being saccharine, and sits in a register that
# survives a phone speaker. Named rather than written as arithmetic on other
# notes: a chord voicing should be readable as a chord.
G2, B2 = note(-26), note(-22)
D3, FS3, G3, A3 = note(-19), note(-15), note(-14), note(-12)
D4, E4, FS4, A4, B4 = note(-7), note(-5), note(-3), note(0), note(2)
D5, FS5, A5 = note(5), note(9), note(12)


def envelope(length: int, attack: float, decay: float, sustain: float, release: float) -> np.ndarray:
    """A plain ADSR, in seconds, clipped to the length asked for."""
    a = max(1, int(attack * RATE))
    d = max(1, int(decay * RATE))
    r = max(1, int(release * RATE))
    s = max(0, length - a - d - r)

    return np.concatenate([
        np.linspace(0.0, 1.0, a),
        np.linspace(1.0, sustain, d),
        np.full(s, sustain),
        np.linspace(sustain, 0.0, r),
    ])[:length]


def pluck(freq: float, seconds: float, gain: float = 1.0) -> np.ndarray:
    """
    A soft mallet tone: a fundamental with two quiet overtones and a fast decay.

    The overtones are detuned very slightly sharp, which is what a struck bar
    actually does and what keeps a pure sine from sounding like a test tone.
    """
    length = int(seconds * RATE)
    t = np.arange(length) / RATE

    tone = (
        np.sin(2 * np.pi * freq * t)
        + 0.34 * np.sin(2 * np.pi * freq * 2.01 * t)
        + 0.20 * np.sin(2 * np.pi * freq * 3.02 * t)
        + 0.10 * np.sin(2 * np.pi * freq * 4.05 * t)
    )
    # Exponential decay rather than linear: a struck object loses most of its
    # energy immediately and then rings, and the ear knows the difference.
    body = np.exp(-t * 4.5)

    # The strike, an octave and a fifth above the note and gone in a
    # twentieth of a second. Without it the whole piece measured at a 745 Hz
    # centroid -- warm to the point of muddy, and every pluck read as a hum
    # rather than as a note being struck.
    click = np.exp(-t * 70.0) * (
        0.30 * np.sin(2 * np.pi * freq * 6.1 * t) + 0.18 * np.sin(2 * np.pi * freq * 9.2 * t)
    )

    return (tone * body + click) * gain * 0.28


def pad(freqs: list[float], seconds: float, gain: float = 1.0) -> np.ndarray:
    """A slow chord bed. Each voice is doubled a few cents apart so it breathes."""
    length = int(seconds * RATE)
    t = np.arange(length) / RATE
    out = np.zeros(length)

    for freq in freqs:
        for detune in (-0.06, 0.0, 0.07):
            out += np.sin(2 * np.pi * (freq + detune) * t)
        out += 0.35 * np.sin(2 * np.pi * freq * 2 * t)

    out /= max(1, len(freqs) * 3)
    shaped = out * envelope(length, 1.1, 0.6, 0.85, 1.6)

    # A slow tremolo, barely there, so a long note is not perfectly static.
    shaped *= 1.0 + 0.05 * np.sin(2 * np.pi * 0.28 * t)
    return shaped * gain * 0.34


def pulse(seconds: float, gain: float = 1.0) -> np.ndarray:
    """A low sine thud. Felt rather than heard on a phone."""
    length = int(seconds * RATE)
    t = np.arange(length) / RATE
    sweep = 96.0 * np.exp(-t * 22.0) + 44.0
    return np.sin(2 * np.pi * sweep * t) * np.exp(-t * 13.0) * gain * 0.5


def place(track: np.ndarray, sound: np.ndarray, at: float) -> None:
    """Mixes a sound into the track at a time in seconds, in place."""
    start = int(at * RATE)
    end = min(len(track), start + len(sound))
    if start >= len(track):
        return
    track[start:end] += sound[: end - start]


def compose() -> np.ndarray:
    track = np.zeros(int(DURATION * RATE))

    # --- The bed -------------------------------------------------------------
    # Four chords under the whole piece: D, Bm, G, A, and D to close. The
    # movement is slow enough that nothing has to be counted.
    chords = [
        (MOMENTS["hook"][0], 5.2, [D3, A3, FS4]),          # D
        (MOMENTS["describe"][0] + 2.2, 6.0, [B2, FS3, D4]),  # Bm
        (MOMENTS["quotes"][0] + 2.0, 6.0, [G2, D4, A3]),     # G
        (MOMENTS["choose"][0] + 1.0, 4.4, [A3, E4, A3]),     # A
        (MOMENTS["privacy"][0], 4.0, [D3, A3, D4]),          # D
        (MOMENTS["end"][0] - 0.4, 4.4, [D3, A3, FS4, D4]),   # D, wider
    ]
    for at, seconds, freqs in chords:
        place(track, pad(freqs, seconds, gain=0.9), at)

    # --- The motif -----------------------------------------------------------
    # Five notes that come back three times, each pass a little fuller. The
    # first statement is bare because the picture is bare: one line of text.
    motif = [D4, FS4, A4, FS4, B4]

    hook_start, _ = MOMENTS["hook"]
    for i, freq in enumerate(motif[:3]):
        place(track, pluck(freq, 2.0, gain=0.5), hook_start + 0.35 + i * BEAT * 1.5)

    describe_start, _ = MOMENTS["describe"]
    for i in range(8):
        freq = motif[i % len(motif)]
        place(track, pluck(freq, 1.7, gain=0.62), describe_start + 0.2 + i * BEAT)

    # Each quote card lands with a note. The three cards arrive at 0.5 s, 1.4 s
    # and 2.3 s into the shot, so these sit exactly under them.
    quotes_start, _ = MOMENTS["quotes"]
    for i, freq in enumerate([D5, FS5, A5]):
        place(track, pluck(freq, 2.4, gain=0.72), quotes_start + 0.5 + i * 0.9)
    for i in range(6):
        freq = motif[i % len(motif)]
        place(track, pluck(freq, 1.6, gain=0.5), quotes_start + 3.2 + i * BEAT * 0.75)

    # The decision: the motif climbs and lands on the tonic as the card is
    # picked, at about 2.1 s into the shot.
    choose_start, _ = MOMENTS["choose"]
    for i, freq in enumerate([FS4, A4, B4, D5]):
        place(track, pluck(freq, 1.8, gain=0.66), choose_start + 0.4 + i * BEAT * 0.6)
    place(track, pluck(D5, 3.2, gain=0.95), choose_start + 2.1)
    place(track, pluck(FS5, 3.2, gain=0.55), choose_start + 2.16)

    # The privacy line is the quiet moment: two notes and the pad.
    privacy_start, _ = MOMENTS["privacy"]
    place(track, pluck(A4, 2.6, gain=0.42), privacy_start + 1.3)
    place(track, pluck(D5, 2.8, gain=0.34), privacy_start + 2.1)

    # The end card resolves: the motif once more, then the chord holds.
    end_start, _ = MOMENTS["end"]
    for i, freq in enumerate([D4, FS4, A4, D5]):
        place(track, pluck(freq, 2.6, gain=0.7), end_start + 0.2 + i * BEAT * 0.55)

    # --- The pulse -----------------------------------------------------------
    # Starts when the phone appears and stops before the privacy line, so the
    # quiet moment is actually quiet.
    beat_from = MOMENTS["describe"][0]
    beat_to = MOMENTS["privacy"][0] - 0.4
    at = beat_from
    while at < beat_to:
        strong = round((at - beat_from) / BEAT) % 4 == 0
        place(track, pulse(0.5, gain=0.5 if strong else 0.22), at)
        at += BEAT

    return track


# How loud each shot sits relative to the rest. Composed flat, the piece
# measured 2.4 dB from its quietest shot to its loudest, which is no shape at
# all: the question at the start and the quiet line near the end are supposed
# to feel different from the moment the choice is made.
SHOT_GAIN = {
    "hook": 0.62,
    "describe": 0.86,
    "quotes": 1.0,
    "choose": 1.15,
    "privacy": 0.5,
    "end": 0.95,
}


def apply_dynamics(track: np.ndarray) -> np.ndarray:
    """Rides the level shot by shot, ramping between them so nothing steps."""
    gain = np.ones(len(track))
    for name, (start, end) in MOMENTS.items():
        a, b = int(start * RATE), int(end * RATE)
        gain[a:b] = SHOT_GAIN[name]

    # A quarter-second smooth over the joins: an abrupt change in level is
    # audible as a click even when the change itself is small.
    window = int(0.25 * RATE)
    kernel = np.ones(window) / window
    return track * np.convolve(gain, kernel, mode="same")


def master(track: np.ndarray) -> np.ndarray:
    """Rides the dynamics, fades the ends, tames the peaks and leaves headroom."""
    track = apply_dynamics(track)

    # A one-pole high-pass at about 30 Hz. The synthesis leaves a small DC
    # offset, which costs headroom and does nothing a speaker can reproduce.
    alpha = 1.0 / (1.0 + 2 * math.pi * 30.0 / RATE)
    filtered = np.empty_like(track)
    previous_in = previous_out = 0.0
    for i, sample in enumerate(track):
        previous_out = alpha * (previous_out + sample - previous_in)
        previous_in = sample
        filtered[i] = previous_out
    track = filtered

    fade_in = int(0.25 * RATE)
    fade_out = int(1.4 * RATE)
    track[:fade_in] *= np.linspace(0.0, 1.0, fade_in)
    track[-fade_out:] *= np.linspace(1.0, 0.0, fade_out)

    # A gentle knee rather than hard clipping: tanh keeps the loud moments from
    # squaring off, which is what makes cheap synthesis sound cheap.
    track = np.tanh(track * 1.15)

    peak = float(np.max(np.abs(track)))
    if peak > 0:
        track *= 0.82 / peak  # a couple of dB below full scale
    return track


def write_wav(track: np.ndarray, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    samples = np.clip(track, -1.0, 1.0)
    pcm = (samples * 32_767).astype("<i2")
    # The same signal on both channels: the piece is mono material and a fake
    # stereo image would only smear it on a phone speaker.
    stereo = np.repeat(pcm[:, None], 2, axis=1).tobytes()

    with wave.open(str(path), "wb") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(stereo)


def main() -> None:
    target = Path(sys.argv[1] if len(sys.argv) > 1 else "marketing/audio/buurklus-theme.wav")
    track = master(compose())
    write_wav(track, target)

    peak_db = 20 * math.log10(float(np.max(np.abs(track))))
    rms_db = 20 * math.log10(float(np.sqrt(np.mean(track**2))))
    print(f"  {target}  {DURATION:.0f}s  peak {peak_db:.1f} dBFS  rms {rms_db:.1f} dBFS")


if __name__ == "__main__":
    main()
