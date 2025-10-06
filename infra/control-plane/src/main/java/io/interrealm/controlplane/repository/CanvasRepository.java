package io.interrealm.controlplane.repository;

import io.interrealm.controlplane.entity.Canvas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanvasRepository extends JpaRepository<Canvas, Long> {

    Optional<Canvas> findByName(String name);

    @Query("SELECT c FROM Canvas c LEFT JOIN FETCH c.nodes LEFT JOIN FETCH c.edges WHERE c.id = :id")
    Optional<Canvas> findByIdWithNodesAndEdges(@Param("id") Long id);

    @Query("SELECT c FROM Canvas c ORDER BY c.updatedAt DESC")
    List<Canvas> findAllOrderByUpdatedAtDesc();

    boolean existsByName(String name);
}