import type { TreeNode, ValidationIssue } from "./types"

/**
 * Validates the RealmMesh tree and returns issues
 */
export function validateTree(nodes: TreeNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Find all pods and check their required capabilities
  const pods = nodes.filter((n) => n.type === "pod")
  const capabilities = nodes.filter((n) => n.type === "capability")
  const bridges = nodes.filter((n) => n.type === "bridge")

  // Check for unresolved contracts
  pods.forEach((pod) => {
    const podData = pod.data as any
    const requiredCapabilities = podData.requiredCapabilities || []

    requiredCapabilities.forEach((reqCap: string) => {
      const capExists = capabilities.some((cap) => cap.name === reqCap || cap.data?.name === reqCap)

      if (!capExists) {
        issues.push({
          id: `error_${pod.id}_${reqCap}`,
          nodeId: pod.id,
          path: getNodePath(pod, nodes),
          message: `Unresolved contract: requires capability "${reqCap}" which is not available`,
          severity: "error",
          category: "contract",
        })
      }
    })
  })

  // Check for disconnected bridges
  bridges.forEach((bridge) => {
    if (bridge.status === "disconnected" || bridge.status === "error") {
      issues.push({
        id: `error_${bridge.id}_disconnected`,
        nodeId: bridge.id,
        path: getNodePath(bridge, nodes),
        message: `Bridge "${bridge.name}" is ${bridge.status}`,
        severity: "error",
        category: "status",
      })
    }
  })

  // Check for pods in error state
  pods.forEach((pod) => {
    if (pod.status === "error") {
      issues.push({
        id: `error_${pod.id}_status`,
        nodeId: pod.id,
        path: getNodePath(pod, nodes),
        message: `Pod "${pod.name}" is in error state`,
        severity: "error",
        category: "status",
      })
    } else if (pod.status === "degraded") {
      issues.push({
        id: `warning_${pod.id}_status`,
        nodeId: pod.id,
        path: getNodePath(pod, nodes),
        message: `Pod "${pod.name}" is degraded`,
        severity: "warning",
        category: "status",
      })
    }
  })

  // Check for gateways with no capabilities
  const gateways = nodes.filter((n) => n.type === "gateway")
  gateways.forEach((gateway) => {
    const gatewayCapabilities = capabilities.filter((cap) => isDescendantOf(cap, gateway, nodes))
    if (gatewayCapabilities.length === 0) {
      issues.push({
        id: `info_${gateway.id}_no_caps`,
        nodeId: gateway.id,
        path: getNodePath(gateway, nodes),
        message: `Gateway "${gateway.name}" has no capabilities defined`,
        severity: "info",
        category: "configuration",
      })
    }
  })

  return issues
}

/**
 * Gets the full path of a node in the tree
 */
function getNodePath(node: TreeNode, allNodes: TreeNode[]): string {
  const path: string[] = [node.name]
  let current = node

  while (current.parent) {
    const parent = allNodes.find((n) => n.id === current.parent)
    if (!parent) break
    path.unshift(parent.name)
    current = parent
  }

  return path.join(" / ")
}

/**
 * Checks if a node is a descendant of another node
 */
function isDescendantOf(node: TreeNode, ancestor: TreeNode, allNodes: TreeNode[]): boolean {
  let current = node
  while (current.parent) {
    if (current.parent === ancestor.id) return true
    const parent = allNodes.find((n) => n.id === current.parent)
    if (!parent) break
    current = parent
  }
  return false
}
