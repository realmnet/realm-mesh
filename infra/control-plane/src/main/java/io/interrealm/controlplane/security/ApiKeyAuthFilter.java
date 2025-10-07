package io.interrealm.controlplane.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ApiKeyConfiguration apiKeyConfiguration;
    private final AntPathMatcher pathMatcher;

    @Autowired
    public ApiKeyAuthFilter(ApiKeyConfiguration apiKeyConfiguration) {
        this.apiKeyConfiguration = apiKeyConfiguration;
        this.pathMatcher = new AntPathMatcher();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        // Check if the current request path should bypass API key authentication
        for (String bypassPath : apiKeyConfiguration.getBypassPaths()) {
            if (pathMatcher.match(bypassPath, requestPath)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        String authHeader = request.getHeader("Authorization");
        String expectedBearer = "Bearer " + apiKeyConfiguration.getKey();

        if (authHeader == null || !authHeader.equals(expectedBearer)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Valid API key required\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}