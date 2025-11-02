# Use official Flutter Docker image
FROM ghcr.io/cirruslabs/flutter:stable

WORKDIR /app

# Copy project files
COPY . .

# Get dependencies
RUN flutter pub get

# Build APK
RUN flutter build apk --debug

# Create shared directory and copy APK
RUN mkdir -p /shared && \
    cp build/app/outputs/flutter-apk/app-debug.apk /shared/client.apk && \
    echo "✓ APK built and copied to /shared/client.apk"
