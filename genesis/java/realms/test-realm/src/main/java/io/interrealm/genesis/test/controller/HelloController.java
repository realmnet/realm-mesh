package io.interrealm.genesis.test.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Test Realm!";
    }

    @GetMapping("/health")
    public String health() {
        return "Test Realm is healthy";
    }
}