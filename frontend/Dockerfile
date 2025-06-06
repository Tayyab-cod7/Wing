FROM nginx:alpine

# Copy the nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built files
COPY public /app/public

# Make sure nginx can access the files
RUN chown -R nginx:nginx /app && chmod -R 755 /app

# Expose the port nginx is running on
EXPOSE 80

# Use the nginx.conf
CMD ["nginx", "-g", "daemon off;"] 