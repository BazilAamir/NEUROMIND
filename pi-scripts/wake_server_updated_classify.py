# ===============================
# UPDATED /classify ENDPOINT
# Replace the existing /classify function in wake_server.py with this
# ===============================

# Add these imports at the top of wake_server.py:
# import json
# import sys
# sys.path.append('/home/neuromind/Downloads/combined_handler_ds_abnormal_control')
# from handler_combined import CombinedEEGHandler

# Configuration - add near the top
CONFIG_PATH = '/home/neuromind/Downloads/combined_handler_ds_abnormal_control/config_combined.json'
UPLOADS_FOLDER = '/home/neuromind/Neuromind/Codes/uploads'

# Global handler (lazy loaded)
_classification_handler = None

def get_classification_handler():
    """Lazy load the classification handler"""
    global _classification_handler
    if _classification_handler is None:
        print("🔧 Loading CombinedEEGHandler...")
        from handler_combined import CombinedEEGHandler
        _classification_handler = CombinedEEGHandler(CONFIG_PATH)
        print("✅ Handler loaded successfully")
    return _classification_handler


@app.route('/classify', methods=['POST'])
def classify():
    """
    Run two-stage classification using CombinedEEGHandler.
    Returns the full result dict with stage1/stage2 details.
    """
    try:
        import glob
        import time

        start_time = time.time()
        print("🧠 Running two-stage classification...")

        # Find the most recent EDF file in uploads folder
        edf_files = glob.glob(os.path.join(UPLOADS_FOLDER, '*.edf'))
        if not edf_files:
            return jsonify({
                'success': False,
                'error': 'No EDF file found in uploads folder'
            }), 400

        # Get most recent file
        edf_path = max(edf_files, key=os.path.getmtime)
        print(f"📁 Processing: {os.path.basename(edf_path)}")

        # Get handler and run prediction
        handler = get_classification_handler()
        result = handler.predict_file(edf_path)

        # Calculate timing
        elapsed = time.time() - start_time
        timing = f"{elapsed:.2f}s"

        # Convert result to JSON-serializable format
        # (remove window_results DataFrame, keep everything else)
        response_result = {
            'subject_id': result.get('subject_id', 'Unknown'),
            'final_label': result.get('final_label', 'Unknown'),
            'n_windows': result.get('n_windows', 0),
            'stage1_prediction': result.get('stage1_prediction'),
            'stage1_confidence': result.get('stage1_confidence'),
            'stage1_votes': result.get('stage1_votes'),
            'stage1_mean_probs': result.get('stage1_mean_probs'),
            'stage2_prediction': result.get('stage2_prediction'),
            'stage2_confidence': result.get('stage2_confidence'),
            'stage2_votes': result.get('stage2_votes'),
            'stage2_mean_probs': result.get('stage2_mean_probs'),
        }

        print(f"✅ Classification complete: {response_result['final_label']}")
        print(f"   Stage 1: {response_result['stage1_prediction']} ({response_result['stage1_confidence']})")
        print(f"   Stage 2: {response_result['stage2_prediction']} ({response_result['stage2_confidence']})")

        return jsonify({
            'success': True,
            'result': response_result,
            'timing': timing
        }), 200

    except FileNotFoundError as e:
        print(f"❌ File not found: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'File not found: {str(e)}'
        }), 404
    except RuntimeError as e:
        print(f"❌ Runtime error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        print(f"❌ Classification exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
