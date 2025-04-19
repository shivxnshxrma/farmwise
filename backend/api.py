from flask import Flask, request, jsonify
from flask_cors import CORS
from workflow import run_workflow, FarmerState
from dotenv import load_dotenv
import logging

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """
    Endpoint to get agricultural subsidy recommendations based on farmer profile
    Expected JSON input format:
    {
        "profile": {
            "district": "Pune",
            "state": "Maharashtra",
            "land_size": "2 hectares",
            "crop_type": "wheat",
            "village": "",
            "ownership": "owned",
            "irrigation": "rain-fed",
            "income": "150000",
            "caste_category": "general",
            "bank_account": "yes",
            "existing_schemes": "none"
        },
        "feedback": null  # Optional for refinement
    }
    """
    try:
        # Validate and parse input
        data = request.get_json()
        if not data or 'profile' not in data:
            return jsonify({
                "error": "Invalid request format",
                "message": "Profile data is required"
            }), 400

        # Required fields validation
        required_fields = ['district', 'state', 'land_size', 'crop_type']
        for field in required_fields:
            if field not in data['profile'] or not data['profile'][field]:
                return jsonify({
                    "error": "Missing required field",
                    "message": f"{field} is required in profile"
                }), 400

        # Prepare initial state
        initial_state: FarmerState = {
            "profile": {
                "village": data['profile'].get('village', ''),
                "district": data['profile']['district'],
                "state": data['profile']['state'],
                "land_size": data['profile']['land_size'],
                "land_ownership": data['profile'].get('ownership', 'owned').lower(),
                "crop_type": data['profile']['crop_type'],
                "irrigation": data['profile'].get('irrigation', 'rain-fed').lower(),
                "income": data['profile'].get('income', '0'),
                "caste_category": data['profile'].get('caste_category', 'general').lower(),
                "bank_account": data['profile'].get('bank_account', 'yes').lower(),
                "existing_schemes": data['profile'].get('existing_schemes', 'none').lower()
            },
            "schemes": [],
            "recommendations": None,
            "refinement_needed": False,
            "feedback": data.get('feedback'),
            "visuals": []
        }

        logger.info(f"Processing request for farmer in {initial_state['profile']['district']}, {initial_state['profile']['state']}")

        # Run the workflow
        result = run_workflow(initial_state)

        # Format the response
        response = {
            "status": "success",
            "data": {
                "profile": result["profile"],
                "recommendations": result["recommendations"],
                "schemes": [
                    {
                        "title": doc.metadata.get('title', 'Untitled'),
                        "summary": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                        "url": doc.metadata.get('url', ''),
                        "source": doc.metadata.get('source', 'unknown')
                    }
                    for doc in result["schemes"]
                ],
                "visuals": result.get("visuals", []),
                "needs_refinement": result.get("refinement_needed", False)
            },
            "metadata": {
                "farmer_type": result["profile"].get("farmer_type", "unknown"),
                "needs_insurance": result["profile"].get("needs_insurance", "unknown")
            }
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "error": str(e),
            "message": "Failed to process request"
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)