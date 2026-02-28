import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { DeleteTarget } from "./types";

type DeleteConfirmDialogProps = {
	deleteTarget: DeleteTarget | null;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirmDelete: () => void;
};

export function DeleteConfirmDialog({
	deleteTarget,
	isPending,
	onOpenChange,
	onConfirmDelete,
}: DeleteConfirmDialogProps) {
	return (
		<AlertDialog open={deleteTarget !== null} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{deleteTarget?.type === "kind" ? "Delete tag kind" : "Delete tag"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{deleteTarget
							? `This will permanently delete ${deleteTarget.type} "${deleteTarget.name}".`
							: "This action cannot be undone."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={isPending}
						onClick={(event) => {
							event.preventDefault();
							onConfirmDelete();
						}}
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
