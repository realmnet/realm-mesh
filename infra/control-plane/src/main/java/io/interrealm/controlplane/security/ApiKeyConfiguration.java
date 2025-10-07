package io.interrealm.controlplane.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "api-key")
public class ApiKeyConfiguration {

    private String key = "realm";
    private List<String> bypassPaths = new ArrayList<>();

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public List<String> getBypassPaths() {
        return bypassPaths;
    }

    public void setBypassPaths(List<String> bypassPaths) {
        this.bypassPaths = bypassPaths;
    }
}