/**
 * Multi-party (circular) skill exchange matching.
 *
 * MOTIVATION:
 * Existing student skill-exchange platforms in the literature (SkillSwap,
 * SkillMesh, and similar) match users pairwise: A offers what B wants AND
 * B offers what A wants. This requires a "double coincidence of wants",
 * which the barter/time-banking literature identifies as the main reason
 * direct exchange fails in practice.
 *
 * This module removes that restriction by modelling the community as a
 * DIRECTED GRAPH and searching for CYCLES:
 *
 *     node  = a student
 *     edge  A -> B  = "A can teach something B wants"
 *
 * A cycle A -> B -> C -> A is a valid 3-way exchange: everyone teaches
 * one person and learns from another, even though no two of them could
 * have traded directly. Pairwise matching is just the special case of a
 * cycle of length 2, so this strictly generalises the existing approach.
 *
 * COMPLEXITY: O(V * (V+E) * k) worst case for max length k.
 */

export function buildExchangeGraph(offers, wants) {
  const wantersByCategory = new Map();
  for (const want of wants) {
    if (!wantersByCategory.has(want.category_id)) {
      wantersByCategory.set(want.category_id, []);
    }
    wantersByCategory.get(want.category_id).push(want.user_id);
  }

  const edges = new Map();
  for (const offer of offers) {
    const wanters = wantersByCategory.get(offer.category_id) || [];
    for (const wanterId of wanters) {
      if (wanterId === offer.user_id) continue;
      if (!edges.has(offer.user_id)) edges.set(offer.user_id, []);
      edges.get(offer.user_id).push({
        to: wanterId,
        skillId: offer.id,
        skillTitle: offer.title,
        categoryName: offer.category_name,
      });
    }
  }
  return edges;
}

export function findCyclesForUser(edges, startUserId, maxLength = 5) {
  const cycles = [];
  const seen = new Set();

  function dfs(currentUser, path, visited) {
    if (path.length >= maxLength) return;

    const outgoing = edges.get(currentUser) || [];
    for (const edge of outgoing) {
      if (edge.to === startUserId) {
        if (path.length < 1) continue;
        const cycle = [...path, { from: currentUser, ...edge }];
        const key = cycleKey(cycle);
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
        continue;
      }
      if (visited.has(edge.to)) continue;

      visited.add(edge.to);
      dfs(edge.to, [...path, { from: currentUser, ...edge }], visited);
      visited.delete(edge.to);
    }
  }

  dfs(startUserId, [], new Set([startUserId]));
  return cycles;
}

function cycleKey(cycle) {
  const users = cycle.map((step) => step.from);
  let minIdx = 0;
  for (let i = 1; i < users.length; i++) {
    if (users[i] < users[minIdx]) minIdx = i;
  }
  const rotated = [...users.slice(minIdx), ...users.slice(0, minIdx)];
  return rotated.join("-");
}

export function rankCycles(cycles) {
  return [...cycles].sort((a, b) => a.length - b.length);
}