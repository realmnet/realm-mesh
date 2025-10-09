package io.interrealm.controlplane.api;

import io.realmmesh.controlplane.controllers.MeshApi;
import io.realmmesh.controlplane.models.MeshInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class RealmMeshController implements MeshApi {

    @Value("${realmmesh.id}")
    private String id;

    @Value("${realmmesh.name}")
    private String name;

    @Value("${realmmesh.version:1.0.0}")
    private String version;

    @Value("${realmmesh.environment:dev}")
    private String environment;

    @Override
    public ResponseEntity<MeshInfo> getMeshInfo() {
        MeshInfo meshInfo = new MeshInfo();
        meshInfo.setUuid(UUID.fromString(id));
        meshInfo.setName(name);
        meshInfo.setVersion(version);
        meshInfo.setEnvironment(environment);

        return ResponseEntity.ok(meshInfo);
    }
}