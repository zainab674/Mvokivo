
import { Phone } from "lucide-react";
import { PageHeading, PageSubtext } from "@/components/ui/typography";
import { IconBackground } from "@/components/ui/icon-background";

export default function CallsHeader() {
  return (
    <div className="backdrop-blur-sm">
      <div className="container flex flex-col space-y-[var(--space-md)] sm:space-y-[var(--space-lg)] py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-[var(--space-lg)] max-w-7xl mx-auto w-full">
          <IconBackground
            icon={Phone}
            className="bg-primary/10 text-primary liquid-rounded-xl p-[var(--space-sm)] sm:p-[var(--space-md)]"
          />
          <div>
            <PageHeading className="text-2xl sm:text-3xl lg:text-4xl font-[var(--font-extralight)] text-foreground">
              Call Logs
            </PageHeading>
            <PageSubtext className="mt-1 sm:mt-2 text-sm sm:text-base font-[var(--font-light)] text-muted-foreground">
              View and manage all customer call records
            </PageSubtext>
          </div>
        </div>
      </div>
    </div>
  );
}
