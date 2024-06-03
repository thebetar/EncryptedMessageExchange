from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
import base64

def generate_keys():
    # Generate private and public key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    
    public_key = private_key.public_key()
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return {
        'private_key': private_pem.decode(),
        'public_key': public_pem.decode()
    }
    
def encrypt_data(data, public_key):
    # Load public key
    public_key = serialization.load_pem_public_key(public_key.encode(), backend=default_backend())
    
    data = data.encode()
    
    # Encrypt data
    encrypted_data = public_key.encrypt(
        data,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    encrypted_data = base64.b64encode(encrypted_data)
    
    return encrypted_data.decode()

def decrypt_data(data, private_key):
    # Load private key
    private_key = serialization.load_pem_private_key(private_key.encode(), password=None, backend=default_backend())
    
    # Decrypt data
    data = base64.b64decode(data)
    decrypted_data = private_key.decrypt(
        data,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    return decrypted_data.decode()
