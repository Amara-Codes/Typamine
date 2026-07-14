"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteRole } from "@/lib/actions/role";
import { useRouter } from "next/navigation";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/common/Button";

export default function DeleteRoleButton({ id, name }: { id: string, name: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRole(id);
      setShowConfirm(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete role.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="p-2.5 text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50 shadow-sm"
      >
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>

      <BaseModal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <BaseModal.Header onClose={() => setShowConfirm(false)}>
          <div className="flex items-end gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-star text-zinc-900 dark:text-white">Confirm Deletion</h2>
          </div>
        </BaseModal.Header>
        <BaseModal.Body>
          <div className="space-y-4">
            <p className="text-xl font-star text-center mb-8 font-bold text-zinc-900 dark:text-white leading-tight">
              Delete role {name}?
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Ensure no users are currently assigned to this role before deletion.
            </p>
          </div>
        </BaseModal.Body>
        <BaseModal.Footer>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
            <Button onClick={() => setShowConfirm(false)} variant="outline" size="md" roundness="xl" fullWidth className="sm:w-auto">Cancel</Button>
            <Button onClick={handleDelete} variant="primary" size="md" roundness="xl" fullWidth className="sm:w-auto flex items-center gap-2" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDeleting ? "Deleting..." : "Delete Role"}
            </Button>
          </div>
        </BaseModal.Footer>
      </BaseModal>
    </>
  );
}
