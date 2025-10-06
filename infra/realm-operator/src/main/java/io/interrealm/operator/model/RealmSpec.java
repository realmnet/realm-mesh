package io.interrealm.operator.model;

public class RealmSpec {
    private String image;
    private String parentRealm;
    private Integer replicas = 1;

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getParentRealm() {
        return parentRealm;
    }

    public void setParentRealm(String parentRealm) {
        this.parentRealm = parentRealm;
    }

    public Integer getReplicas() {
        return replicas;
    }

    public void setReplicas(Integer replicas) {
        this.replicas = replicas;
    }
}