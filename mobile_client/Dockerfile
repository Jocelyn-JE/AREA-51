# Use official Flutter Docker image
FROM ghcr.io/cirruslabs/flutter:stable

WORKDIR /app

# Copy project files
COPY . .

# Get dependencies
RUN flutter pub get

# Build APK
RUN flutter build apk --debug

# Create directory and copy APK for later use
RUN mkdir -p /app/shared && \
    cp build/app/outputs/flutter-apk/app-debug.apk /app/shared/client.apk && \
    echo "✓ APK built and ready at /app/shared/client.apk"
