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

type ReapplySystemTagsDialogProps = {
	open: boolean;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirmReapply: () => void;
};

export function ReapplySystemTagsDialog({
	open,
	isPending,
	onOpenChange,
	onConfirmReapply,
}: ReapplySystemTagsDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Reapply system tags to all images?</AlertDialogTitle>
					<AlertDialogDescription>
						This recalculates system tag assignments for every image. It may take some time on
						larger libraries.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={isPending}
						onClick={(event) => {
							event.preventDefault();
							onConfirmReapply();
						}}
					>
						Reapply
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
