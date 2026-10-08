"use client";

/**
 * TranslationFix — Google Translate / browser-translation crash guard.
 *
 * Problem: translation extensions (Google Translate, DeepL, etc.) inject
 * `<font>` tags and re-parent text nodes while React still holds references
 * to the original DOM layout. React then calls `removeChild` / `insertBefore`
 * with stale references → fatal `NotFoundError: Failed to execute
 * 'insertBefore' on 'Node'` → the whole app unmounts with a blank screen.
 *
 * Fix: monkey-patch `Node.prototype.removeChild` and `Node.prototype.insertBefore`
 * with defensive wrappers that tolerate re-parented nodes instead of throwing.
 * Applied once per browser session, before any React tree mounts.
 */

import { useEffect } from "react";

declare global {
  interface Node {
    __cgTfPatched?: boolean;
  }
}

function installPatch(): () => void {
  if (typeof window === "undefined") return () => {};
  const proto = Node.prototype as unknown as Record<string, any>;

  // Already installed (e.g. React strict double-mount) — skip.
  if (proto.__cgTfPatched) return () => {};

  const originalRemoveChild = proto.removeChild;
  const originalInsertBefore = proto.insertBefore;

  const patchedRemoveChild = function (
    this: Node,
    child: Node,
    ...args: unknown[]
  ): Node {
    // Tolerate children that were re-parented by the translation extension.
    if (child && child.parentNode !== this) {
      // If the extension moved the node elsewhere, detach it from its actual
      // parent so React's mental model stays coherent (no throw).
      try {
        if (child.parentNode) originalRemoveChild.call(child.parentNode, child);
      } catch {
        /* ignore — node already detached */
      }
      return child;
    }
    return originalRemoveChild.call(this, child, ...args) as Node;
  };

  const patchedInsertBefore = function (
    this: Node,
    newNode: Node,
    referenceNode: Node | null,
    ...args: unknown[]
  ): Node {
    // The classic crash: referenceNode was re-parented by the extension, so
    // it no longer belongs to `this`. Re-anchor the reference node first.
    if (referenceNode && referenceNode.parentNode !== this) {
      try {
        if (referenceNode.parentNode) {
          originalRemoveChild.call(referenceNode.parentNode, referenceNode);
        }
      } catch {
        /* ignore */
      }
      try {
        return originalInsertBefore.call(this, newNode, referenceNode, ...args) as Node;
      } catch {
        // Last resort: append (order is cosmetic; crash is fatal).
        return originalRemoveChild
          ? (this.appendChild(newNode) as Node)
          : (newNode as Node);
      }
    }
    return originalInsertBefore.call(this, newNode, referenceNode, ...args) as Node;
  };

  proto.removeChild = patchedRemoveChild;
  proto.insertBefore = patchedInsertBefore;
  proto.__cgTfPatched = true;

  // Restore originals (used only by tests / unmount of the provider).
  return () => {
    try {
      proto.removeChild = originalRemoveChild;
      proto.insertBefore = originalInsertBefore;
      proto.__cgTfPatched = false;
    } catch {
      /* ignore */
    }
  };
}

export function TranslationFix() {
  useEffect(() => {
    const restore = installPatch();
    return restore;
  }, []);

  return null;
}
