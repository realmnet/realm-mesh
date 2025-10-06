package io.interrealm.controlplane.repository;

import io.interrealm.controlplane.entity.CanvasNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanvasNodeRepository extends JpaRepository<CanvasNode, Long> {

    List<CanvasNode> findByCanvasId(Long canvasId);

    Optional<CanvasNode> findByCanvasIdAndNodeId(Long canvasId, String nodeId);

    @Query("SELECT cn FROM CanvasNode cn WHERE cn.canvas.id = :canvasId AND cn.nodeType = :nodeType")
    List<CanvasNode> findByCanvasIdAndNodeType(@Param("canvasId") Long canvasId, @Param("nodeType") String nodeType);

    @Query("SELECT cn FROM CanvasNode cn WHERE cn.canvas.id = :canvasId AND cn.status = :status")
    List<CanvasNode> findByCanvasIdAndStatus(@Param("canvasId") Long canvasId, @Param("status") String status);

    void deleteByCanvasIdAndNodeId(Long canvasId, String nodeId);
}