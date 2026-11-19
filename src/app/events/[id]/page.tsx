import { redirect } from 'next/navigation';

export default function EventDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/calculation?id=${params.id}`);
}
