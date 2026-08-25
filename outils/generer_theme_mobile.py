from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "game" / "assets" / "audio" / "valdora_mobile_theme_v118.wav"
SAMPLE_RATE = 22_050
BPM = 96
BEAT = 60 / BPM
BARS = 8
DURATION = BARS * 4 * BEAT


def midi(note: int) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def envelope(position: float, length: float, attack: float, release: float) -> float:
    if position < 0 or position >= length:
        return 0.0
    return min(1.0, position / max(attack, 1e-5), (length - position) / max(release, 1e-5))


def main() -> None:
    random.seed(118)
    count = round(DURATION * SAMPLE_RATE)
    samples = [0.0] * count
    chords = [
        (50, 57, 62, 66),  # Ré majeur suspendu
        (47, 54, 59, 62),  # Si mineur
        (43, 50, 55, 59),  # Sol majeur
        (45, 52, 57, 61),  # La majeur
    ]

    def add_tone(start: float, length: float, note: int, gain: float, kind: str = "pad") -> None:
        begin = max(0, round(start * SAMPLE_RATE))
        end = min(count, round((start + length) * SAMPLE_RATE))
        frequency = midi(note)
        phase = random.random() * math.tau
        for index in range(begin, end):
            position = index / SAMPLE_RATE - start
            if kind == "pluck":
                amp = envelope(position, length, 0.012, length * 0.86) * math.exp(-3.1 * position / length)
                value = math.sin(math.tau * frequency * position + phase)
                value += 0.32 * math.sin(math.tau * frequency * 2 * position + phase * 0.7)
            elif kind == "bass":
                amp = envelope(position, length, 0.035, 0.18)
                value = math.sin(math.tau * frequency * position + phase)
                value += 0.18 * math.sin(math.tau * frequency * 2 * position)
            else:
                amp = envelope(position, length, 0.55, 0.75)
                drift = 0.0018 * math.sin(math.tau * 0.18 * position)
                value = math.sin(math.tau * frequency * (1 + drift) * position + phase)
                value += 0.24 * math.sin(math.tau * frequency * 2 * position + phase)
                value += 0.10 * math.sin(math.tau * frequency * 3 * position + phase * 0.4)
            samples[index] += gain * amp * value

    for bar in range(BARS):
        start = bar * 4 * BEAT
        chord = chords[bar % len(chords)]
        for note in chord:
            add_tone(start, 4 * BEAT + 0.18, note, 0.055, "pad")
        for beat_index in range(4):
            add_tone(start + beat_index * BEAT, BEAT * 0.9, chord[0] - 12, 0.105, "bass")
        pattern = (1, 2, 3, 2, 1, 3, 2, 0)
        for step, chord_index in enumerate(pattern):
            add_tone(start + step * BEAT / 2, BEAT * 0.74, chord[chord_index] + 12, 0.072, "pluck")

    # Percussions douces et modernes, sans sonorité 8-bit.
    for beat_index in range(BARS * 4):
        start = beat_index * BEAT
        begin = round(start * SAMPLE_RATE)
        end = min(count, begin + round(0.18 * SAMPLE_RATE))
        for index in range(begin, end):
            position = (index - begin) / SAMPLE_RATE
            kick = math.sin(math.tau * (62 - 35 * position) * position) * math.exp(-24 * position)
            samples[index] += 0.13 * kick
        if beat_index % 2 == 1:
            begin = round((start + 0.02) * SAMPLE_RATE)
            end = min(count, begin + round(0.11 * SAMPLE_RATE))
            for index in range(begin, end):
                position = (index - begin) / SAMPLE_RATE
                samples[index] += 0.028 * random.uniform(-1, 1) * math.exp(-32 * position)

    # Texture atmosphérique discrète.
    smooth = 0.0
    for index in range(count):
        smooth = 0.985 * smooth + 0.015 * random.uniform(-1, 1)
        samples[index] += 0.012 * smooth

    peak = max(abs(value) for value in samples) or 1.0
    scale = 0.82 / peak
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUTPUT), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for value in samples:
            limited = math.tanh(value * scale * 1.15) / math.tanh(1.15)
            frames.extend(struct.pack("<h", round(max(-1, min(1, limited)) * 32767)))
        audio.writeframes(frames)

    print(f"Theme genere : {OUTPUT} ({OUTPUT.stat().st_size / 1024:.0f} Kio, {DURATION:.1f} s)")


if __name__ == "__main__":
    main()
