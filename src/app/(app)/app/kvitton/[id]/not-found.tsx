import { FileQuestion } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/ui";

export default function ReceiptNotFound() {
  return (
    <div className="animate-fade-up">
      <EmptyState
        icon={<FileQuestion className="h-10 w-10" aria-hidden />}
        title="Kvittot hittades inte"
        description="Länken kan vara fel, eller så har kvittot raderats permanent. Kvitton i papperskorgen hittar du under Papperskorg."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/app/kvitton">Till dina kvitton</ButtonLink>
            <ButtonLink href="/app/papperskorg" variant="outline">
              Öppna papperskorgen
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
