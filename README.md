# Serverless Image Processor
Serverless image processor that uses sharp. The docker-compose.yml may be very helpful if not building from a Linux environment for building the sharp binaries.


A bucket name must be set up in the serverless.yml as well as in the handler.ts (planning to improve that). Also, AWS-access related variables can be configured in the docker compose.
