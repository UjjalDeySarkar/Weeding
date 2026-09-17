#!/usr/bin/env python3
"""
Renders public/audio/shehnai.mp3: an original shehnai alap in Raag Yaman over a sur (drone) shehnai.
Fully synthesised (additive, using a harmonic envelope measured from a real shehnai recording),
so there is nothing to license or credit.

Needs numpy, scipy and ffmpeg:  python3 scripts/make-shehnai.py [out.wav]
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
SA = 329.63  # E4, a common shehnai tonic
LOUDNESS = -15  # LUFS
OUT = Path(__file__).resolve().parent.parent / 'public/audio/shehnai.mp3'
rng = np.random.default_rng(29)

# Just-intonation swaras. '.' = lower octave, "'" = upper octave, M = tivra Ma (Yaman)
RATIO = {'S': 1, 'R': 9 / 8, 'G': 5 / 4, 'M': 45 / 32, 'P': 3 / 2, 'D': 27 / 16, 'N': 15 / 8}

# Alap phrases. "swara/seconds"; ~ = meend (slow glide into the note), ^ = kan (grace note)
PHRASES = [
    ".N/1.4 R/.9 ~G/2.2 R/.7 ~S/2.8",
    ".N/.8 ~.D/.9 .N/.7 R/.9 ~G/1.6 M/.7 ~G/1 R/.6 ~S/2.6",
    "G/.9 M/.8 ~D/2 N/.7 ~D/1.2 ~P/2",
    "M/.6 ~G/.9 M/.7 D/.8 N/1 ~S'/2.6",
    "^R' S'/.9 ~N/.8 D/.8 N/.7 R'/1 ~G'/2.2 R'/.7 ~S'/1.8",
    "S'/.7 ~N/.8 D/.9 ~P/1.4 M/.8 ~G/1.2 M/.6 D/.7 N/.6 ~D/1 ~P/1.8",
    "^M G/1 ~R/.8 G/1.4 R/.6 ~S/.8 ~.N/1.2 .D/.8 .N/.9 R/.9 ~S/4",
]
BREATHS = [1.2, 1.2, 1.0, 0.9, 1.0, 1.1]
INTRO, OUTRO = 1.8, 3.5  # drone alone before the first and after the last phrase

# Harmonic envelope (Hz, dB) measured from a street shehnai recording: the nasal peak sits at 1.2–1.7 kHz
ENVELOPE = np.array([
    (100, -32), (375, -24), (500, -21), (750, -15), (950, -14), (1060, -11), (1190, -2), (1340, 0),
    (1500, 0), (1680, -2), (1890, -5), (2120, -8), (2380, -9.5), (2670, -15), (3000, -16),
    (3360, -24), (3800, -29), (4240, -28), (4760, -28), (5340, -33), (6000, -42), (8000, -50), (11000, -70),
])


def hz(swara):
    return SA * RATIO[swara.strip(".'")] * 2.0 ** (swara.count("'") - swara.count('.'))


def parse(phrase):
    notes = []
    for token in phrase.split():
        if token.startswith('^'):
            notes.append((token[1:], 0.11, 0.03, False, True))
            continue
        meend = token.startswith('~')
        swara, dur = token.lstrip('~').split('/')
        notes.append((swara, float(dur), 0.4 if meend else 0.06, not meend, False))
    return notes


def wobble(n, cutoff):
    """Unit-variance random drift below `cutoff` Hz."""
    rate = 200
    m = int(n / SR * rate) + 2
    y = sosfilt(butter(2, cutoff, fs=rate, output='sos'), rng.standard_normal(m + rate))[rate:]
    y /= y.std() + 1e-12
    return np.interp(np.arange(n) * rate / SR, np.arange(m), y)


def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def perform(phrases, n):
    f0 = np.full(n, hz('S'))
    amp = np.zeros(n)
    chiff = np.zeros(n)
    t = INTRO
    for i, phrase in enumerate(phrases):
        prev = hz(phrase[0][0]) * 2 ** (-70 / 1200)  # players scoop up into the first note
        start = int(t * SR)
        after_kan = False
        for j, (swara, dur, glide, tongued, kan) in enumerate(phrase):
            if not kan:
                dur *= rng.uniform(0.95, 1.05)
            a, b = int(t * SR), int((t + dur) * SR)
            s = np.arange(b - a) / SR
            target = hz(swara)
            g = max(glide, 0.1) if j == 0 else glide
            cents = np.zeros_like(s)
            if dur > 0.9:
                depth = rng.uniform(16, 24) * smoothstep((s - g - 0.25) / 0.6)
                cents = depth * np.sin(2 * np.pi * rng.uniform(5.0, 5.8) * s)
            f0[a:b] = np.exp(np.log(prev) + np.log(target / prev) * smoothstep(s / g)) * 2 ** (cents / 1200)

            level = np.clip(0.8 + 0.12 * np.log2(target / SA), 0.7, 0.95) * rng.uniform(0.95, 1.05)
            env = np.full_like(s, level)
            if dur > 1.2:
                env *= 0.88 + 0.12 * np.sin(np.pi * s / dur)  # swell through long notes
            if j and tongued and not after_kan:
                env *= 1 - 0.35 * np.exp(-(((s - 0.02) / 0.03) ** 2))
            amp[a:b] = env
            prev, after_kan = target, kan
            t += dur

        end = int(t * SR)
        attack, release = int(0.07 * SR), int(0.45 * SR)
        amp[start:start + attack] *= smoothstep(np.arange(attack) / attack)
        fade = 1 - smoothstep(np.arange(release) / release)
        amp[end - release:end] *= fade
        f0[end - release:end] *= 2 ** (-20 / 1200 * (1 - fade))  # pitch sags as the breath runs out
        f0[end:] = f0[end - 1]
        chiff[start:start + int(0.05 * SR)] = np.hanning(int(0.05 * SR))
        t += BREATHS[i] if i < len(BREATHS) else 0
    return f0, amp, chiff


def reed(f0, amp, loudness):
    """Additive double-reed tone; softer playing is darker."""
    n = len(f0)
    phase = 2 * np.pi * np.cumsum(f0) / SR
    env_lf, env_db = np.log2(ENVELOPE[:, 0]), ENVELOPE[:, 1]
    out = np.zeros(n)
    for k in range(1, int(10000 / f0.min()) + 1):
        fk = k * f0
        db = np.interp(np.log2(fk), env_lf, env_db)
        db += (loudness - 1) * 10 * np.clip(np.log2(fk / 1400), 0, None)
        db += 1.2 * wobble(n, 3)
        db[fk > 16000] = -200
        out += 10 ** (db / 20) * np.sin(k * phase + rng.uniform(0, 2 * np.pi))
    return out * amp


def reverb(x, rt60=2.0, length=2.8):
    m = int(length * SR)
    t = np.arange(m) / SR
    ir = rng.standard_normal((2, m)) * 10 ** (-3 * t / rt60)
    ir = sosfilt(butter(2, 4500, fs=SR, output='sos'), ir, axis=1)
    ir[:, : int(0.02 * SR)] = 0
    ir /= np.sqrt((ir**2).sum(axis=1, keepdims=True))
    return np.stack([fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])


def main():
    phrases = [parse(p) for p in PHRASES]
    seconds = INTRO + sum(d for p in phrases for _, d, *_ in p) * 1.05 + sum(BREATHS) + OUTRO
    n = int(seconds * SR)

    f0, amp, chiff = perform(phrases, n)
    f0 *= 2 ** (4 * wobble(n, 6) / 1200)
    amp *= 1 + 0.03 * wobble(n, 8)
    melody = reed(f0, amp, np.clip(amp, 0, 1.1))
    tone_rms = np.sqrt(np.mean(melody[amp > 0.3] ** 2))
    breath = sosfilt(butter(2, [900, 5000], btype='band', fs=SR, output='sos'), rng.standard_normal(n))
    reed_buzz = 0.4 + 0.6 * (0.5 + 0.5 * np.cos(2 * np.pi * np.cumsum(f0) / SR)) ** 3  # noise pulses as the reed closes
    breath *= tone_rms / breath.std() * (10 ** (-30 / 20) * amp * reed_buzz + 10 ** (-16 / 20) * chiff)
    melody += breath

    # Sur shehnai: a steady Sa underneath, circular-breathed
    drone_amp = 0.2 * (0.93 + 0.07 * wobble(n, 0.15))
    drone = reed(SA * 2 ** (3 * wobble(n, 0.5) / 1200), drone_amp, 0.6)

    dry = np.stack([0.92 * melody + drone, melody + 0.8 * drone])
    mix = dry + 0.32 * reverb(dry)
    fade_in, fade_out = int(1.5 * SR), int(2.5 * SR)
    mix[:, :fade_in] *= smoothstep(np.arange(fade_in) / fade_in)
    mix[:, -fade_out:] *= 1 - smoothstep(np.arange(fade_out) / fade_out)
    mix *= 0.89 / np.abs(mix).max()

    wav = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(tempfile.mkdtemp()) / 'shehnai.wav'
    wavfile.write(wav, SR, (mix.T * 32767).astype(np.int16))
    measured = subprocess.run(
        ['ffmpeg', '-hide_banner', '-i', str(wav), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
        capture_output=True, text=True, check=True,
    ).stderr
    stats = measured[measured.rindex('{'):]
    gain = LOUDNESS - float(json.loads(stats[: stats.index('}') + 1])['input_i'])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-af', f'volume={min(gain, 0):.2f}dB',
         '-codec:a', 'libmp3lame', '-b:a', '128k', '-metadata', 'title=Shehnai (Raag Yaman)', str(OUT)],
        check=True,
    )
    print(f'{OUT} ({seconds:.0f}s)')


if __name__ == '__main__':
    main()
