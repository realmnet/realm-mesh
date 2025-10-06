package io.interrealm.operator.model;

import io.fabric8.kubernetes.api.model.Namespaced;
import io.fabric8.kubernetes.client.CustomResource;
import io.fabric8.kubernetes.model.annotation.Group;
import io.fabric8.kubernetes.model.annotation.Version;

@Group("interrealm.io")
@Version("v1")
public class Realm extends CustomResource<RealmSpec, RealmStatus> implements Namespaced {

    @Override
    protected RealmSpec initSpec() {
        return new RealmSpec();
    }

    @Override
    protected RealmStatus initStatus() {
        return new RealmStatus();
    }
}