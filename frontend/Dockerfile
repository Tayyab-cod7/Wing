FROM nginx:alpine

# Install envsubst
RUN apk add --no-cache bash

# Copy the nginx configuration template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy the built files
COPY public /app/public

# Copy start script
COPY start.sh /start.sh

# Make sure nginx can access the files and make start script executable
RUN chown -R nginx:nginx /app && \
    chmod -R 755 /app && \
    chmod +x /start.sh

# Expose the port nginx is running on
EXPOSE 80

# Start nginx with the environment variables
CMD ["/start.sh"] 