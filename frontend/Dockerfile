FROM nginx:alpine

# Install envsubst
RUN apk add --no-cache bash

# Copy the nginx configuration template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy the built files
COPY public /app/public

# Make sure nginx can access the files
RUN chown -R nginx:nginx /app && chmod -R 755 /app

# Create start script
RUN echo '#!/bin/bash\n\
PORT="${PORT:-80}"\n\
envsubst \'${PORT}\' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf\n\
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

# Expose the port nginx is running on
EXPOSE 80

# Start nginx with the environment variables
CMD ["/start.sh"] 