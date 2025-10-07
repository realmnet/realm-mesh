package io.interrealm.controlplane.api;

import io.realmmesh.controlplane.controllers.RouterApi;
import io.realmmesh.controlplane.models.MessageEnvelope;
import io.realmmesh.controlplane.models.RouteResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class RouterController implements RouterApi {

    private static final Logger logger = LoggerFactory.getLogger(RouterController.class);

    @Override
    public ResponseEntity<RouteResponse> routeMessage(MessageEnvelope messageEnvelope) {
        logger.info("Received message for routing: messageId={}, sourceRealm={}, targetRealm={}, messageType={}",
                messageEnvelope.getMessageId(),
                messageEnvelope.getSourceRealm(),
                messageEnvelope.getTargetRealm(),
                messageEnvelope.getMessageType());

        // TODO: Implement actual routing logic
        // For now, we'll just accept the message and return a response

        RouteResponse response = new RouteResponse();
        response.setAccepted(true);
        response.setMessageId(messageEnvelope.getMessageId());
        response.setTimestamp(OffsetDateTime.now());
        response.setRoute(String.format("%s -> %s",
                messageEnvelope.getSourceRealm(),
                messageEnvelope.getTargetRealm()));

        logger.info("Message accepted for routing: messageId={}", messageEnvelope.getMessageId());

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
}