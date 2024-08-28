from flask import Flask, request, jsonify,send_from_directory
from flask_cors import CORS,cross_origin
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import os
import anthropic


# Load environment variables from .env file
load_dotenv()

app = Flask(__name__,static_folder='../frontend/build',static_url_path='')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Get Claude AI API key from environment variables
claude_api_key = os.getenv('CLAUDE_API_KEY')
@app.route('/')
@cross_origin(origins="*", supports_credentials=True)
def serve():
    return send_from_directory(app.static_folder,'index.html')

@app.route('/generate_poem', methods=['POST'], endpoint='generate_poem')
@cross_origin(origins="*", supports_credentials=True)
def generate_poem():
    data = request.json
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    def generate():
        anthropic_client = anthropic.Anthropic(api_key=claude_api_key)
        response = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=200,
            messages=[
                {"role": "user", "content": f"Write a poem about {prompt} in not more than 30 lines and dont't show any heading just generate the poem"}
            ],
            stream=True  # Enable streaming
        )

        poem = ""
        try:
            for chunk in response:
                if chunk.type == 'content_block_delta':
                    text = chunk.delta.text
                    if text:
                        poem += text
                        # print(f"Emitting new token: {text}")  # Debug print
                        socketio.emit('new_token', {'token': text})
                        socketio.sleep(0.1)  # simulate delay
            # print(f"Emitting complete poem: {poem}") 
            socketio.emit('poem_complete', {'poem': poem})

        except Exception as e:
            print(f"Error occurred: {e}")  # Debug print
            socketio.emit('poem_error', {'error': str(e)})

    socketio.start_background_task(generate)
    return jsonify({"status": "Generating poem..."}), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))  # Use the PORT environment variable or default to 5000
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
