# Use the official Node.js image as the base image
FROM node:alpine3.20 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the Vite project
RUN npm run build

# Install serve globally
FROM node:alpine3.20 as publish

WORKDIR /app

COPY --from=build app/dist /app/dist

COPY --from=build app/package*.json /app/

RUN npm install -g serve

# Expose the port serve will run on
EXPOSE 5173

# Command to run serve, serving the built files from the dist directory
CMD ["serve", "-s", "dist", "-l", "5173"]
