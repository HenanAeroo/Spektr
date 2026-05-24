import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-spektr-border rounded-[12px] p-6 max-w-[420px]">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-montserrat font-bold text-[16px] text-spektr-dark">
            {title}
          </DialogTitle>
          <DialogDescription className="font-source-sans text-[13px] text-gray-500 mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 rounded-lg border-[1.5px] border-spektr-border bg-white font-montserrat font-semibold text-[13px] text-gray-500 cursor-pointer hover:border-gray-400 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="flex-1 py-2.5 rounded-lg border-none bg-[#dc2626] font-montserrat font-bold text-[13px] text-white cursor-pointer hover:bg-[#b91c1c] transition-colors"
          >
            {confirmLabel ?? "Supprimer"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
