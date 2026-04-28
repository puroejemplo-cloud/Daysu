import BookingConfirmation from "@/components/booking/BookingConfirmation";

export default async function ReservaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingConfirmation bookingId={id} />;
}
