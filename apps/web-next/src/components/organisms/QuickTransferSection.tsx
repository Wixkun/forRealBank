'use client';

import { TransferFormCard } from '@/components/molecules/TransferFormCard';

type QuickTransferSectionProps = {
  onTransfer: (data: { amount: string; recipient: string; description: string }) => void;
  labels: {
    title: string;
    amount: string;
    recipient: string;
    description: string;
    submit: string;
  };
};

export function QuickTransferSection({ onTransfer, labels }: QuickTransferSectionProps) {
  return (
    <section>
      <TransferFormCard onSubmit={onTransfer} labels={labels} />
    </section>
  );
}
