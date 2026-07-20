"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteBlogPost } from "@/lib/actions/blog";
import { useRouter } from "next/navigation";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/common/Button";

export default function DeletePostButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBlogPost(id);
      setShowConfirm(false);
      router.refresh();
    } catch (error) {
      alert("Failed to delete post.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="p-2.5 text-black/40 dark:text-white/50 hover:text-red-500 dark:hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50 shadow-sm"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>

      <BaseModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
      >
        <BaseModal.Header onClose={() => setShowConfirm(false)}>
          <div className="flex items-end gap-4">
            <div className="p-2 bg-red-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-star text-black dark:text-white">Confirm Deletion</h2>
          </div>
        </BaseModal.Header>

        <BaseModal.Body>
          <div className="space-y-4">
            <p className="text-lg font-bold text-black dark:text-white leading-tight">
              Are you sure you want to delete this blog post?
            </p>
            <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed">
              This article will be removed from the public site and cannot be recovered.
            </p>
          </div>
        </BaseModal.Body>

        <BaseModal.Footer>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
            <Button
              onClick={() => setShowConfirm(false)}
              variant="outline"
              size="md"
              roundness="lg"
              fullWidth
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              size="md"
              roundness="lg"
              fullWidth
              className="sm:w-auto flex items-center gap-2"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDeleting ? "Deleting..." : "Delete Post"}
            </Button>
          </div>
        </BaseModal.Footer>
      </BaseModal>
    </>
  );
}
