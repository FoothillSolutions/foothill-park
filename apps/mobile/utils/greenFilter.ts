import { Skia, ImageFormat } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system/next';

/**
 * Palestinian plates: green text on white background.
 * This matrix isolates "greenness" (G − 0.5R − 0.5B) and inverts it so
 * green text becomes dark-on-white — ideal for OCR — while black
 * manufacturer text, red stickers, and white background all become white.
 *
 *   output = clamp(1 − 2·(G − 0.5R − 0.5B))
 *
 *   Green text  (R≈0.2 G≈0.6 B≈0.2)  → 0.22  (dark)
 *   Black text  (R≈0.1 G≈0.1 B≈0.1)  → 1.00  (white, invisible)
 *   White bg    (R≈1   G≈1   B≈1)     → 1.00  (white)
 *   Red text    (R≈0.8 G≈0.2 B≈0.2)  → 1.00+ (white)
 */
const GREEN_ISOLATION_MATRIX = [
  1, -2, 1, 0, 1,
  1, -2, 1, 0, 1,
  1, -2, 1, 0, 1,
  0,  0, 0, 1, 0,
];

export async function filterGreenChannel(inputUri: string): Promise<string> {
  const data = await Skia.Data.fromURI(inputUri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Failed to decode image for green filter');

  const w = image.width();
  const h = image.height();
  const surface = Skia.Surface.MakeOffscreen(w, h);
  if (!surface) {
    image.dispose();
    throw new Error('Failed to create offscreen surface');
  }

  const paint = Skia.Paint();
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix(GREEN_ISOLATION_MATRIX));
  surface.getCanvas().drawImage(image, 0, 0, paint);
  surface.flush();

  const result = surface.makeImageSnapshot();
  const bytes = result.encodeToBytes(ImageFormat.JPEG, 90);

  const outputFile = new File(Paths.cache, `green-filtered-${Date.now()}.jpg`);
  const base64 = btoa(
    Array.from(bytes, (b: number) => String.fromCharCode(b)).join(''),
  );
  outputFile.create();
  outputFile.write(base64, { encoding: 'base64' });

  image.dispose();
  result.dispose();
  surface.dispose();

  return outputFile.uri;
}
