# Instructions

To run the database run the following command

```bash
docker run --name encrypted-message-exchange --publish 6379:6379 --volume ./data:/data -d redis
```
