import { describe, it, expect } from 'vitest';
import { translations, getTranslation } from '../translations';
import { api } from '../services/api';

describe('WayMithra Multilingual Support', () => {
  it('supports English, Kannada and Hindi across all keys', () => {
    const en = getTranslation('en');
    const kn = getTranslation('kn');
    const hi = getTranslation('hi');

    expect(en.appTitle).toBe('Way ಮಿತ್ರ');
    expect(kn.appTitle).toBe('ವೇ ಮಿತ್ರ');
    expect(hi.appTitle).toBe('वे मित्र');

    expect(en.tagline).toBe('Travel Smart. Travel Better.');
    expect(kn.tagline).toBe('ಬುದ್ಧಿವಂತ ಪ್ರಯಾಣ. ಉತ್ತಮ ಪ್ರಯಾಣ.');
    expect(hi.tagline).toBe('स्मार्ट यात्रा। बेहतर यात्रा।');

    expect(en.userMode).toBe('Passenger View');
    expect(kn.userMode).toBe('ಪ್ರಯಾಣಿಕರ ನೋಟ');
    expect(hi.userMode).toBe('यात्री दृश्य');

    expect(en.viewInteriorCam).toContain('Privacy Cam');
    expect(kn.viewInteriorCam).toContain('ಗೌಪ್ಯತೆ ರಕ್ಷಿತ');
    expect(hi.viewInteriorCam).toContain('गोपनीयता सुरक्षित');
  });

  it('translates Bengaluru landmark stops accurately', () => {
    const en = getTranslation('en');
    const kn = getTranslation('kn');
    const hi = getTranslation('hi');

    expect(en.stops['BLR-STOP-01']).toContain('Majestic');
    expect(kn.stops['BLR-STOP-01']).toContain('ಮೆಜೆಸ್ಟಿಕ್');
    expect(hi.stops['BLR-STOP-01']).toContain('मेजेस्टिक');

    expect(en.stops['BLR-STOP-04']).toContain('SJBIT College');
    expect(kn.stops['BLR-STOP-04']).toContain('ಕೆಂಗೇರಿ');
    expect(hi.stops['BLR-STOP-04']).toContain('केंगेरी');
  });
});

describe('WayMithra Frontend API Service', () => {
  it('returns landmark stops array with 14 stops', async () => {
    const stops = await api.getStops();
    expect(stops.length).toBeGreaterThanOrEqual(14);
  });

  it('provides camera privacy attributes in fallback status', async () => {
    const cam = await api.getCameraStatus();
    expect(cam.faces_revealed).toBe(false);
    expect(cam.privacy_filter).toBe('line_art_sketch_active');
  });
});
