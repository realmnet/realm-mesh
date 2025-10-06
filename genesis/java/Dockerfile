# Multi-stage build for optimal image size
FROM gradle:8.5-jdk17 AS builder

WORKDIR /app

# Copy gradle files first for better caching
COPY gradlew gradlew
COPY gradle gradle
COPY gradle.properties gradle.properties
COPY settings.gradle.kts settings.gradle.kts
COPY build.gradle.kts build.gradle.kts

# Copy realms module
COPY realms realms

# Build the application
RUN cd realms/test-realm && ../../gradlew bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre

WORKDIR /app

# Create non-root user for security
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup appuser

# Copy the built jar from builder stage
COPY --from=builder /app/realms/test-realm/build/libs/*.jar app.jar

# Change ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]