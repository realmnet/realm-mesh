package io.interrealm.operator;

import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.interrealm.operator.model.Realm;
import io.interrealm.operator.model.RealmStatus;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.ControllerConfiguration;
import io.javaoperatorsdk.operator.api.reconciler.Reconciler;
import io.javaoperatorsdk.operator.api.reconciler.UpdateControl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@ControllerConfiguration
public class RealmReconciler implements Reconciler<Realm> {

    private static final Logger log = LoggerFactory.getLogger(RealmReconciler.class);
    private final KubernetesClient client;

    public RealmReconciler(KubernetesClient client) {
        this.client = client;
    }

    @Override
    public UpdateControl<Realm> reconcile(Realm realm, Context<Realm> context) {
        log.info("Reconciling Realm: {}", realm.getMetadata().getName());

        String namespace = realm.getMetadata().getNamespace();
        String realmName = realm.getMetadata().getName();
        String deploymentName = realmName + "-deployment";

        Deployment deployment = buildDeployment(realm, deploymentName);

        Deployment existing = client.apps().deployments()
            .inNamespace(namespace)
            .withName(deploymentName)
            .get();

        if (existing == null) {
            log.info("Creating deployment for Realm: {}", realmName);
            client.apps().deployments()
                .inNamespace(namespace)
                .create(deployment);
        } else {
            log.info("Updating deployment for Realm: {}", realmName);
            client.apps().deployments()
                .inNamespace(namespace)
                .withName(deploymentName)
                .replace(deployment);
        }

        // Status update is optional - don't fail reconciliation if it fails
        try {
            RealmStatus status = new RealmStatus();
            status.setDeploymentName(deploymentName);
            status.setPhase("Running");
            realm.setStatus(status);
            return UpdateControl.patchStatus(realm);
        } catch (Exception e) {
            log.warn("Could not update status for Realm {}: {}", realmName, e.getMessage());
            return UpdateControl.noUpdate();
        }
    }

    private Deployment buildDeployment(Realm realm, String deploymentName) {
        String image = realm.getSpec().getImage();
        Integer replicas = realm.getSpec().getReplicas();
        String parentRealm = realm.getSpec().getParentRealm();

        Map<String, String> labels = Map.of(
            "app", "realm",
            "realm-name", realm.getMetadata().getName(),
            "managed-by", "realm-operator"
        );

        Deployment deployment = new DeploymentBuilder()
            .withNewMetadata()
                .withName(deploymentName)
                .withNamespace(realm.getMetadata().getNamespace())
                .withLabels(labels)
            .endMetadata()
            .withNewSpec()
                .withReplicas(replicas)
                .withNewSelector()
                    .withMatchLabels(Map.of("app", "realm", "realm-name", realm.getMetadata().getName()))
                .endSelector()
                .withNewTemplate()
                    .withNewMetadata()
                        .withLabels(labels)
                    .endMetadata()
                    .withNewSpec()
                        .addNewContainer()
                            .withName("realm")
                            .withImage(image)
                            .addNewPort()
                                .withContainerPort(8080)
                                .withName("http")
                            .endPort()
                            .withEnv(parentRealm != null ?
                                List.of(new io.fabric8.kubernetes.api.model.EnvVarBuilder()
                                    .withName("PARENT_REALM")
                                    .withValue(parentRealm)
                                    .build()) :
                                List.of())
                        .endContainer()
                    .endSpec()
                .endTemplate()
            .endSpec()
            .build();

        return deployment;
    }
}