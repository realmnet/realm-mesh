package io.interrealm.operator;

import io.javaoperatorsdk.operator.Operator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@SpringBootApplication
public class RealmOperatorApplication {
    private static final Logger log = LoggerFactory.getLogger(RealmOperatorApplication.class);

    @Autowired
    private RealmReconciler realmReconciler;

    @Autowired
    private Operator operator;

    public static void main(String[] args) {
        SpringApplication.run(RealmOperatorApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("Registering RealmReconciler with operator...");
        operator.register(realmReconciler);
        log.info("Starting operator...");
        operator.start();
        log.info("Realm Operator is running and watching for Realm resources...");
        log.info("Press Ctrl+C to stop");
    }
}