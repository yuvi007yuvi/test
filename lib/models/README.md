# Face API Models

This directory should contain the face-api.js model files. Download them from the official repository:

## Required Models

1. **ssd_mobilenetv1_model-weights_manifest.json**
2. **ssd_mobilenetv1_model-shard1**
3. **face_landmark_68_model-weights_manifest.json**
4. **face_landmark_68_model-shard1**
5. **face_recognition_model-weights_manifest.json**
6. **face_recognition_model-shard1**
7. **face_expression_model-weights_manifest.json**
8. **face_expression_model-shard1**

## Download Instructions

1. Clone the face-api.js repository:
   ```bash
   git clone https://github.com/justadudewhohacks/face-api.js.git
   ```

2. Copy the model files from `face-api.js/weights/` to this directory:
   ```bash
   cp face-api.js/weights/* ./lib/models/
   ```

3. Or download directly from the CDN and extract the models.

## Alternative: Use CDN Models

You can also modify the `face-api-setup.js` file to load models from CDN:

```javascript
const modelsPath = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/';
```

## File Structure

```
lib/models/
├── ssd_mobilenetv1_model-weights_manifest.json
├── ssd_mobilenetv1_model-shard1
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1
├── face_recognition_model-weights_manifest.json
├── face_recognition_model-shard1
├── face_expression_model-weights_manifest.json
├── face_expression_model-shard1
└── README.md
```
