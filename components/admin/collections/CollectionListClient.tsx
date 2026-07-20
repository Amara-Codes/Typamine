"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit, Layers, AlertTriangle } from "lucide-react";
import ContentTable from "@/components/common/ContentTable";
import DeleteButton from "@/components/common/DeleteButton";
import { deleteFormula } from "@/lib/actions/formula";
import { ListHeaderHandlers, ListPagination } from "@/components/common/ListHandlers";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { useRouter } from "next/navigation";

interface CollectionListClientProps {
  formulas: any[];
  totalCount: number;
  canUpdate: boolean;
  canDelete: boolean;
}

export default function CollectionListClient({ formulas, totalCount, canUpdate, canDelete }: CollectionListClientProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === formulas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(formulas.map((f) => f.id));
    }
  };

  const executeBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteFormula(id)));
      setIsSelectionMode(false);
      setSelectedIds([]);
      setIsModalOpen(false);
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Bulk deletion failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <ListHeaderHandlers
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        selectedCount={selectedIds.length}
        buttonLabel="Select Collections"
        canMassAction={canDelete}
        massActions={[
          {
            label: "Delete Selected",
            variant: "primary",
            onClick: () => setIsModalOpen(true),
          },
        ]}
        sortOptions={[
          { label: "Newest Created", value: "createdAt_desc" },
          { label: "Oldest Created", value: "createdAt_asc" },
          { label: "Name (A-Z)", value: "name_asc" },
          { label: "Name (Z-A)", value: "name_desc" },
        ]}
        searchPlaceholder="Search collections by name, slug or description..."
      />

      <div className="border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <ContentTable
          data={formulas}
          keyExtractor={(f: any) => f.id}
          emptyStateText="No collections match your search criteria."
          isSelectionMode={isSelectionMode}
          selectedIds={selectedIds}
          onToggleSelectRow={handleToggleSelectRow}
          onToggleSelectAll={handleToggleSelectAll}
          columns={[
            {
              key: "name",
              header: "Collection / Slug",
              className: "flex-[2] min-w-0",
              render: (f: any) => (
                <div className="min-w-0 py-1">
                  <p className="font-star text-xl font-bold text-black dark:text-white leading-tight truncate">
                    {f.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wider mt-0.5 truncate">
                    /{f.slug}
                  </p>
                </div>
              ),
            },
            {
              key: "fontCategory",
              header: "Category",
              className: "flex-1 hidden sm:block",
              render: (f: any) => (
                <div className="px-3 py-1.5 rounded-md bg-bluegray-200 text-black dark:bg-redgray-800 dark:text-white flex items-center gap-2 border border-blue-800 dark:border-red-200 shadow-sm text-xs max-w-fit mt-1">
                  <span className="text-[10px] font-black uppercase tracking-tighter">{f.fontCategory}</span>
                </div>
              ),
            },
            {
              key: "fonts",
              header: "Fonts",
              className: "flex-1 hidden md:block",
              render: (f: any) => (
                <div className="flex items-center gap-2 text-xs font-bold text-black dark:text-white">
                  <Layers className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  {f.fonts?.length || 0} Fonts
                </div>
              ),
            },
            {
              key: "tags",
              header: "Tags",
              className: "flex-1 hidden lg:block",
              render: (f: any) => (
                <div className="flex flex-wrap gap-1">
                  {(f.tags || []).map((t: any) => (
                    <Badge key={t.id} className="text-[9px] py-0 px-2">
                      {t.name}
                    </Badge>
                  ))}
                  {(!f.tags || f.tags.length === 0) && (
                    <span className="text-xs text-zinc-400 italic">No tags</span>
                  )}
                </div>
              ),
            },
          ]}
          rowActions={(f: any) => (
            <>
              {canUpdate && (
                <Link
                  href={`/admin/collections/${f.id}/edit`}
                  className="p-2.5 text-bluegray-800 dark:text-redgray-200 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-white/10 rounded-md transition-all shadow-sm backdrop-blur-md"
                  title="Edit Collection"
                >
                  <Edit className="h-4 w-4" />
                </Link>
              )}
              {canDelete && (
                <DeleteButton
                  id={f.id}
                  name={f.name}
                  entityName="collection"
                  onDelete={deleteFormula}
                  confirmDescription="This will permanently delete this collection from the database."
                />
              )}
            </>
          )}
        />

        <ListPagination
          totalCount={totalCount}
          entityNamePlural="Collections"
        />
      </div>

      {/* Bulk Delete Confirmation Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => !isProcessing && setIsModalOpen(false)}>
        <BaseModal.Header onClose={() => !isProcessing && setIsModalOpen(false)}>
          <div className="flex items-end gap-4">
            <div className="p-2 rounded-xl bg-red/10">
              <AlertTriangle className="w-6 h-6 text-red" />
            </div>
            <h2 className="text-2xl font-star text-black dark:text-white">Confirm Bulk Deletion</h2>
          </div>
        </BaseModal.Header>
        <BaseModal.Body>
          <div className="space-y-4">
            <p className="text-xl font-star text-center mb-8 font-bold text-black dark:text-white leading-tight">
              Delete {selectedIds.length} selected collection{selectedIds.length !== 1 && "s"}?
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              This will permanently delete the selected collections from the database. This action cannot be undone.
            </p>
          </div>
        </BaseModal.Body>
        <BaseModal.Footer>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="outline"
              size="md"
              roundness="lg"
              fullWidth
              className="sm:w-auto"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={executeBulkDelete}
              variant="primary"
              size="md"
              roundness="lg"
              fullWidth
              className="sm:w-auto flex items-center gap-2"
              disabled={isProcessing}
              isLoading={isProcessing}
            >
              Confirm Bulk Delete
            </Button>
          </div>
        </BaseModal.Footer>
      </BaseModal>
    </div>
  );
}
