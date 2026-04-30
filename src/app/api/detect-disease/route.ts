import { NextRequest, NextResponse } from 'next/server';

// Plant disease model trained on PlantVillage dataset — 38 disease/healthy classes
// Labels are in the format: "CropName___DiseaseName" or "CropName___healthy"
// Alternative: swap MODEL_URL for "google/vit-base-patch16-224" (general ImageNet classifier)
const MODEL_URL =
  'https://router.huggingface.co/hf-inference/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';

const SUGGESTIONS: Record<string, string> = {
  healthy: 'Your plant appears healthy! Continue regular care with balanced fertilization and proper watering.',
  Apple_scab: 'Apply fungicide sprays. Remove infected leaves and improve air circulation.',
  Apple_Black_rot: 'Prune infected branches. Apply copper-based fungicide and remove mummified fruits.',
  Apple_Cedar_apple_rust: 'Apply fungicide at bloom time. Remove nearby juniper trees if possible.',
  Cherry_Powdery_mildew: 'Apply sulfur-based fungicide. Improve air circulation and avoid overhead watering.',
  Corn_Common_rust: 'Apply fungicide early. Use rust-resistant hybrids and ensure proper plant spacing.',
  Corn_Gray_leaf_spot: 'Rotate crops. Apply fungicide and use resistant varieties.',
  Corn_Northern_Leaf_Blight: 'Use resistant varieties. Apply fungicide if infection is severe. Rotate crops.',
  Grape_Black_rot: 'Remove infected berries. Apply fungicide and ensure good canopy management.',
  Grape_Esca: 'Prune infected wood. Apply fungicide and protect pruning wounds.',
  Grape_Leaf_blight: 'Apply fungicide. Remove infected leaves and improve air circulation.',
  Orange_Haunglongbing: 'Remove infected trees. Control psyllid vectors and use disease-free planting material.',
  Peach_Bacterial_spot: 'Apply copper bactericide. Use resistant varieties and avoid overhead irrigation.',
  Pepper_Bacterial_spot: 'Apply copper-based bactericide. Remove infected plants and rotate crops.',
  Potato_Early_blight: 'Apply fungicide. Remove infected plant material and ensure proper drainage.',
  Potato_Late_blight: 'Apply fungicide immediately. Remove infected plants and avoid overhead irrigation.',
  Squash_Powdery_mildew: 'Apply fungicide. Improve air circulation and avoid wetting foliage.',
  Strawberry_Leaf_scorch: 'Remove infected leaves. Apply fungicide and use resistant varieties.',
  Tomato_Bacterial_spot: 'Apply copper bactericide. Avoid overhead watering and remove infected plants.',
  Tomato_Early_blight: 'Apply copper fungicide. Remove lower infected leaves and mulch the soil.',
  Tomato_Late_blight: 'Apply fungicide. Remove infected plants and improve air circulation.',
  Tomato_Leaf_Mold: 'Improve ventilation. Reduce humidity and apply fungicide if needed.',
  Tomato_Septoria_leaf_spot: 'Remove infected leaves. Apply fungicide and avoid wetting foliage.',
  Tomato_Spider_mites: 'Apply miticide or neem oil. Increase humidity and remove badly affected leaves.',
  Tomato_Target_Spot: 'Apply fungicide. Remove infected material and avoid overhead irrigation.',
  Tomato_Yellow_Leaf_Curl_Virus: 'Control whitefly vectors. Remove infected plants and use resistant varieties.',
  Tomato_mosaic_virus: 'Remove infected plants immediately. Disinfect tools and control insect vectors.',
};

function parsePrediction(label: string): { crop: string; disease: string; suggestion: string } {
  const parts = label.split('___');
  const rawCrop = parts[0] ?? 'Unknown plant';
  const rawDisease = parts[1] ?? 'Unknown condition';

  const crop = rawCrop.replace(/_\(.*?\)/g, '').replace(/_/g, ' ').trim();
  const disease = rawDisease.replace(/_/g, ' ').trim();

  let suggestion = 'Consult a local agricultural expert for specific treatment advice.';
  for (const [key, value] of Object.entries(SUGGESTIONS)) {
    if (label.toLowerCase().includes(key.toLowerCase())) {
      suggestion = value;
      break;
    }
  }

  return { crop, disease, suggestion };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { imageBase64?: string; mimeType?: string };
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HUGGINGFACE_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    const binaryData = Buffer.from(imageBase64, 'base64');

    const hfResponse = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': mimeType || 'image/jpeg',
      },
      body: binaryData,
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      return NextResponse.json(
        { error: `Model inference failed: ${errorText}` },
        { status: 502 }
      );
    }

    const predictions = await hfResponse.json() as Array<{ label: string; score: number }>;

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json({ error: 'No predictions returned from model' }, { status: 502 });
    }

    const top = predictions[0];
    const { crop, disease, suggestion } = parsePrediction(top.label);
    const confidence = Math.round(top.score * 100);

    return NextResponse.json({ crop, disease, confidence, suggestion });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
