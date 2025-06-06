#!/bin/bash

# Build the Docker image
docker build -t frontend-test .

# Run the container with a test port
docker run -e PORT=3000 -p 3000:3000 frontend-test 