package io.interrealm.controlplane.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

//@Component  // Disabled for now
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    @Value("${CONTROL_PLANE_API_KEY:dev-test-key-12345}")
    private String apiKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String expectedBearer = "Bearer " + apiKey;

        if (authHeader == null || !authHeader.equals(expectedBearer)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Valid API key required\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}