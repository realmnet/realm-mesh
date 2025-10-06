package io.interrealm.controlplane.api;

import io.realmmesh.controlplane.controllers.CanvasApi;
import io.realmmesh.controlplane.models.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import java.time.OffsetDateTime;
import java.util.ArrayList;

@RestController
public class CanvasController implements CanvasApi {

    @Override
    public ResponseEntity<DeployCanvasResponse> deployCanvas(String canvasId) {
        DeployCanvasResponse response = new DeployCanvasResponse();
        response.setMessage("Canvas deployment started");
        response.setCanvasId(canvasId);
        response.setDeploymentId("deploy-" + UUID.randomUUID().toString());
        response.setStatus("PENDING");
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<GetCanvas200Response> getCanvas(UUID clusterId) {
        GetCanvas200Response response = new GetCanvas200Response();
        response.setCanvasId("canvas-" + clusterId.toString().substring(0, 8));
        response.setClusterId(clusterId);
        response.setVersion("1.0.0");
        response.setCreatedAt(OffsetDateTime.now().minusDays(1));
        response.setUpdatedAt(OffsetDateTime.now());
        response.setConfiguration("{}"); // Empty configuration placeholder
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<GetCanvasStatus200Response> getCanvasStatus(String canvasId) {
        GetCanvasStatus200Response response = new GetCanvasStatus200Response();
        response.setCanvasId(canvasId);
        response.setStatus("DEPLOYED");
        response.setMessage("Canvas is running successfully");
        response.setLastDeployedAt(OffsetDateTime.now().minusHours(2));
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<ListCanvases200Response> listCanvases(UUID clusterId) {
        ListCanvases200Response response = new ListCanvases200Response();
        response.setCanvases(new ArrayList<>());
        response.setTotal(0);
        response.setClusterId(clusterId);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<SaveCanvasResponse> saveCanvas(SaveCanvasRequest saveCanvasRequest) {
        SaveCanvasResponse response = new SaveCanvasResponse();
        response.setCanvasId("canvas-" + UUID.randomUUID().toString().substring(0, 8));
        response.setMessage("Canvas saved successfully");
        response.setVersion("1.0.0");
        response.setSavedAt(OffsetDateTime.now());
        return ResponseEntity.ok(response);
    }
}