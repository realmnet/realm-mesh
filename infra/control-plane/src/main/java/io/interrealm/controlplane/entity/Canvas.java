package io.interrealm.controlplane.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.List;

@Entity
@Table(name = "canvas")
public class Canvas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 50)
    private String layout = "grid";

    @Column(name = "created_at")
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @OneToMany(mappedBy = "canvas", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CanvasNode> nodes;

    @OneToMany(mappedBy = "canvas", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CanvasEdge> edges;

    @PrePersist
    protected void onCreate() {
        createdAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLayout() {
        return layout;
    }

    public void setLayout(String layout) {
        this.layout = layout;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ZonedDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(ZonedDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<CanvasNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<CanvasNode> nodes) {
        this.nodes = nodes;
    }

    public List<CanvasEdge> getEdges() {
        return edges;
    }

    public void setEdges(List<CanvasEdge> edges) {
        this.edges = edges;
    }
}