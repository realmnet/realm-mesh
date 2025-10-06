package io.interrealm.controlplane.repository;

import io.interrealm.controlplane.entity.CanvasEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CanvasEdgeRepository extends JpaRepository<CanvasEdge, Long> {

    List<CanvasEdge> findByCanvasId(Long canvasId);

    @Query("SELECT ce FROM CanvasEdge ce WHERE ce.canvas.id = :canvasId AND ce.sourceNodeId = :nodeId")
    List<CanvasEdge> findByCanvasIdAndSourceNodeId(@Param("canvasId") Long canvasId, @Param("nodeId") String nodeId);

    @Query("SELECT ce FROM CanvasEdge ce WHERE ce.canvas.id = :canvasId AND ce.targetNodeId = :nodeId")
    List<CanvasEdge> findByCanvasIdAndTargetNodeId(@Param("canvasId") Long canvasId, @Param("nodeId") String nodeId);

    @Query("SELECT ce FROM CanvasEdge ce WHERE ce.canvas.id = :canvasId AND (ce.sourceNodeId = :nodeId OR ce.targetNodeId = :nodeId)")
    List<CanvasEdge> findByCanvasIdAndNodeId(@Param("canvasId") Long canvasId, @Param("nodeId") String nodeId);

    @Query("SELECT ce FROM CanvasEdge ce WHERE ce.canvas.id = :canvasId AND ce.edgeType = :edgeType")
    List<CanvasEdge> findByCanvasIdAndEdgeType(@Param("canvasId") Long canvasId, @Param("edgeType") String edgeType);

    void deleteByCanvasIdAndSourceNodeIdAndTargetNodeId(Long canvasId, String sourceNodeId, String targetNodeId);
}