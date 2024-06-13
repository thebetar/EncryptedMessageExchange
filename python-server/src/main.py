import secrets
import os
import json
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, disconnect, emit
from redis_database import getRedisClient
from encryption import encrypt_data, decrypt_data, generate_keys
import datetime

app = Flask(__name__)

keys = {
    'public_key': '',
    'private_key': ''
}
keys = generate_keys()

redis_client = getRedisClient()

SERVER_NAME  = os.getenv('SERVER_NAME', secrets.token_hex(20))

@app.get("/server-name")
def get_server_name():
    return SERVER_NAME

@app.get('/test')
def test():
    return 'Server is running! 🚀'

@app.get('/users')
def get_users():
    if 'api_key' not in request.headers or request.headers['api_key'] != API_KEY:
        return jsonify({'error': 'Invalid API key'}), 401
    
    clients = json.loads(redis_client['client'].get('clients') or '[]')
    
    return jsonify(clients)

@app.get('/messages')
def get_messages():
    if 'api_key' not in request.headers or request.headers['api_key'] != API_KEY:
        return jsonify({'error': 'Invalid API key'}), 401
    
    messages = json.loads(redis_client['client'].get('messages') or '[]')
    
    return jsonify(messages)

# Return answer and kill
@app.get('/kill')
def kill():
    response = jsonify({'message': 'Server is shutting down...'})
    
    response.call_on_close(lambda: os._exit(0))
    
    return response

API_KEY_PASSWORD = os.getenv('API_KEY_PASSWORD', 'api-password')
API_KEY = os.getenv('API_KEY', '194b01740bd8ae752ed224917feb21e98955c685a63a50302ea5b42fa2a0528d')

@app.post('/login')
def login():
    password = request.json.get('password')
    
    # Check is body password is equal to API_KEY_PASSWORD
    if password == API_KEY_PASSWORD:
        return jsonify({'apiKey': API_KEY})
    else:
        return jsonify({'error': 'Invalid password'}), 401

socketio = SocketIO(app, cors_allowed_origins="*")
sockets = []

# Handle new user
def new_user(id, username, public_key):
    # Create new user object
    new_client = {
        'id': id,
        'username': username,
        'public_key': public_key,
        'online': True
    }

    # Get clients from Redis
    clients = json.loads(redis_client['client'].get('clients') or '[]')

    # If client id exists remove them
    if any(client['id'] == id for client in clients):
        clients = [client for client in clients if client['id'] != id]
        
    # If username exists replace them
    if any(client['username'] == username for client in clients):
        old_client = next(client for client in clients if client['username'] == username)
        clients = [client for client in clients if client['username'] != username]
        
        # Get messages to rewrite client ID
        messages = json.loads(redis_client['client'].get('messages') or '[]')
        
        # Replace old id with new id in messages
        for message in [message for message in messages if message['client'] == old_client['id']]:
            message['client'] = id
            
        # Save messages to Redis
        redis_client['client'].set('messages', json.dumps(messages))
    
    # Add user
    clients.append(new_client)
    
    # Save clients to Redis
    redis_client['client'].set('clients', json.dumps(clients))
    
    # Send update
    redis_client['pubsub'].publish('database-update', 'new-message')

# On connection check if api key was deliverd as ath
@socketio.on('connect')
def handle_connect(auth):
    api_key = auth.get('api_key')
    
    if not api_key or api_key != API_KEY:
        disconnect()
        return
    
    sockets.append(request.sid)

    username = request.args.get('username')
    new_user(request.sid, username, auth.get('public_key'))
    
    emit('keys', {
        'publicKey': keys['public_key']
    })

    print('A user connected! 🎉')
    
@socketio.on('chat-message')
def on_message(data):
    # Get all messages
    messages = json.loads(redis_client['client'].get('messages') or '[]')
    
    # Decrypt data
    decrypted_data = decrypt_data(data, keys['private_key'])
    
    # Add message to messages
    messages.append({
        'client': request.sid,
        'message': decrypted_data,
        'timestamp': datetime.datetime.now().isoformat()
    })
    
    # Save messages to Redis
    redis_client['client'].set('messages', json.dumps(messages))
    
    # Send update
    redis_client['pubsub'].publish('database-update', 'new-message')
    
@socketio.on('disconnect')
def handle_disconnect():
    # Get all clients
    clients = json.loads(redis_client['client'].get('clients') or '[]')
    
    # Set disconnecting client to offline
    for client in clients:
        if client['id'] == request.sid:
            client['online'] = False
    
    # Save clients to Redis
    redis_client['client'].set('clients', json.dumps(clients))
    
    # Remove from sockets
    sockets.remove(request.sid)
    
    # Send update
    redis_client['pubsub'].publish('database-update', 'new-message')
    
    print('A user disconnected! 😢')
    
PORT = os.getenv('PORT', 3000)
RESET = True

# Reset chat history
if RESET:
    redis_client['client'].set('messages', json.dumps([]))
    redis_client['client'].set('clients', json.dumps([]))

if __name__ == '__main__':
    
    socketio.run(app)
    app.run(port=PORT, debug=True)

pubsub = redis_client['pubsub'].pubsub()
pubsub.subscribe('database-update')

def background_thread():
    for message in pubsub.listen():
        if message['type'] == 'message':
            # Get all client data and messages
            clients = json.loads(redis_client['client'].get('clients') or '[]')
            messages = json.loads(redis_client['client'].get('messages') or '[]')

            # Send data to clients
            data = {
                'clients': clients,
                'messages': messages
            }

            for socket_id in sockets:
                public_key = next((client['public_key'] for client in clients if client['id'] == socket_id), None)
                
                if not public_key:
                    continue
                
                # Deep copy of the data
                data_copy = json.loads(json.dumps(data))
                
                for message in data_copy['messages']:
                    encrypted_message = encrypt_data(message['message'], public_key)
                    
                    message['message'] = encrypted_message
                    
                for client in data_copy['clients']:
                    if client.get('public_key'):
                        del client['public_key']
                
                socketio.emit('socket-update', data_copy, to=socket_id)
            
socketio.start_background_task(background_thread)