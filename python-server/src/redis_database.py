import redis
import os

REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_URL = f'redis://{REDIS_HOST}:6379'

def getRedisClient(tries = 0):
    try:
        if tries > 5:
            print(f'Error connection to redis: {REDIS_URL}')
            return None
        
        return {
            'client': redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True),
            'pubsub': redis.StrictRedis(host=REDIS_HOST, port=6379, decode_responses=True),
        }
    except Exception as e:
        print(f'Error connecting to Redis: {e}')
        
        tries += 1
        
        return getRedisClient(tries)
